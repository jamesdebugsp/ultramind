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

    const expectedToken = Deno.env.get("WHATSAPP_WEBHOOK_VERIFY_TOKEN") || "ultramind_webhook_verify";

    if (mode === "subscribe" && verifyToken === expectedToken) {
      console.log("Webhook verified successfully");
      return new Response(challenge, { status: 200 });
    }

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
    console.log("Webhook received:", JSON.stringify(body).substring(0, 500));

    const serviceClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Process status updates from Meta
    const entries = body?.entry || [];
    for (const entry of entries) {
      const changes = entry?.changes || [];
      for (const change of changes) {
        const statuses = change?.value?.statuses || [];
        for (const statusUpdate of statuses) {
          const messageId = statusUpdate?.id;
          const status = statusUpdate?.status; // sent, delivered, read, failed
          const recipientId = statusUpdate?.recipient_id;
          const timestamp = statusUpdate?.timestamp;
          const errors = statusUpdate?.errors;

          if (!messageId || !status) continue;

          console.log(`Status update: ${messageId} -> ${status}`);

          // Map Meta status to our status
          let mappedStatus = status;
          let errorCode = null;
          let errorMessage = null;

          if (status === "failed" && errors?.length > 0) {
            errorCode = errors[0]?.code?.toString();
            errorMessage = errors[0]?.title || errors[0]?.message;
          }

          // Update message in database
          const { error } = await serviceClient
            .from("whatsapp_business_messages")
            .update({
              status: mappedStatus,
              status_updated_at: timestamp
                ? new Date(parseInt(timestamp) * 1000).toISOString()
                : new Date().toISOString(),
              ...(errorCode ? { error_code: errorCode } : {}),
              ...(errorMessage ? { error_message: errorMessage } : {}),
            })
            .eq("message_id", messageId);

          if (error) {
            console.error(`Error updating message ${messageId}:`, error);
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
    console.error("Webhook processing error:", err);
    // Still return 200 to prevent Meta from retrying
    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
