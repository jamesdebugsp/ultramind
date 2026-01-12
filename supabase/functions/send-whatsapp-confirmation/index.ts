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

function generateClientMessage(clientName: string, businessName: string, dateStr: string, time: string, serviceName: string): string {
  return `✅ *Agendamento confirmado!*

📅 *Data:* ${formatDate(dateStr)}
⏰ *Horário:* ${time}
✂️ *Serviço:* ${serviceName}
📍 *${businessName}*

Obrigado por agendar com a gente, ${clientName}!

_Agendado via UltraMind_`;
}

function generateBusinessMessage(clientName: string, clientWhatsapp: string, dateStr: string, time: string, serviceName: string): string {
  const cleaned = clientWhatsapp.replace(/\D/g, "");
  const formattedPhone = cleaned.length === 11 
    ? cleaned.replace(/(\d{2})(\d{5})(\d{4})/, "($1) $2-$3")
    : cleaned.replace(/(\d{2})(\d{4})(\d{4})/, "($1) $2-$3");
  return `📅 *Novo agendamento!*

👤 *Cliente:* ${clientName}
📱 *WhatsApp:* ${formattedPhone}
📅 *Data:* ${formatDate(dateStr)}
⏰ *Horário:* ${time}
✂️ *Serviço:* ${serviceName}`;
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
    
    console.log("Processing appointment confirmation request");

    // Validate appointment_id is required
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

    // Fetch appointment data from database to verify it exists and get accurate data
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
      // Authenticated users must own the appointment
      if (appointment.user_id !== authenticatedUserId) {
        console.error("User does not own this appointment");
        return new Response(
          JSON.stringify({ error: "Unauthorized - you do not own this appointment" }),
          { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      console.log("Authorization passed: authenticated user owns appointment");
    } else {
      // For unauthenticated requests, verify appointment was created recently
      // This prevents abuse by only allowing confirmation for recently created appointments
      const createdAt = new Date(appointment.created_at);
      const now = new Date();
      const minutesSinceCreation = (now.getTime() - createdAt.getTime()) / (1000 * 60);

      if (minutesSinceCreation > PUBLIC_CONFIRMATION_WINDOW_MINUTES) {
        console.error(`Appointment too old for public confirmation: ${minutesSinceCreation.toFixed(1)} minutes`);
        return new Response(
          JSON.stringify({ error: "Confirmation window expired. Please contact the business directly." }),
          { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      console.log(`Authorization passed: appointment created ${minutesSinceCreation.toFixed(1)} minutes ago`);
    }

    // Fetch business profile for the appointment owner
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("business_name, whatsapp")
      .eq("user_id", appointment.user_id)
      .single();

    if (profileError) {
      console.error("Profile not found:", profileError);
    }

    // ========== WHATSAPP FEATURE CHECK ==========
    // Check if WhatsApp messaging is enabled for this user's subscription
    // Note: This checks whatsapp_enabled, NOT whatsapp_bot_enabled (which is for conversational bot)
    // Confirmation messages should be sent for PRO/PREMIUM plans with whatsapp_enabled = true
    const { data: subscription, error: subError } = await supabase
      .from("subscriptions")
      .select("plan, status, whatsapp_enabled")
      .eq("user_id", appointment.user_id)
      .single();

    if (subError) {
      console.error("Error fetching subscription:", subError);
    }

    // Send WhatsApp if:
    // 1. Subscription is active/trial AND
    // 2. whatsapp_enabled is true (PRO/PREMIUM feature)
    // Note: We always try to send for confirmations to ensure good UX
    const isSubscriptionActive = subscription?.status === 'active' || subscription?.status === 'trial';
    const hasWhatsAppFeature = subscription?.whatsapp_enabled === true;
    const shouldSendWhatsApp = isSubscriptionActive && hasWhatsAppFeature;
    
    console.log(`Subscription for user ${appointment.user_id}: plan=${subscription?.plan}, status=${subscription?.status}, whatsapp_enabled=${subscription?.whatsapp_enabled}`);
    console.log(`Should send WhatsApp: ${shouldSendWhatsApp}`);

    // Use data from database, not from client payload (except as fallback for business info)
    const clientName = appointment.client_name;
    const clientWhatsapp = appointment.client_whatsapp;
    const businessName = profile?.business_name || payload.business_name || "Estabelecimento";
    const businessWhatsapp = profile?.whatsapp || payload.business_whatsapp;
    const serviceName = (appointment.services as any)?.name || payload.service_name || "Serviço";
    const appointmentDate = appointment.date;
    const appointmentTime = appointment.time;

    // Update appointment status to confirmed (always do this)
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

    // If WhatsApp feature is not enabled, return early
    if (!shouldSendWhatsApp) {
      console.log("WhatsApp not enabled for this subscription. Skipping messages.");
      return new Response(
        JSON.stringify({
          success: true,
          whatsappEnabled: false,
          message: "Agendamento confirmado. Mensagens WhatsApp não enviadas (recurso não habilitado no plano).",
          clientMessageSent: false,
          businessMessageSent: false,
        }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    if (!clientWhatsapp) {
      console.error("No client WhatsApp available");
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

    // Generate messages using verified database data
    const clientMessage = generateClientMessage(clientName, businessName, appointmentDate, appointmentTime, serviceName);
    const businessMessage = generateBusinessMessage(clientName, clientWhatsapp, appointmentDate, appointmentTime, serviceName);

    // Send WhatsApp to client
    console.log("Sending WhatsApp to client:", clientWhatsapp);
    const clientResult = await sendTwilioWhatsApp(clientWhatsapp, clientMessage);
    
    if (!clientResult.success) {
      console.error("Failed to send to client:", clientResult.error);
    }

    // Send WhatsApp to business owner
    let businessResult: { success: boolean; error?: string } = { success: false, error: "No business WhatsApp" };
    if (businessWhatsapp) {
      console.log("Sending WhatsApp to business:", businessWhatsapp);
      businessResult = await sendTwilioWhatsApp(businessWhatsapp, businessMessage);
      
      if (!businessResult.success) {
        console.error("Failed to send to business:", businessResult.error);
      }
    }

    // Create automatic reminders (24h and 2h before)
    const appointmentDateTime = new Date(`${appointmentDate}T${appointmentTime}`);
    const now = new Date();
    
    // 24h reminder
    const reminder24h = new Date(appointmentDateTime.getTime() - 24 * 60 * 60 * 1000);
    if (reminder24h > now) {
      const message24h = `⏰ *Lembrete de agendamento*

Seu horário é *amanhã* às *${appointmentTime}* para *${serviceName}*.

📍 ${businessName}

_Lembrete automático UltraMind_`;

      const { error: err24h } = await supabase
        .from("reminders")
        .insert({
          appointment_id: payload.appointment_id,
          user_id: appointment.user_id,
          scheduled_for: reminder24h.toISOString(),
          status: "pending",
          reminder_type: "whatsapp",
          message: message24h,
        });

      if (err24h) {
        console.error("Error creating 24h reminder:", err24h);
      } else {
        console.log("24h reminder scheduled for:", reminder24h.toISOString());
      }
    }

    // 2h reminder
    const reminder2h = new Date(appointmentDateTime.getTime() - 2 * 60 * 60 * 1000);
    if (reminder2h > now) {
      const message2h = `⏰ *Lembrete: Seu horário é em 2 horas!*

📅 Hoje às *${appointmentTime}*
✂️ *${serviceName}*
📍 ${businessName}

Te esperamos! 😊

_Lembrete automático UltraMind_`;

      const { error: err2h } = await supabase
        .from("reminders")
        .insert({
          appointment_id: payload.appointment_id,
          user_id: appointment.user_id,
          scheduled_for: reminder2h.toISOString(),
          status: "pending",
          reminder_type: "whatsapp",
          message: message2h,
        });

      if (err2h) {
        console.error("Error creating 2h reminder:", err2h);
      } else {
        console.log("2h reminder scheduled for:", reminder2h.toISOString());
      }
    }

    console.log("Confirmation processed successfully");

    return new Response(
      JSON.stringify({
        success: true,
        whatsappEnabled: true,
        clientMessageSent: clientResult.success,
        businessMessageSent: businessResult.success,
        clientError: clientResult.error,
        businessError: businessResult.error,
        reminders: {
          reminder24h: reminder24h > now,
          reminder2h: reminder2h > now,
        }
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
