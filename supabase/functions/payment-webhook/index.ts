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
  data: {
    id: string;
  };
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const accessToken = Deno.env.get("MERCADOPAGO_ACCESS_TOKEN");

    if (!accessToken) {
      throw new Error("MERCADOPAGO_ACCESS_TOKEN not configured");
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Parse webhook payload
    const body: MercadoPagoWebhook = await req.json();
    console.log("Webhook received:", JSON.stringify(body, null, 2));

    // Only process payment notifications
    if (body.type !== "payment") {
      console.log("Ignoring non-payment notification:", body.type);
      return new Response(JSON.stringify({ received: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const paymentId = body.data.id;
    console.log("Processing payment:", paymentId);

    // Fetch payment details from Mercado Pago
    const mpResponse = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!mpResponse.ok) {
      const errorText = await mpResponse.text();
      console.error("Error fetching payment from MP:", errorText);
      throw new Error(`Failed to fetch payment from Mercado Pago: ${errorText}`);
    }

    const mpPayment = await mpResponse.json();
    console.log("Mercado Pago payment data:", JSON.stringify(mpPayment, null, 2));

    const externalReference = mpPayment.external_reference;
    if (!externalReference) {
      console.log("No external reference found, skipping");
      return new Response(JSON.stringify({ received: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Find payment in our database
    const { data: payment, error: fetchError } = await supabase
      .from("payments")
      .select("*")
      .eq("external_reference", externalReference)
      .single();

    if (fetchError || !payment) {
      console.error("Payment not found in database:", externalReference, fetchError);
      return new Response(JSON.stringify({ received: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log("Found payment in database:", payment.id);

    // Map Mercado Pago status to our status
    let status: string;
    switch (mpPayment.status) {
      case "approved":
        status = "approved";
        break;
      case "pending":
      case "in_process":
      case "authorized":
        status = "pending";
        break;
      case "rejected":
        status = "rejected";
        break;
      case "cancelled":
        status = "cancelled";
        break;
      case "refunded":
      case "charged_back":
        status = "refunded";
        break;
      default:
        status = mpPayment.status;
    }

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
      console.error("Error updating payment:", updateError);
      throw new Error("Failed to update payment record");
    }

    console.log("Payment updated to status:", status);

    // Process approved payments
    if (status === "approved" && payment.status !== "approved") {
      console.log("Processing approved payment...");
      
      const { data: processResult, error: processError } = await supabase.rpc(
        "process_approved_payment",
        { p_payment_id: payment.id }
      );

      if (processError) {
        console.error("Error processing payment:", processError);
      } else {
        console.log("Payment processed successfully:", processResult);
      }
    }

    // Handle refunds - revert subscription/credits
    if (status === "refunded" && payment.status !== "refunded") {
      console.log("Processing refund...");
      
      if (payment.type === "credits" && payment.credits_amount) {
        // First get current extra_credits
        const { data: currentSub, error: fetchSubError } = await supabase
          .from("subscriptions")
          .select("extra_credits")
          .eq("user_id", payment.user_id)
          .single();

        if (!fetchSubError && currentSub) {
          const newCredits = Math.max(0, currentSub.extra_credits - payment.credits_amount);
          const { error: refundError } = await supabase
            .from("subscriptions")
            .update({
              extra_credits: newCredits,
              updated_at: new Date().toISOString(),
            })
            .eq("user_id", payment.user_id);

          if (refundError) {
            console.error("Error processing refund:", refundError);
          }
        }
      }
      // For plan refunds, we might want to downgrade or cancel the subscription
      // This depends on business rules
    }

    return new Response(
      JSON.stringify({ 
        received: true, 
        payment_id: payment.id,
        status 
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: unknown) {
    console.error("Webhook error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    // Always return 200 to Mercado Pago to prevent retries on our errors
    return new Response(
      JSON.stringify({ received: true, error: errorMessage }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
