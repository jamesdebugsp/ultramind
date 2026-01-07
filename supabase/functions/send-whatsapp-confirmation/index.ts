import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface AppointmentConfirmation {
  appointment_id: string;
  client_name: string;
  client_whatsapp: string;
  business_name: string;
  business_whatsapp: string;
  service_name: string;
  date: string;
  time: string;
}

function formatPhone(phone: string): string {
  // Remove all non-numeric characters
  const cleaned = phone.replace(/\D/g, "");
  // Add Brazil country code if not present
  if (cleaned.length === 10 || cleaned.length === 11) {
    return `+55${cleaned}`;
  }
  if (cleaned.startsWith("55") && cleaned.length >= 12) {
    return `+${cleaned}`;
  }
  return `+${cleaned}`;
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr + "T12:00:00");
  return date.toLocaleDateString("pt-BR", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

function generateClientMessage(data: AppointmentConfirmation): string {
  return `✅ *Agendamento confirmado!*

Olá ${data.client_name}, seu horário foi confirmado com sucesso.

🏢 *${data.business_name}*
🗓 *Data:* ${formatDate(data.date)}
⏰ *Horário:* ${data.time}
💼 *Serviço:* ${data.service_name}

Qualquer dúvida, estamos à disposição no WhatsApp.

_Agendamento realizado via UltraMind_`;
}

function generateBusinessMessage(data: AppointmentConfirmation): string {
  return `📢 *Novo agendamento!*

👤 *Cliente:* ${data.client_name}
📞 *WhatsApp:* ${data.client_whatsapp}
🗓 *Data:* ${formatDate(data.date)}
⏰ *Horário:* ${data.time}
💼 *Serviço:* ${data.service_name}

_Notificação automática UltraMind_`;
}

async function sendTwilioWhatsApp(to: string, body: string): Promise<{ success: boolean; error?: string }> {
  const accountSid = Deno.env.get("TWILIO_ACCOUNT_SID");
  const authToken = Deno.env.get("TWILIO_AUTH_TOKEN");
  const fromNumber = Deno.env.get("TWILIO_WHATSAPP_FROM");

  if (!accountSid || !authToken || !fromNumber) {
    console.error("Missing Twilio credentials");
    return { success: false, error: "Twilio credentials not configured" };
  }

  const formattedTo = formatPhone(to);
  const formattedFrom = fromNumber.startsWith("whatsapp:") ? fromNumber : `whatsapp:${fromNumber}`;
  const formattedToWhatsApp = `whatsapp:${formattedTo}`;

  try {
    const url = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;
    
    const params = new URLSearchParams();
    params.append("To", formattedToWhatsApp);
    params.append("From", formattedFrom);
    params.append("Body", body);

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Authorization": `Basic ${btoa(`${accountSid}:${authToken}`)}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: params.toString(),
    });

    const result = await response.json();

    if (!response.ok) {
      console.error("Twilio API error:", result);
      return { success: false, error: result.message || "Failed to send WhatsApp" };
    }

    console.log("WhatsApp sent successfully:", result.sid);
    return { success: true };
  } catch (error: any) {
    console.error("Error sending WhatsApp:", error);
    return { success: false, error: error.message };
  }
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

    const payload: AppointmentConfirmation = await req.json();
    
    console.log("Processing appointment confirmation:", payload);

    // Validate required fields
    if (!payload.client_name || !payload.client_whatsapp || !payload.business_name || !payload.service_name || !payload.date || !payload.time) {
      throw new Error("Missing required fields for confirmation");
    }

    // Generate messages
    const clientMessage = generateClientMessage(payload);
    const businessMessage = generateBusinessMessage(payload);

    // Send WhatsApp to client
    console.log("Sending WhatsApp to client:", payload.client_whatsapp);
    const clientResult = await sendTwilioWhatsApp(payload.client_whatsapp, clientMessage);
    
    if (!clientResult.success) {
      console.error("Failed to send to client:", clientResult.error);
    }

    // Send WhatsApp to business owner
    let businessResult: { success: boolean; error?: string } = { success: false, error: "No business WhatsApp" };
    if (payload.business_whatsapp) {
      console.log("Sending WhatsApp to business:", payload.business_whatsapp);
      businessResult = await sendTwilioWhatsApp(payload.business_whatsapp, businessMessage);
      
      if (!businessResult.success) {
        console.error("Failed to send to business:", businessResult.error);
      }
    }

    // Update appointment status to confirmed
    if (payload.appointment_id) {
      const { error: updateError } = await supabase
        .from("appointments")
        .update({ 
          status: "confirmado",
          confirmed_at: new Date().toISOString()
        })
        .eq("id", payload.appointment_id);

      if (updateError) {
        console.error("Error updating appointment:", updateError);
      }
    }

    console.log("Confirmation processed successfully");

    return new Response(
      JSON.stringify({
        success: true,
        clientMessageSent: clientResult.success,
        businessMessageSent: businessResult.success,
        clientError: clientResult.error,
        businessError: businessResult.error,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("Error in send-whatsapp-confirmation:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
};

serve(handler);
