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
    // 1. Authenticate the user from Authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      console.error("Missing Authorization header");
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Verify the JWT and get user
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      console.error("Invalid token:", authError);
      return new Response(
        JSON.stringify({ error: 'Invalid token' }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const payload: ReminderPayload = await req.json();

    console.log("Processing reminder for user:", user.id, "appointment:", payload.appointment_id);

    // Validate required fields
    if (!payload.client_name || !payload.client_whatsapp || !payload.date || !payload.time) {
      console.error("Missing required fields in payload");
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 2. Verify appointment ownership BEFORE processing
    if (payload.appointment_id) {
      const { data: appointment, error: apptError } = await supabase
        .from('appointments')
        .select('user_id')
        .eq('id', payload.appointment_id)
        .single();

      if (apptError || !appointment) {
        console.error("Appointment not found:", payload.appointment_id);
        return new Response(
          JSON.stringify({ error: 'Appointment not found' }),
          { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      if (appointment.user_id !== user.id) {
        console.error("Unauthorized: User", user.id, "does not own appointment", payload.appointment_id);
        return new Response(
          JSON.stringify({ error: 'Unauthorized: You do not own this appointment' }),
          { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    // 3. Process the reminder
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
          user_id: user.id, // Use authenticated user's ID
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

    console.log("Reminder processed successfully for user:", user.id);

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
  } catch (error: unknown) {
    console.error("Error in send-reminder:", error);
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
