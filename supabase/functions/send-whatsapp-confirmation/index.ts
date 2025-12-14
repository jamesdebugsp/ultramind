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
    return `55${cleaned}`;
  }
  return cleaned;
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

function generateWhatsAppUrl(phone: string, message: string): string {
  const formattedPhone = formatPhone(phone);
  const encodedMessage = encodeURIComponent(message);
  return `https://api.whatsapp.com/send?phone=${formattedPhone}&text=${encodedMessage}`;
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

    // Generate WhatsApp URLs
    const clientWhatsAppUrl = generateWhatsAppUrl(payload.client_whatsapp, clientMessage);
    const businessWhatsAppUrl = payload.business_whatsapp 
      ? generateWhatsAppUrl(payload.business_whatsapp, businessMessage)
      : null;

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
        clientWhatsAppUrl,
        businessWhatsAppUrl,
        clientMessage,
        businessMessage,
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
