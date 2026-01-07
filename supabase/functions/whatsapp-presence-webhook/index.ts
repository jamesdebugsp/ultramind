import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-twilio-signature",
};

interface PresenceResponse {
  appointment_id: string;
  response: "sim" | "nao" | "yes" | "no";
  client_phone?: string;
}

// Create HMAC-SHA1 signature using Web Crypto API
async function createHmacSha1(key: string, data: string): Promise<string> {
  const encoder = new TextEncoder();
  const keyData = encoder.encode(key);
  const dataToSign = encoder.encode(data);

  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    keyData,
    { name: "HMAC", hash: "SHA-1" },
    false,
    ["sign"]
  );

  const signature = await crypto.subtle.sign("HMAC", cryptoKey, dataToSign);
  return btoa(String.fromCharCode(...new Uint8Array(signature)));
}

// Validate Twilio webhook signature
async function validateTwilioSignature(
  signature: string | null,
  url: string,
  params: Record<string, string>
): Promise<boolean> {
  if (!signature) {
    console.error("Missing Twilio signature header");
    return false;
  }

  const authToken = Deno.env.get("TWILIO_AUTH_TOKEN");
  if (!authToken) {
    console.error("TWILIO_AUTH_TOKEN not configured");
    return false;
  }

  // Build the data string: URL + sorted params concatenated
  const sortedKeys = Object.keys(params).sort();
  const dataString = url + sortedKeys.map(key => `${key}${params[key]}`).join("");

  const expectedSignature = await createHmacSha1(authToken, dataString);

  // Use timing-safe comparison to prevent timing attacks
  if (signature.length !== expectedSignature.length) {
    return false;
  }
  
  let result = 0;
  for (let i = 0; i < signature.length; i++) {
    result |= signature.charCodeAt(i) ^ expectedSignature.charCodeAt(i);
  }
  return result === 0;
}

// Validate signed token for non-Twilio webhooks
async function validateSignedToken(
  token: string | null,
  appointmentId: string
): Promise<boolean> {
  if (!token || !appointmentId) {
    return false;
  }

  const authToken = Deno.env.get("TWILIO_AUTH_TOKEN");
  if (!authToken) {
    console.error("TWILIO_AUTH_TOKEN not configured for token validation");
    return false;
  }

  const rawSignature = await createHmacSha1(authToken, appointmentId);
  const expectedToken = rawSignature
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');

  // Use timing-safe comparison
  if (token.length !== expectedToken.length) {
    return false;
  }
  
  let result = 0;
  for (let i = 0; i < token.length; i++) {
    result |= token.charCodeAt(i) ^ expectedToken.charCodeAt(i);
  }
  return result === 0;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const url = new URL(req.url);
    const twilioSignature = req.headers.get("X-Twilio-Signature");
    
    let payload: PresenceResponse;
    let isAuthenticated = false;

    // Check if this is a Twilio webhook (form-urlencoded) or JSON request
    const contentType = req.headers.get("content-type") || "";
    
    if (contentType.includes("application/x-www-form-urlencoded")) {
      // Twilio webhook - validate signature
      const formData = await req.formData();
      const params: Record<string, string> = {};
      
      formData.forEach((value, key) => {
        params[key] = value.toString();
      });

      // Validate Twilio signature
      isAuthenticated = await validateTwilioSignature(
        twilioSignature,
        url.origin + url.pathname,
        params
      );

      if (!isAuthenticated) {
        console.error("Invalid Twilio signature");
        return new Response(
          JSON.stringify({ error: "Unauthorized - Invalid signature" }),
          {
            status: 401,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      // Extract appointment_id and response from Twilio webhook data
      const body = params.Body?.toLowerCase().trim() || "";
      const appointmentId = url.searchParams.get("appointment_id") || params.appointment_id;
      
      if (!appointmentId) {
        throw new Error("appointment_id is required");
      }

      payload = {
        appointment_id: appointmentId,
        response: body as "sim" | "nao" | "yes" | "no",
        client_phone: params.From
      };
    } else {
      // JSON request - validate signed token
      payload = await req.json();
      const token = url.searchParams.get("token");

      if (!payload.appointment_id) {
        throw new Error("appointment_id is required");
      }

      isAuthenticated = await validateSignedToken(token, payload.appointment_id);

      if (!isAuthenticated) {
        console.error("Invalid or missing authentication token");
        return new Response(
          JSON.stringify({ error: "Unauthorized - Invalid or missing token" }),
          {
            status: 401,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
    }
    
    console.log("Processing authenticated presence response:", { 
      appointment_id: payload.appointment_id,
      response: payload.response 
    });

    // Normalize response
    const isConfirmed = ["sim", "yes", "s", "1"].includes(
      (payload.response || "").toLowerCase().trim()
    );

    const newStatus = isConfirmed ? "confirmado" : "cancelado";

    // Update appointment status
    const { data, error } = await supabase
      .from("appointments")
      .update({ 
        status: newStatus,
        confirmed_at: isConfirmed ? new Date().toISOString() : null
      })
      .eq("id", payload.appointment_id)
      .select()
      .single();

    if (error) {
      console.error("Error updating appointment:", error);
      throw error;
    }

    console.log(`Appointment ${payload.appointment_id} updated to ${newStatus}`);

    return new Response(
      JSON.stringify({
        success: true,
        status: newStatus,
        appointment: data,
        message: isConfirmed 
          ? "Presença confirmada com sucesso!" 
          : "Agendamento cancelado conforme solicitado."
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("Error in whatsapp-presence-webhook:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
};

serve(handler);
