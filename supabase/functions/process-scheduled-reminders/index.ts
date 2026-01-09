import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

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

function formatDate(dateStr: string): string {
  const date = new Date(dateStr + "T12:00:00");
  return date.toLocaleDateString("pt-BR", {
    weekday: "long",
    day: "2-digit",
    month: "long",
  });
}

function generateReminderMessageForClient(clientName: string, businessName: string, time: string, serviceName: string): string {
  return `⏰ *Lembrete de agendamento*

Olá ${clientName}!

Seu horário é *amanhã* às *${time}* para *${serviceName}*.

📍 ${businessName}

Confirme sua presença respondendo:
✅ SIM - para confirmar
❌ NÃO - para cancelar

_Lembrete automático UltraMind_`;
}

function generateReminderMessageForBusiness(clientName: string, clientWhatsapp: string, dateStr: string, time: string, serviceName: string): string {
  const formattedPhone = clientWhatsapp.replace(/(\d{2})(\d{5})(\d{4})/, "($1) $2-$3");
  return `⏰ *Lembrete: Agendamento amanhã*

👤 *Cliente:* ${clientName}
📱 *WhatsApp:* ${formattedPhone}
📅 *Data:* ${formatDate(dateStr)}
⏰ *Horário:* ${time}
✂️ *Serviço:* ${serviceName}

_Lembrete automático UltraMind_`;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log("Processing scheduled reminders...");

    const now = new Date();
    
    // Find pending reminders that should be sent (scheduled_for <= now)
    const { data: pendingReminders, error: fetchError } = await supabase
      .from("reminders")
      .select(`
        id,
        appointment_id,
        user_id,
        scheduled_for,
        message,
        appointments:appointment_id (
          id,
          client_name,
          client_whatsapp,
          date,
          time,
          status,
          service_id,
          services:service_id (name)
        )
      `)
      .eq("status", "pending")
      .lte("scheduled_for", now.toISOString())
      .limit(50);

    if (fetchError) {
      console.error("Error fetching reminders:", fetchError);
      throw fetchError;
    }

    if (!pendingReminders || pendingReminders.length === 0) {
      console.log("No pending reminders to process");
      return new Response(
        JSON.stringify({ success: true, processed: 0 }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Found ${pendingReminders.length} reminders to process`);

    let sentCount = 0;
    let failedCount = 0;

    for (const reminder of pendingReminders) {
      const appointment = reminder.appointments as any;
      
      if (!appointment || appointment.status === "cancelado") {
        // Mark as skipped if appointment is cancelled
        await supabase
          .from("reminders")
          .update({ status: "skipped", sent_at: now.toISOString() })
          .eq("id", reminder.id);
        continue;
      }

      // Get business profile for owner notification
      const { data: profile } = await supabase
        .from("profiles")
        .select("business_name, whatsapp")
        .eq("user_id", reminder.user_id)
        .single();

      const clientName = appointment.client_name;
      const clientWhatsapp = appointment.client_whatsapp;
      const businessName = profile?.business_name || "Estabelecimento";
      const businessWhatsapp = profile?.whatsapp;
      const serviceName = appointment.services?.name || "Serviço";
      const appointmentDate = appointment.date;
      const appointmentTime = appointment.time;

      // Use stored message or generate new one
      const clientMessage = reminder.message || generateReminderMessageForClient(
        clientName,
        businessName,
        appointmentTime,
        serviceName
      );

      // Send reminder to client
      if (clientWhatsapp) {
        console.log(`Sending reminder to client: ${clientWhatsapp}`);
        const clientResult = await sendTwilioWhatsApp(clientWhatsapp, clientMessage);
        
        if (clientResult.success) {
          sentCount++;
        } else {
          console.error(`Failed to send to client: ${clientResult.error}`);
          failedCount++;
        }
      }

      // Send reminder to business owner
      if (businessWhatsapp) {
        const businessMessage = generateReminderMessageForBusiness(
          clientName,
          clientWhatsapp || "",
          appointmentDate,
          appointmentTime,
          serviceName
        );
        
        console.log(`Sending reminder to business: ${businessWhatsapp}`);
        await sendTwilioWhatsApp(businessWhatsapp, businessMessage);
      }

      // Update reminder status
      await supabase
        .from("reminders")
        .update({ 
          status: "sent", 
          sent_at: now.toISOString() 
        })
        .eq("id", reminder.id);
    }

    console.log(`Processed ${pendingReminders.length} reminders: ${sentCount} sent, ${failedCount} failed`);

    return new Response(
      JSON.stringify({
        success: true,
        processed: pendingReminders.length,
        sent: sentCount,
        failed: failedCount,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("Error processing reminders:", error);
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
