import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const META_API_VERSION = "v18.0";
const MAX_MESSAGES_PER_MINUTE = 30;

// Simple in-memory rate limiter per user
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(userId: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(userId);
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(userId, { count: 1, resetAt: now + 60000 });
    return true;
  }
  if (entry.count >= MAX_MESSAGES_PER_MINUTE) {
    return false;
  }
  entry.count++;
  return true;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const userId = claimsData.claims.sub as string;

    // Rate limit check
    if (!checkRateLimit(userId)) {
      return new Response(
        JSON.stringify({ error: "Rate limit excedido. Aguarde 1 minuto." }),
        { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const body = await req.json();
    const { to, template_name, parameters = [], language = "pt_BR" } = body;

    // Validate inputs
    if (!to || !template_name) {
      return new Response(
        JSON.stringify({ error: "Campos 'to' e 'template_name' são obrigatórios" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Sanitize phone number
    const cleanPhone = to.replace(/[^0-9]/g, "");
    if (cleanPhone.length < 10 || cleanPhone.length > 15) {
      return new Response(
        JSON.stringify({ error: "Número de telefone inválido" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (template_name.length > 100) {
      return new Response(
        JSON.stringify({ error: "Nome do template inválido" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Fetch company credentials
    const serviceClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { data: config, error: configError } = await serviceClient
      .from("companies_whatsapp_config")
      .select("*")
      .eq("user_id", userId)
      .eq("is_verified", true)
      .single();

    if (configError || !config) {
      return new Response(
        JSON.stringify({ error: "WhatsApp Business não configurado. Conecte sua conta primeiro." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Build template components
    const components: any[] = [];
    if (parameters.length > 0) {
      components.push({
        type: "body",
        parameters: parameters.map((p: string) => ({
          type: "text",
          text: String(p).substring(0, 1024),
        })),
      });
    }

    // Create message record
    const { data: messageRecord, error: msgError } = await serviceClient
      .from("whatsapp_business_messages")
      .insert({
        user_id: userId,
        recipient_number: cleanPhone,
        template_name,
        template_params: parameters,
        status: "sending",
      })
      .select()
      .single();

    if (msgError) {
      console.error("Error creating message record:", msgError);
    }

    // Send via Meta API
    console.log(`Sending template '${template_name}' to ${cleanPhone}`);
    const metaPayload = {
      messaging_product: "whatsapp",
      to: cleanPhone,
      type: "template",
      template: {
        name: template_name,
        language: { code: language },
        ...(components.length > 0 ? { components } : {}),
      },
    };

    const metaResponse = await fetch(
      `https://graph.facebook.com/${META_API_VERSION}/${config.phone_number_id}/messages`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${config.access_token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(metaPayload),
      }
    );

    const metaResult = await metaResponse.json();

    if (!metaResponse.ok) {
      console.error("Meta API error:", metaResult);

      // Update message status to failed
      if (messageRecord) {
        await serviceClient
          .from("whatsapp_business_messages")
          .update({
            status: "failed",
            error_code: metaResult?.error?.code?.toString() || "unknown",
            error_message: metaResult?.error?.message || "Erro desconhecido",
            status_updated_at: new Date().toISOString(),
          })
          .eq("id", messageRecord.id);
      }

      // Check if retryable (rate limit or temporary server error)
      const isRetryable = metaResponse.status === 429 || metaResponse.status >= 500;
      if (isRetryable && messageRecord && messageRecord.retry_count < messageRecord.max_retries) {
        const nextRetry = new Date(Date.now() + (messageRecord.retry_count + 1) * 30000);
        await serviceClient
          .from("whatsapp_business_messages")
          .update({
            status: "retry_scheduled",
            retry_count: messageRecord.retry_count + 1,
            next_retry_at: nextRetry.toISOString(),
          })
          .eq("id", messageRecord.id);
      }

      return new Response(
        JSON.stringify({
          error: "Falha ao enviar mensagem",
          details: metaResult?.error?.message,
          retryable: isRetryable,
        }),
        { status: metaResponse.status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Update message with success
    const whatsappMessageId = metaResult?.messages?.[0]?.id;
    if (messageRecord) {
      await serviceClient
        .from("whatsapp_business_messages")
        .update({
          message_id: whatsappMessageId || null,
          status: "sent",
          status_updated_at: new Date().toISOString(),
        })
        .eq("id", messageRecord.id);
    }

    console.log("Message sent successfully:", whatsappMessageId);

    return new Response(
      JSON.stringify({
        success: true,
        message_id: whatsappMessageId,
        status: "sent",
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("Unexpected error:", err);
    return new Response(
      JSON.stringify({ error: "Erro interno do servidor" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
