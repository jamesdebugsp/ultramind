import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const META_API_VERSION = "v18.0";
const MAX_MESSAGES_PER_MINUTE = 30;
const RETRY_DELAYS = [5000, 15000, 30000]; // 5s, 15s, 30s

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

async function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function sendWithRetry(
  url: string,
  headers: Record<string, string>,
  body: any,
  maxRetries: number = 3
): Promise<{ response: Response; data: any; retryCount: number }> {
  let lastError: any;
  let retryCount = 0;

  for (let i = 0; i <= maxRetries; i++) {
    try {
      const response = await fetch(url, {
        method: "POST",
        headers,
        body: JSON.stringify(body),
      });

      const data = await response.json();

      // If success or permanent error, return
      if (response.ok || (response.status < 500 && response.status !== 429)) {
        return { response, data, retryCount };
      }

      // Retryable error
      lastError = data;
      retryCount = i + 1;

      if (i < maxRetries) {
        const delay = RETRY_DELAYS[i] || 30000;
        console.log(`Retry ${i + 1}/${maxRetries} after ${delay}ms...`);
        await sleep(delay);
      }
    } catch (err) {
      lastError = err;
      retryCount = i + 1;
      if (i < maxRetries) {
        await sleep(RETRY_DELAYS[i] || 30000);
      }
    }
  }

  return {
    response: new Response(JSON.stringify({ error: lastError }), { status: 500 }),
    data: { error: lastError },
    retryCount,
  };
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
        JSON.stringify({ error: "Rate limit excedido. Máximo de 30 mensagens por minuto." }),
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

    const serviceClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Check monthly limit
    const { data: canSend, error: limitError } = await serviceClient.rpc(
      "check_and_consume_wa_limit",
      { p_user_id: userId }
    );

    if (limitError) {
      console.error("Error checking limit:", limitError);
      return new Response(
        JSON.stringify({ error: "Erro ao verificar limite mensal" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!canSend) {
      // Get plan info for error message
      const { data: plan } = await serviceClient
        .from("company_whatsapp_plans")
        .select("plan_type, monthly_limit, messages_sent_current_month")
        .eq("user_id", userId)
        .single();

      return new Response(
        JSON.stringify({
          error: "Limite mensal de mensagens atingido",
          plan_type: plan?.plan_type || "basic",
          monthly_limit: plan?.monthly_limit || 1000,
          messages_sent: plan?.messages_sent_current_month || 0,
          upgrade_message: "Faça upgrade do seu plano para enviar mais mensagens.",
        }),
        { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Fetch company credentials
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

    // Minimum 1 second delay between sends (rate limiting)
    await sleep(1000);

    // Send via Meta API with retry
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

    const { response: metaResponse, data: metaResult, retryCount } = await sendWithRetry(
      `https://graph.facebook.com/${META_API_VERSION}/${config.phone_number_id}/messages`,
      {
        Authorization: `Bearer ${config.access_token}`,
        "Content-Type": "application/json",
      },
      metaPayload,
      3
    );

    if (!metaResponse.ok) {
      console.error("Meta API error after retries:", metaResult);

      if (messageRecord) {
        await serviceClient
          .from("whatsapp_business_messages")
          .update({
            status: "failed",
            error_code: metaResult?.error?.code?.toString() || "unknown",
            error_message: metaResult?.error?.message || "Erro desconhecido",
            status_updated_at: new Date().toISOString(),
            retry_count: retryCount,
          })
          .eq("id", messageRecord.id);
      }

      return new Response(
        JSON.stringify({
          error: "Falha ao enviar mensagem após tentativas",
          details: metaResult?.error?.message,
          retry_count: retryCount,
        }),
        { status: metaResponse.status >= 400 ? metaResponse.status : 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Success
    const whatsappMessageId = metaResult?.messages?.[0]?.id;
    if (messageRecord) {
      await serviceClient
        .from("whatsapp_business_messages")
        .update({
          message_id: whatsappMessageId || null,
          status: "sent",
          status_updated_at: new Date().toISOString(),
          retry_count: retryCount,
        })
        .eq("id", messageRecord.id);
    }

    console.log("Message sent successfully:", whatsappMessageId, `(${retryCount} retries)`);

    return new Response(
      JSON.stringify({
        success: true,
        message_id: whatsappMessageId,
        status: "sent",
        retry_count: retryCount,
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
