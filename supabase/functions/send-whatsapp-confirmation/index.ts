import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Time window in minutes for public booking confirmations (no auth)
const PUBLIC_CONFIRMATION_WINDOW_MINUTES = 5;

interface AppointmentConfirmation {
  appointment_id: string;
  client_name?: string;
  client_whatsapp?: string;
  business_name?: string;
  business_whatsapp?: string;
  service_name?: string;
  date?: string;
  time?: string;
}

function formatPhone(phone: string): string {
  const cleaned = phone.replace(/\D/g, "");
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

function generateClientMessage(clientName: string, businessName: string, dateStr: string, time: string, serviceName: string): string {
  return `✅ *Agendamento confirmado com sucesso!*

📅 *Data:* ${formatDate(dateStr)}
⏰ *Horário:* ${time}
✂️ *Serviço:* ${serviceName}
📍 *${businessName}*

Obrigado por agendar com a gente, ${clientName}!

_Agendamento realizado via UltraMind_`;
}

function generateBusinessMessage(clientName: string, clientWhatsapp: string, dateStr: string, time: string, serviceName: string): string {
  const formattedPhone = clientWhatsapp.replace(/(\d{2})(\d{5})(\d{4})/, "($1) $2-$3");
  return `📅 *Novo agendamento confirmado!*

👤 *Cliente:* ${clientName}
📱 *WhatsApp:* ${formattedPhone}
📅 *Data:* ${formatDate(dateStr)}
⏰ *Horário:* ${time}
✂️ *Serviço:* ${serviceName}

_Notificação automática UltraMind_`;
}

async function sendTwilioWhatsApp(to: string, body: string): Promise<{ success: boolean; error?: string; sid?: string }> {
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
    return { success: true, sid: result.sid };
  } catch (error: any) {
    console.error("Error sending WhatsApp:", error);
    return { success: false, error: error.message };
  }
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const payload: AppointmentConfirmation = await req.json();
    
    console.log("Processing appointment confirmation request");

    if (!payload.appointment_id) {
      return new Response(
        JSON.stringify({ error: "appointment_id is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check for authenticated user
    const authHeader = req.headers.get("Authorization");
    let isAuthenticated = false;
    let authenticatedUserId: string | null = null;

    if (authHeader && authHeader.startsWith("Bearer ")) {
      const token = authHeader.replace("Bearer ", "");
      const { data: userData, error: authError } = await supabase.auth.getUser(token);
      
      if (!authError && userData?.user) {
        isAuthenticated = true;
        authenticatedUserId = userData.user.id;
        console.log("Authenticated request from user:", authenticatedUserId);
      }
    }

    // Fetch appointment data
    const { data: appointment, error: appointmentError } = await supabase
      .from("appointments")
      .select(`
        id,
        user_id,
        client_name,
        client_whatsapp,
        date,
        time,
        status,
        created_at,
        service_id,
        services:service_id (name)
      `)
      .eq("id", payload.appointment_id)
      .single();

    if (appointmentError || !appointment) {
      console.error("Appointment not found:", appointmentError);
      return new Response(
        JSON.stringify({ error: "Appointment not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Authorization check
    if (isAuthenticated) {
      if (appointment.user_id !== authenticatedUserId) {
        console.error("User does not own this appointment");
        return new Response(
          JSON.stringify({ error: "Unauthorized - you do not own this appointment" }),
          { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    } else {
      const createdAt = new Date(appointment.created_at);
      const now = new Date();
      const minutesSinceCreation = (now.getTime() - createdAt.getTime()) / (1000 * 60);

      if (minutesSinceCreation > PUBLIC_CONFIRMATION_WINDOW_MINUTES) {
        return new Response(
          JSON.stringify({ error: "Confirmation window expired. Please contact the business directly." }),
          { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    // Fetch business profile
    const { data: profile } = await supabase
      .from("profiles")
      .select("business_name, whatsapp")
      .eq("user_id", appointment.user_id)
      .single();

    // ========== CREDIT CHECK ==========
    // Check if user can send WhatsApp (bot active + credits available)
    const { data: canSend, error: canSendError } = await supabase
      .rpc("can_send_whatsapp_message", { p_user_id: appointment.user_id });

    if (canSendError) {
      console.error("Error checking send permission:", canSendError);
    }

    const shouldSendWhatsApp = canSend === true;
    console.log(`Can send WhatsApp for user ${appointment.user_id}: ${shouldSendWhatsApp}`);

    // Get current credits for logging
    const { data: availableCredits } = await supabase
      .rpc("get_available_credits", { p_user_id: appointment.user_id });
    console.log(`Available credits: ${availableCredits}`);

    const clientName = appointment.client_name;
    const clientWhatsapp = appointment.client_whatsapp;
    const businessName = profile?.business_name || payload.business_name || "Estabelecimento";
    const businessWhatsapp = profile?.whatsapp || payload.business_whatsapp;
    const serviceName = (appointment.services as any)?.name || payload.service_name || "Serviço";
    const appointmentDate = appointment.date;
    const appointmentTime = appointment.time;

    // Update appointment status
    await supabase
      .from("appointments")
      .update({ 
        status: "confirmado",
        confirmed_at: new Date().toISOString()
      })
      .eq("id", payload.appointment_id);

    // If no credits or bot not active, return early
    if (!shouldSendWhatsApp) {
      const reason = availableCredits === 0 ? "Sem créditos disponíveis" : "Bot WhatsApp inativo";
      console.log(`WhatsApp not sent: ${reason}`);
      return new Response(
        JSON.stringify({
          success: true,
          botActive: false,
          message: `Agendamento confirmado. Mensagens WhatsApp não enviadas (${reason}).`,
          clientMessageSent: false,
          businessMessageSent: false,
          availableCredits: availableCredits || 0,
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!clientWhatsapp) {
      return new Response(
        JSON.stringify({ 
          success: true,
          error: "No client WhatsApp available for this appointment",
          clientMessageSent: false,
          businessMessageSent: false,
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Generate messages
    const clientMessage = generateClientMessage(clientName, businessName, appointmentDate, appointmentTime, serviceName);
    const businessMessage = generateBusinessMessage(clientName, clientWhatsapp, appointmentDate, appointmentTime, serviceName);

    // Count how many messages we'll send (for credit consumption)
    let messagesToSend = 1; // At least client message
    if (businessWhatsapp) messagesToSend++;

    // Check if we have enough credits for all messages
    if (availableCredits < messagesToSend) {
      console.log(`Not enough credits: need ${messagesToSend}, have ${availableCredits}`);
      return new Response(
        JSON.stringify({
          success: true,
          botActive: true,
          message: `Créditos insuficientes. Necessário: ${messagesToSend}, Disponível: ${availableCredits}`,
          clientMessageSent: false,
          businessMessageSent: false,
          availableCredits,
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Send WhatsApp to client and consume credit
    console.log("Sending WhatsApp to client:", clientWhatsapp);
    const clientResult = await sendTwilioWhatsApp(clientWhatsapp, clientMessage);
    
    if (clientResult.success) {
      // Consume 1 credit for client message
      await supabase.rpc("consume_credit", { p_user_id: appointment.user_id, p_amount: 1 });
      console.log("Credit consumed for client message");
    }
    
    // Log client message
    await supabase.from("whatsapp_message_logs").insert({
      user_id: appointment.user_id,
      appointment_id: payload.appointment_id,
      recipient_phone: clientWhatsapp,
      recipient_type: "client",
      message_type: "confirmation",
      message_content: clientMessage,
      status: clientResult.success ? "sent" : "failed",
      twilio_sid: clientResult.sid,
      error_message: clientResult.error,
      sent_at: clientResult.success ? new Date().toISOString() : null,
    });

    // Send WhatsApp to business owner
    let businessResult: { success: boolean; error?: string; sid?: string } = { success: false, error: "No business WhatsApp" };
    if (businessWhatsapp) {
      console.log("Sending WhatsApp to business:", businessWhatsapp);
      businessResult = await sendTwilioWhatsApp(businessWhatsapp, businessMessage);
      
      if (businessResult.success) {
        // Consume 1 credit for business message
        await supabase.rpc("consume_credit", { p_user_id: appointment.user_id, p_amount: 1 });
        console.log("Credit consumed for business message");
      }
      
      // Log business message
      await supabase.from("whatsapp_message_logs").insert({
        user_id: appointment.user_id,
        appointment_id: payload.appointment_id,
        recipient_phone: businessWhatsapp,
        recipient_type: "owner",
        message_type: "confirmation",
        message_content: businessMessage,
        status: businessResult.success ? "sent" : "failed",
        twilio_sid: businessResult.sid,
        error_message: businessResult.error,
        sent_at: businessResult.success ? new Date().toISOString() : null,
      });
    }

    // Create automatic 24h reminder
    const appointmentDateTime = new Date(`${appointmentDate}T${appointmentTime}`);
    const reminderTime = new Date(appointmentDateTime.getTime() - 24 * 60 * 60 * 1000);
    
    if (reminderTime > new Date()) {
      const reminderMessage = `⏰ *Lembrete de agendamento*

Seu horário é *amanhã* às *${appointmentTime}* para *${serviceName}*.

📍 ${businessName}

Confirme sua presença respondendo:
✅ SIM - para confirmar
❌ NÃO - para cancelar

_Lembrete automático UltraMind_`;

      await supabase.from("reminders").insert({
        appointment_id: payload.appointment_id,
        user_id: appointment.user_id,
        scheduled_for: reminderTime.toISOString(),
        status: "pending",
        reminder_type: "whatsapp",
        message: reminderMessage,
      });
    }

    // Get updated credits
    const { data: updatedCredits } = await supabase
      .rpc("get_available_credits", { p_user_id: appointment.user_id });

    return new Response(
      JSON.stringify({
        success: true,
        botActive: true,
        clientMessageSent: clientResult.success,
        businessMessageSent: businessResult.success,
        clientError: clientResult.error,
        businessError: businessResult.error,
        creditsUsed: (clientResult.success ? 1 : 0) + (businessResult.success ? 1 : 0),
        availableCredits: updatedCredits || 0,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Error in send-whatsapp-confirmation:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
};

serve(handler);
