import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ReminderPayload {
  appointment_id: string;
  client_name: string;
  client_whatsapp: string;
  business_name: string;
  service_name: string;
  date: string;
  time: string;
  reminder_type?: 'confirmation' | 'reminder';
}

function formatPhone(phone: string): string {
  const cleaned = phone.replace(/\D/g, "");
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
  });
}

function generateReminderMessage(data: ReminderPayload): string {
  return `🔔 *Lembrete de Agendamento*

Olá ${data.client_name}!

Seu horário está se aproximando:
📅 *Data:* ${formatDate(data.date)}
⏰ *Horário:* ${data.time}
💼 *Serviço:* ${data.service_name}
🏢 *Local:* ${data.business_name}

Por favor, confirme sua presença respondendo:
✅ SIM - para confirmar
❌ NÃO - para cancelar

_Lembrete automático UltraMind_`;
}

function generateConfirmationMessage(data: ReminderPayload): string {
  return `✅ *Agendamento Confirmado!*

Olá ${data.client_name}!

Seu horário foi confirmado com sucesso.

📅 *Data:* ${formatDate(data.date)}
⏰ *Horário:* ${data.time}
💼 *Serviço:* ${data.service_name}
🏢 *Local:* ${data.business_name}

Qualquer dúvida, estamos à disposição.

_Confirmação automática UltraMind_`;
}

function generateWhatsAppUrl(phone: string, message: string): string {
  const formattedPhone = formatPhone(phone);
  const encodedMessage = encodeURIComponent(message);
  return `https://api.whatsapp.com/send?phone=${formattedPhone}&text=${encodedMessage}`;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const payload: ReminderPayload = await req.json();

    console.log("Processing reminder:", payload);

    if (!payload.client_name || !payload.client_whatsapp || !payload.date || !payload.time) {
      throw new Error("Missing required fields");
    }

    const reminderType = payload.reminder_type || 'reminder';
    const message = reminderType === 'confirmation' 
      ? generateConfirmationMessage(payload)
      : generateReminderMessage(payload);

    const whatsappUrl = generateWhatsAppUrl(payload.client_whatsapp, message);

    // Create or update reminder record
    if (payload.appointment_id) {
      const { error: reminderError } = await supabase
        .from('reminders')
        .upsert({
          appointment_id: payload.appointment_id,
          user_id: (await supabase.auth.getUser()).data.user?.id,
          reminder_type: 'whatsapp',
          scheduled_for: new Date().toISOString(),
          sent_at: new Date().toISOString(),
          status: 'sent',
          message,
        });

      if (reminderError) {
        console.error("Error saving reminder:", reminderError);
      }
    }

    console.log("Reminder processed successfully");

    return new Response(
      JSON.stringify({
        success: true,
        whatsappUrl,
        message,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("Error in send-reminder:", error);
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
