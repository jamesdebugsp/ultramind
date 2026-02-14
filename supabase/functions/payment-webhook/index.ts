import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface MercadoPagoWebhook {
  id: number;
  live_mode: boolean;
  type: string;
  date_created: string;
  user_id: number;
  api_version: string;
  action: string;
  data: { id: string };
}

// Helper: create admin alert
async function createAlert(
  supabase: ReturnType<typeof createClient>,
  alertType: string,
  severity: string,
  title: string,
  description: string,
  metadata: Record<string, unknown> = {}
) {
  const { error } = await supabase.from("admin_alerts").insert({
    alert_type: alertType,
    severity,
    title,
    description,
    metadata,
  });
  if (error) console.error("Failed to create alert:", error);
}

// Helper: log webhook event
async function logWebhookEvent(
  supabase: ReturnType<typeof createClient>,
  data: {
    event_type: string;
    event_action?: string;
    external_payment_id?: string;
    external_reference?: string;
    payment_id?: string;
    status: string;
    severity: string;
    payload?: unknown;
    response_data?: unknown;
    error_message?: string;
    processing_time_ms?: number;
  }
) {
  const { error } = await supabase.from("webhook_logs").insert(data);
  if (error) console.error("Failed to log webhook event:", error);
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();
  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  let rawBody: string | undefined;

  try {
    const accessToken = Deno.env.get("MERCADOPAGO_ACCESS_TOKEN");
    if (!accessToken) {
      await logWebhookEvent(supabase, {
        event_type: "config_error",
        status: "error",
        severity: "critical",
        error_message: "MERCADOPAGO_ACCESS_TOKEN not configured",
      });
      await createAlert(supabase, "config_error", "critical",
        "Token MP não configurado",
        "MERCADOPAGO_ACCESS_TOKEN não está configurado no ambiente."
      );
      throw new Error("MERCADOPAGO_ACCESS_TOKEN not configured");
    }

    // Parse body with error handling
    rawBody = await req.text();
    let body: MercadoPagoWebhook;
    try {
      body = JSON.parse(rawBody);
    } catch {
      await logWebhookEvent(supabase, {
        event_type: "parse_error",
        status: "error",
        severity: "error",
        payload: { raw: rawBody?.substring(0, 500) },
        error_message: "Invalid JSON payload",
        processing_time_ms: Date.now() - startTime,
      });
      return new Response(JSON.stringify({ received: true, error: "Invalid JSON" }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log("Webhook received:", body.type, body.action);

    // Non-payment events → log as warning and skip
    if (body.type !== "payment") {
      await logWebhookEvent(supabase, {
        event_type: body.type,
        event_action: body.action,
        status: "skipped",
        severity: "warning",
        payload: body,
        processing_time_ms: Date.now() - startTime,
      });
      return new Response(JSON.stringify({ received: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const paymentId = body.data.id;

    // Fetch payment from Mercado Pago
    const mpResponse = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!mpResponse.ok) {
      const errorText = await mpResponse.text();
      await logWebhookEvent(supabase, {
        event_type: "payment",
        event_action: body.action,
        external_payment_id: paymentId,
        status: "error",
        severity: "error",
        payload: body,
        response_data: { mp_status: mpResponse.status, mp_error: errorText.substring(0, 500) },
        error_message: `MP API error ${mpResponse.status}`,
        processing_time_ms: Date.now() - startTime,
      });
      await createAlert(supabase, "mp_api_error", "error",
        "Erro na API do Mercado Pago",
        `Falha ao buscar pagamento ${paymentId}: HTTP ${mpResponse.status}`,
        { payment_id: paymentId, http_status: mpResponse.status }
      );
      throw new Error(`Failed to fetch payment from Mercado Pago: ${errorText}`);
    }

    const mpPayment = await mpResponse.json();
    const externalReference = mpPayment.external_reference;

    if (!externalReference) {
      await logWebhookEvent(supabase, {
        event_type: "payment",
        event_action: body.action,
        external_payment_id: paymentId,
        status: "skipped",
        severity: "warning",
        error_message: "No external_reference found",
        processing_time_ms: Date.now() - startTime,
      });
      return new Response(JSON.stringify({ received: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Find payment in database
    const { data: payment, error: fetchError } = await supabase
      .from("payments")
      .select("*")
      .eq("external_reference", externalReference)
      .single();

    if (fetchError || !payment) {
      await logWebhookEvent(supabase, {
        event_type: "payment",
        event_action: body.action,
        external_payment_id: paymentId,
        external_reference: externalReference,
        status: "error",
        severity: "error",
        error_message: `Payment not found in DB: ${fetchError?.message || "no record"}`,
        processing_time_ms: Date.now() - startTime,
      });
      return new Response(JSON.stringify({ received: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Map MP status
    const statusMap: Record<string, string> = {
      approved: "approved",
      pending: "pending",
      in_process: "pending",
      authorized: "pending",
      rejected: "rejected",
      cancelled: "cancelled",
      refunded: "refunded",
      charged_back: "refunded",
    };
    const status = statusMap[mpPayment.status] || mpPayment.status;

    // Update payment record
    const updateData: Record<string, unknown> = {
      status,
      external_id: mpPayment.id.toString(),
      updated_at: new Date().toISOString(),
    };
    if (status === "approved") {
      updateData.paid_at = mpPayment.date_approved || new Date().toISOString();
    }

    const { error: updateError } = await supabase
      .from("payments")
      .update(updateData)
      .eq("id", payment.id);

    if (updateError) {
      await logWebhookEvent(supabase, {
        event_type: "payment",
        event_action: body.action,
        external_payment_id: paymentId,
        external_reference: externalReference,
        payment_id: payment.id,
        status: "error",
        severity: "critical",
        error_message: `DB update failed: ${updateError.message}`,
        processing_time_ms: Date.now() - startTime,
      });
      await createAlert(supabase, "db_update_error", "critical",
        "Falha ao atualizar pagamento",
        `Pagamento ${payment.id} não pôde ser atualizado para status ${status}.`,
        { payment_id: payment.id, external_id: paymentId }
      );
      throw new Error("Failed to update payment record");
    }

    // Handle rejected payments
    if (status === "rejected") {
      const reason = mpPayment.status_detail || "unknown";
      await logWebhookEvent(supabase, {
        event_type: "payment",
        event_action: "payment.rejected",
        external_payment_id: paymentId,
        external_reference: externalReference,
        payment_id: payment.id,
        status: "processed",
        severity: "warning",
        response_data: { rejection_reason: reason, mp_status_detail: mpPayment.status_detail },
        processing_time_ms: Date.now() - startTime,
      });
      return new Response(
        JSON.stringify({ received: true, payment_id: payment.id, status }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Process approved payments with retry
    if (status === "approved" && payment.status !== "approved") {
      let processSuccess = false;
      let lastError: string | null = null;
      const maxRetries = 3;

      for (let attempt = 1; attempt <= maxRetries; attempt++) {
        const { data: processResult, error: processError } = await supabase.rpc(
          "process_approved_payment",
          { p_payment_id: payment.id }
        );

        if (!processError && processResult) {
          processSuccess = true;
          break;
        }

        lastError = processError?.message || "process_approved_payment returned false";
        console.error(`Attempt ${attempt}/${maxRetries} failed:`, lastError);

        if (attempt < maxRetries) {
          await new Promise((r) => setTimeout(r, 1000 * attempt));
        }
      }

      if (!processSuccess) {
        await logWebhookEvent(supabase, {
          event_type: "payment",
          event_action: "process_failed",
          external_payment_id: paymentId,
          external_reference: externalReference,
          payment_id: payment.id,
          status: "error",
          severity: "critical",
          error_message: `process_approved_payment failed after ${maxRetries} retries: ${lastError}`,
          processing_time_ms: Date.now() - startTime,
        });
        await createAlert(supabase, "payment_process_failed", "critical",
          "⚠️ Pagamento aprovado NÃO liberou plano",
          `Pagamento ${payment.id} (R$${payment.amount}) aprovado mas process_approved_payment falhou após ${maxRetries} tentativas. Intervenção manual necessária.`,
          { payment_id: payment.id, user_id: payment.user_id, amount: payment.amount, plan: payment.plan, error: lastError }
        );
      } else {
        await logWebhookEvent(supabase, {
          event_type: "payment",
          event_action: "payment.approved",
          external_payment_id: paymentId,
          external_reference: externalReference,
          payment_id: payment.id,
          status: "processed",
          severity: "info",
          response_data: { plan: payment.plan, type: payment.type, amount: payment.amount },
          processing_time_ms: Date.now() - startTime,
        });
      }
    } else {
      // Other status updates (pending, refunded, etc.)
      await logWebhookEvent(supabase, {
        event_type: "payment",
        event_action: body.action,
        external_payment_id: paymentId,
        external_reference: externalReference,
        payment_id: payment.id,
        status: "processed",
        severity: "info",
        response_data: { new_status: status, old_status: payment.status },
        processing_time_ms: Date.now() - startTime,
      });
    }

    // Handle refunds
    if (status === "refunded" && payment.status !== "refunded") {
      if (payment.type === "credits" && payment.credits_amount) {
        const { data: currentSub } = await supabase
          .from("subscriptions")
          .select("extra_credits")
          .eq("user_id", payment.user_id)
          .single();

        if (currentSub) {
          const newCredits = Math.max(0, currentSub.extra_credits - payment.credits_amount);
          await supabase
            .from("subscriptions")
            .update({ extra_credits: newCredits, updated_at: new Date().toISOString() })
            .eq("user_id", payment.user_id);
        }
      }

      await createAlert(supabase, "payment_refunded", "warning",
        "Pagamento reembolsado",
        `Pagamento ${payment.id} de R$${payment.amount} foi reembolsado.`,
        { payment_id: payment.id, user_id: payment.user_id, amount: payment.amount }
      );
    }

    return new Response(
      JSON.stringify({ received: true, payment_id: payment.id, status }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Webhook error:", errorMessage);

    // Log critical unhandled error
    try {
      await logWebhookEvent(supabase, {
        event_type: "unhandled_error",
        status: "error",
        severity: "critical",
        payload: rawBody ? { raw: rawBody.substring(0, 1000) } : undefined,
        error_message: errorMessage,
        processing_time_ms: Date.now() - startTime,
      });
      await createAlert(supabase, "webhook_critical_error", "critical",
        "Erro crítico no webhook",
        `Erro não tratado no payment-webhook: ${errorMessage}`,
        { error: errorMessage }
      );
    } catch { /* prevent infinite error loop */ }

    return new Response(
      JSON.stringify({ received: true, error: errorMessage }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
