import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  // Handle webhook verification (GET request from Meta)
  if (req.method === "GET") {
    const url = new URL(req.url);
    const mode = url.searchParams.get("hub.mode");
    const verifyToken = url.searchParams.get("hub.verify_token");
    const challenge = url.searchParams.get("hub.challenge");

    const expectedToken = Deno.env.get("WHATSAPP_WEBHOOK_VERIFY_TOKEN") || "ultramind_verify_token";

    console.log(`[WEBHOOK GET] Verification request - mode: ${mode}, token match: ${verifyToken === expectedToken}`);

    if (mode === "subscribe" && verifyToken === expectedToken) {
      console.log("[WEBHOOK GET] ✅ Webhook verified successfully");
      return new Response(challenge, { status: 200 });
    }

    console.log("[WEBHOOK GET] ❌ Verification failed - invalid token or mode");
    return new Response("Forbidden", { status: 403 });
  }

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  try {
    const body = await req.json();
    console.log("[WEBHOOK POST] Received:", JSON.stringify(body).substring(0, 1000));

    const serviceClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const entries = body?.entry || [];
    for (const entry of entries) {
      const changes = entry?.changes || [];
      for (const change of changes) {
        const value = change?.value || {};

        // --- Process incoming MESSAGES ---
        const messages = value?.messages || [];
        const contacts = value?.contacts || [];
        const metadata = value?.metadata || {};

        for (const message of messages) {
          const senderNumber = message?.from;
          const messageText = message?.text?.body || message?.type || "[non-text]";
          const messageId = message?.id;
          const timestamp = message?.timestamp;
          const phoneNumberId = metadata?.phone_number_id;
          const contactName = contacts?.find((c: any) => c?.wa_id === senderNumber)?.profile?.name || "Desconhecido";

          console.log(`[WEBHOOK MSG] 📩 Mensagem recebida:`);
          console.log(`  De: ${senderNumber} (${contactName})`);
          console.log(`  Texto: ${messageText}`);
          console.log(`  Phone Number ID: ${phoneNumberId}`);
          console.log(`  Timestamp: ${timestamp}`);
          console.log(`  Message ID: ${messageId}`);

          // Log incoming message to webhook_logs for auditing
          await serviceClient.from("webhook_logs").insert({
            event_type: "whatsapp_incoming_message",
            event_action: message?.type || "text",
            status: "received",
            severity: "info",
            payload: {
              from: senderNumber,
              contact_name: contactName,
              text: messageText,
              phone_number_id: phoneNumberId,
              message_id: messageId,
              timestamp,
            },
          });
        }

        // --- Process STATUS UPDATES ---
        const statuses = value?.statuses || [];
        for (const statusUpdate of statuses) {
          const messageId = statusUpdate?.id;
          const status = statusUpdate?.status;
          const recipientId = statusUpdate?.recipient_id;
          const timestamp = statusUpdate?.timestamp;
          const errors = statusUpdate?.errors;

          if (!messageId || !status) continue;

          console.log(`[WEBHOOK STATUS] 📊 ${messageId} -> ${status} (to: ${recipientId})`);

          let errorCode = null;
          let errorMessage = null;

          if (status === "failed" && errors?.length > 0) {
            errorCode = errors[0]?.code?.toString();
            errorMessage = errors[0]?.title || errors[0]?.message;
            console.log(`[WEBHOOK STATUS] ❌ Error: ${errorCode} - ${errorMessage}`);
          }

          // Update message status in database
          const { error } = await serviceClient
            .from("whatsapp_business_messages")
            .update({
              status,
              status_updated_at: timestamp
                ? new Date(parseInt(timestamp) * 1000).toISOString()
                : new Date().toISOString(),
              ...(errorCode ? { error_code: errorCode } : {}),
              ...(errorMessage ? { error_message: errorMessage } : {}),
            })
            .eq("message_id", messageId);

          if (error) {
            console.error(`[WEBHOOK STATUS] Error updating message ${messageId}:`, error);
          }
        }
      }
    }

    // Always return 200 to Meta
    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("[WEBHOOK POST] ❌ Processing error:", err);
    // Still return 200 to prevent Meta from retrying
    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
