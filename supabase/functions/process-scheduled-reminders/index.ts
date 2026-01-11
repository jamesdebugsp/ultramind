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

function formatDate(dateStr: string): string {
  const date = new Date(dateStr + "T12:00:00");
  return date.toLocaleDateString("pt-BR", {
    weekday: "long",
    day: "2-digit",
    month: "long",
  });
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
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log("Processing scheduled reminders...");

    // Get pending reminders that are due (scheduled_for <= now)
    const { data: reminders, error: fetchError } = await supabase
      .from("reminders")
      .select(`
        id,
        appointment_id,
        user_id,
        scheduled_for,
        reminder_type,
        message,
        appointments (
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
      .lte("scheduled_for", new Date().toISOString())
      .order("scheduled_for", { ascending: true })
      .limit(50);

    if (fetchError) {
      console.error("Error fetching reminders:", fetchError);
      throw fetchError;
    }

    if (!reminders || reminders.length === 0) {
      console.log("No pending reminders to process");
      return new Response(
        JSON.stringify({ success: true, processed: 0 }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Found ${reminders.length} reminders to process`);

    let processed = 0;
    let failed = 0;

    for (const reminder of reminders) {
      try {
        const appointment = reminder.appointments as any;
        
        // Skip if appointment was cancelled
        if (!appointment || appointment.status === "cancelado") {
          await supabase
            .from("reminders")
            .update({ status: "skipped", sent_at: new Date().toISOString() })
            .eq("id", reminder.id);
          continue;
        }

        // Check if bot is active for this user
        const { data: botActive } = await supabase
          .rpc("is_whatsapp_bot_active", { p_user_id: reminder.user_id });

        if (!botActive) {
          console.log(`Bot not active for user ${reminder.user_id}, skipping reminder`);
          await supabase
            .from("reminders")
            .update({ status: "skipped", sent_at: new Date().toISOString() })
            .eq("id", reminder.id);
          continue;
        }

        // Get business profile
        const { data: profile } = await supabase
          .from("profiles")
          .select("business_name, whatsapp")
          .eq("user_id", reminder.user_id)
          .single();

        const businessName = profile?.business_name || "Estabelecimento";
        const serviceName = (appointment.services as any)?.name || "Serviço";

        // Use custom message if available, otherwise generate default
        let messageToSend = reminder.message;
        
        if (!messageToSend) {
          if (reminder.reminder_type === "24h") {
            messageToSend = `⏰ *Lembrete de agendamento*

Seu horário é *amanhã* às *${appointment.time}* para *${serviceName}*.

📍 ${businessName}

Confirme sua presença respondendo:
✅ SIM - para confirmar
❌ NÃO - para cancelar

_Lembrete automático UltraMind_`;
          } else if (reminder.reminder_type === "2h") {
            messageToSend = `⏰ *Seu horário é em 2 horas!*

📅 Hoje às *${appointment.time}*
✂️ ${serviceName}
📍 ${businessName}

_Te esperamos!_`;
          } else {
            messageToSend = `⏰ *Lembrete de agendamento*

Seu horário é em *${formatDate(appointment.date)}* às *${appointment.time}*.

📍 ${businessName}

_Lembrete automático UltraMind_`;
          }
        }

        // Send to client
        if (appointment.client_whatsapp) {
          const result = await sendTwilioWhatsApp(appointment.client_whatsapp, messageToSend);
          
          if (result.success) {
            await supabase
              .from("reminders")
              .update({ status: "sent", sent_at: new Date().toISOString() })
              .eq("id", reminder.id);
            processed++;
            console.log(`Reminder ${reminder.id} sent successfully`);
          } else {
            await supabase
              .from("reminders")
              .update({ status: "failed" })
              .eq("id", reminder.id);
            failed++;
            console.error(`Failed to send reminder ${reminder.id}:`, result.error);
          }
        }

        // Also notify business owner for 24h reminders
        if (reminder.reminder_type === "24h" && profile?.whatsapp) {
          await sendTwilioWhatsApp(
            profile.whatsapp,
            `📅 *Lembrete de agendamento amanhã*

👤 Cliente: ${appointment.client_name}
📱 WhatsApp: ${appointment.client_whatsapp}
⏰ Horário: ${appointment.time}
✂️ Serviço: ${serviceName}

_Lembrete automático UltraMind_`
          );
        }
      } catch (error) {
        console.error(`Error processing reminder ${reminder.id}:`, error);
        failed++;
      }
    }

    console.log(`Processed ${processed} reminders, ${failed} failed`);

    // Clean expired conversations
    await supabase.rpc("clean_expired_conversations");

    return new Response(
      JSON.stringify({ 
        success: true, 
        processed, 
        failed,
        total: reminders.length 
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Error in process-scheduled-reminders:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
};

serve(handler);
