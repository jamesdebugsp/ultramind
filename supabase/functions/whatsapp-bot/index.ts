import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-twilio-signature",
};

// Conversation steps
type ConversationStep = 
  | "menu" 
  | "awaiting_service" 
  | "awaiting_date" 
  | "awaiting_time" 
  | "awaiting_name" 
  | "awaiting_confirmation";

interface ConversationState {
  id: string;
  phone_number: string;
  business_user_id: string;
  current_step: ConversationStep;
  selected_service_id: string | null;
  selected_date: string | null;
  selected_time: string | null;
  client_name: string | null;
  conversation_data: Record<string, any>;
}

interface TwilioMessage {
  From: string;
  To: string;
  Body: string;
  AccountSid?: string;
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
  if (!signature) return false;

  const authToken = Deno.env.get("TWILIO_AUTH_TOKEN");
  if (!authToken) return false;

  const sortedKeys = Object.keys(params).sort();
  const dataString = url + sortedKeys.map(key => `${key}${params[key]}`).join("");
  const expectedSignature = await createHmacSha1(authToken, dataString);

  if (signature.length !== expectedSignature.length) return false;
  
  let result = 0;
  for (let i = 0; i < signature.length; i++) {
    result |= signature.charCodeAt(i) ^ expectedSignature.charCodeAt(i);
  }
  return result === 0;
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
  });
}

function parseDate(input: string): string | null {
  // Parse formats: dd/mm, dd/mm/yyyy, "amanha", "hoje"
  const today = new Date();
  const normalized = input.toLowerCase().trim();

  if (normalized === "hoje") {
    return today.toISOString().split("T")[0];
  }
  
  if (normalized === "amanha" || normalized === "amanhã") {
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split("T")[0];
  }

  // Try dd/mm or dd/mm/yyyy
  const dateMatch = normalized.match(/^(\d{1,2})\/(\d{1,2})(?:\/(\d{2,4}))?$/);
  if (dateMatch) {
    const day = parseInt(dateMatch[1], 10);
    const month = parseInt(dateMatch[2], 10) - 1;
    let year = dateMatch[3] ? parseInt(dateMatch[3], 10) : today.getFullYear();
    
    if (year < 100) year += 2000;
    
    const date = new Date(year, month, day);
    if (date >= today) {
      return date.toISOString().split("T")[0];
    }
  }

  return null;
}

function parseTime(input: string): string | null {
  // Parse formats: HH:MM, HH, HHh, HHhMM
  const normalized = input.toLowerCase().trim().replace("h", ":");
  
  const timeMatch = normalized.match(/^(\d{1,2}):?(\d{2})?$/);
  if (timeMatch) {
    const hours = parseInt(timeMatch[1], 10);
    const minutes = timeMatch[2] ? parseInt(timeMatch[2], 10) : 0;
    
    if (hours >= 0 && hours <= 23 && minutes >= 0 && minutes <= 59) {
      return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}`;
    }
  }

  return null;
}

async function sendWhatsAppMessage(to: string, body: string): Promise<boolean> {
  const accountSid = Deno.env.get("TWILIO_ACCOUNT_SID");
  const authToken = Deno.env.get("TWILIO_AUTH_TOKEN");
  const fromNumber = Deno.env.get("TWILIO_WHATSAPP_FROM");

  if (!accountSid || !authToken || !fromNumber) {
    console.error("Missing Twilio credentials");
    return false;
  }

  const formattedTo = to.startsWith("whatsapp:") ? to : `whatsapp:${formatPhone(to)}`;
  const formattedFrom = fromNumber.startsWith("whatsapp:") ? fromNumber : `whatsapp:${fromNumber}`;

  try {
    const url = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;
    
    const params = new URLSearchParams();
    params.append("To", formattedTo);
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

    return response.ok;
  } catch (error) {
    console.error("Error sending WhatsApp:", error);
    return false;
  }
}

async function getOrCreateConversation(
  supabase: any,
  phoneNumber: string,
  businessUserId: string
): Promise<ConversationState | null> {
  // First, try to get existing conversation
  const { data: existing, error: getError } = await supabase
    .from("bot_conversations")
    .select("*")
    .eq("phone_number", phoneNumber)
    .eq("business_user_id", businessUserId)
    .gte("expires_at", new Date().toISOString())
    .single();

  if (existing) {
    // Update last message timestamp and extend expiry
    await supabase
      .from("bot_conversations")
      .update({
        last_message_at: new Date().toISOString(),
        expires_at: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", existing.id);

    return existing;
  }

  // Create new conversation
  const { data: newConv, error: createError } = await supabase
    .from("bot_conversations")
    .upsert({
      phone_number: phoneNumber,
      business_user_id: businessUserId,
      current_step: "menu",
      conversation_data: {},
      expires_at: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
    }, { onConflict: "phone_number,business_user_id" })
    .select()
    .single();

  if (createError) {
    console.error("Error creating conversation:", createError);
    return null;
  }

  return newConv;
}

async function updateConversation(
  supabase: any,
  conversationId: string,
  updates: Partial<ConversationState>
): Promise<void> {
  await supabase
    .from("bot_conversations")
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
      expires_at: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
    })
    .eq("id", conversationId);
}

async function deleteConversation(supabase: any, conversationId: string): Promise<void> {
  await supabase.from("bot_conversations").delete().eq("id", conversationId);
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const url = new URL(req.url);
    const businessUserId = url.searchParams.get("business_id");

    if (!businessUserId) {
      return new Response(
        JSON.stringify({ error: "business_id is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check if bot is active for this business
    const { data: botActive } = await supabase.rpc("is_whatsapp_bot_active", { p_user_id: businessUserId });
    if (!botActive) {
      console.log(`Bot not active for business ${businessUserId}`);
      return new Response(
        JSON.stringify({ error: "Bot not active" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Parse Twilio webhook
    const contentType = req.headers.get("content-type") || "";
    if (!contentType.includes("application/x-www-form-urlencoded")) {
      return new Response(
        JSON.stringify({ error: "Invalid content type" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const formData = await req.formData();
    const params: Record<string, string> = {};
    formData.forEach((value, key) => {
      params[key] = value.toString();
    });

    // Validate Twilio signature
    const twilioSignature = req.headers.get("X-Twilio-Signature");
    const isValid = await validateTwilioSignature(
      twilioSignature,
      url.origin + url.pathname + "?" + url.searchParams.toString(),
      params
    );

    if (!isValid) {
      console.error("Invalid Twilio signature");
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const message: TwilioMessage = {
      From: params.From || "",
      To: params.To || "",
      Body: params.Body || "",
    };

    const customerPhone = message.From.replace("whatsapp:", "");
    const messageText = message.Body.trim().toLowerCase();

    console.log(`Message from ${customerPhone}: "${message.Body}"`);

    // Get business info
    const { data: profile } = await supabase
      .from("profiles")
      .select("business_name, slug, whatsapp")
      .eq("user_id", businessUserId)
      .single();

    const businessName = profile?.business_name || "Estabelecimento";
    const bookingLink = profile?.slug 
      ? `${Deno.env.get("PUBLIC_SITE_URL") || "https://ultramind.lovable.app"}/agendar/${profile.slug}`
      : "";

    // Get or create conversation
    const conversation = await getOrCreateConversation(supabase, customerPhone, businessUserId);
    if (!conversation) {
      return new Response(
        JSON.stringify({ error: "Failed to create conversation" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    let responseMessage = "";
    let nextStep: ConversationStep = conversation.current_step as ConversationStep;

    // Handle "voltar" or "menu" commands
    if (messageText === "voltar" || messageText === "menu" || messageText === "0") {
      nextStep = "menu";
      await updateConversation(supabase, conversation.id, {
        current_step: "menu",
        selected_service_id: null,
        selected_date: null,
        selected_time: null,
        client_name: null,
      });
    }

    // Process based on current step
    switch (nextStep) {
      case "menu": {
        responseMessage = `Olá 👋 Sou o assistente inteligente da *${businessName}*.

Escolha uma opção:

*1* - 📅 Agendar serviço
*2* - 💰 Serviços e preços
*3* - 👤 Falar com atendente humano

${bookingLink ? `Ou acesse nosso site: ${bookingLink}` : ""}

_Digite o número da opção desejada_`;

        if (messageText === "1") {
          // Go to service selection
          const { data: services } = await supabase
            .from("services")
            .select("id, name, price, duration")
            .eq("user_id", businessUserId)
            .eq("status", "active")
            .order("name");

          if (!services || services.length === 0) {
            responseMessage = `😕 Não há serviços disponíveis no momento.

Digite *0* para voltar ao menu.`;
          } else {
            let serviceList = `Escolha um serviço:\n\n`;
            services.forEach((s, i) => {
              serviceList += `*${i + 1}* - ${s.name} (R$ ${s.price.toFixed(2)} - ${s.duration} min)\n`;
            });
            serviceList += `\n_Digite o número do serviço ou *0* para voltar_`;

            responseMessage = serviceList;
            nextStep = "awaiting_service";
            
            await updateConversation(supabase, conversation.id, {
              current_step: "awaiting_service",
              conversation_data: { services },
            });
          }
        } else if (messageText === "2") {
          // Show services and prices
          const { data: services } = await supabase
            .from("services")
            .select("name, price, duration, description")
            .eq("user_id", businessUserId)
            .eq("status", "active")
            .order("name");

          if (!services || services.length === 0) {
            responseMessage = `😕 Não há serviços cadastrados no momento.

Digite *0* para voltar ao menu.`;
          } else {
            let priceList = `💈 *Serviços e Preços*\n\n`;
            services.forEach(s => {
              priceList += `✂️ *${s.name}*\n`;
              priceList += `💰 R$ ${s.price.toFixed(2)} | ⏱️ ${s.duration} min\n`;
              if (s.description) priceList += `📝 ${s.description}\n`;
              priceList += `\n`;
            });
            priceList += `Para agendar, digite *1*\n_Ou *0* para voltar ao menu_`;

            responseMessage = priceList;
          }
        } else if (messageText === "3") {
          // Transfer to human
          const businessWhatsapp = profile?.whatsapp;
          if (businessWhatsapp) {
            responseMessage = `👤 Você será atendido por um humano em breve!

Enquanto isso, você pode entrar em contato diretamente:
📱 ${businessWhatsapp}

_Digite *0* para voltar ao menu_`;
          } else {
            responseMessage = `👤 Um atendente entrará em contato com você em breve!

_Digite *0* para voltar ao menu_`;
          }
          
          // Notify business owner
          if (profile?.whatsapp) {
            await sendWhatsAppMessage(
              profile.whatsapp,
              `🔔 *Solicitação de Atendimento*\n\nCliente solicitou atendimento humano:\n📱 ${customerPhone}\n\n_Notificação automática UltraMind_`
            );
          }
        }
        break;
      }

      case "awaiting_service": {
        const services = conversation.conversation_data?.services || [];
        const selectedIndex = parseInt(messageText, 10) - 1;

        if (selectedIndex >= 0 && selectedIndex < services.length) {
          const selectedService = services[selectedIndex];
          
          responseMessage = `✅ Serviço selecionado: *${selectedService.name}*

📅 Agora informe a *data* do agendamento.

Formatos aceitos:
• *hoje*
• *amanha* ou *amanhã*
• *15/01*
• *15/01/2026*

_Digite *0* para voltar ao menu_`;

          nextStep = "awaiting_date";
          await updateConversation(supabase, conversation.id, {
            current_step: "awaiting_date",
            selected_service_id: selectedService.id,
            conversation_data: { ...conversation.conversation_data, selectedService },
          });
        } else {
          responseMessage = `❌ Opção inválida. Por favor, digite o *número* do serviço desejado.

_Digite *0* para voltar ao menu_`;
        }
        break;
      }

      case "awaiting_date": {
        const parsedDate = parseDate(message.Body);

        if (parsedDate) {
          // Check if date is a working day
          const { data: settings } = await supabase
            .from("settings")
            .select("working_days, working_hours_start, working_hours_end, appointment_interval")
            .eq("user_id", businessUserId)
            .single();

          const workingDays = settings?.working_days || ["monday", "tuesday", "wednesday", "thursday", "friday"];
          const dayOfWeek = new Date(parsedDate + "T12:00:00").toLocaleDateString("en-US", { weekday: "long" }).toLowerCase();

          if (!workingDays.includes(dayOfWeek)) {
            responseMessage = `❌ Não atendemos neste dia da semana.

Dias disponíveis: ${workingDays.map((d: string) => {
              const days: Record<string, string> = {
                monday: "Segunda",
                tuesday: "Terça",
                wednesday: "Quarta",
                thursday: "Quinta",
                friday: "Sexta",
                saturday: "Sábado",
                sunday: "Domingo"
              };
              return days[d] || d;
            }).join(", ")}

_Digite outra data ou *0* para voltar_`;
          } else {
            // Get available times for this date
            const startHour = settings?.working_hours_start || "09:00";
            const endHour = settings?.working_hours_end || "18:00";
            const interval = settings?.appointment_interval || 30;

            // Get existing appointments for this date
            const { data: existingAppointments } = await supabase
              .from("appointments")
              .select("time")
              .eq("user_id", businessUserId)
              .eq("date", parsedDate)
              .neq("status", "cancelado");

            const bookedTimes = new Set((existingAppointments || []).map((a: any) => a.time.slice(0, 5)));

            // Generate available slots
            const availableSlots: string[] = [];
            const [startH, startM] = startHour.split(":").map(Number);
            const [endH, endM] = endHour.split(":").map(Number);
            
            let currentTime = startH * 60 + startM;
            const endTime = endH * 60 + endM;

            while (currentTime < endTime) {
              const hours = Math.floor(currentTime / 60);
              const mins = currentTime % 60;
              const timeStr = `${hours.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")}`;
              
              if (!bookedTimes.has(timeStr)) {
                availableSlots.push(timeStr);
              }
              currentTime += interval;
            }

            if (availableSlots.length === 0) {
              responseMessage = `😕 Não há horários disponíveis para ${formatDate(parsedDate)}.

_Digite outra data ou *0* para voltar_`;
            } else {
              let slotsMessage = `📅 *${formatDate(parsedDate)}*\n\nHorários disponíveis:\n\n`;
              
              availableSlots.forEach((slot, i) => {
                slotsMessage += `*${i + 1}* - ${slot}\n`;
              });
              
              slotsMessage += `\n_Digite o número do horário ou *0* para voltar_`;

              responseMessage = slotsMessage;
              nextStep = "awaiting_time";
              
              await updateConversation(supabase, conversation.id, {
                current_step: "awaiting_time",
                selected_date: parsedDate,
                conversation_data: { ...conversation.conversation_data, availableSlots },
              });
            }
          }
        } else {
          responseMessage = `❌ Data inválida. Por favor, use um dos formatos:

• *hoje*
• *amanha*
• *15/01*
• *15/01/2026*

_Digite *0* para voltar ao menu_`;
        }
        break;
      }

      case "awaiting_time": {
        const slots = conversation.conversation_data?.availableSlots || [];
        const selectedIndex = parseInt(messageText, 10) - 1;
        const directTime = parseTime(message.Body);

        let selectedTime: string | null = null;

        if (selectedIndex >= 0 && selectedIndex < slots.length) {
          selectedTime = slots[selectedIndex];
        } else if (directTime && slots.includes(directTime)) {
          selectedTime = directTime;
        }

        if (selectedTime) {
          responseMessage = `✅ Horário selecionado: *${selectedTime}*

👤 Por favor, informe seu *nome completo*:

_Digite *0* para voltar ao menu_`;

          nextStep = "awaiting_name";
          await updateConversation(supabase, conversation.id, {
            current_step: "awaiting_name",
            selected_time: selectedTime,
          });
        } else {
          responseMessage = `❌ Horário inválido. Digite o *número* do horário desejado ou o horário no formato *HH:MM*.

_Digite *0* para voltar ao menu_`;
        }
        break;
      }

      case "awaiting_name": {
        const clientName = message.Body.trim();

        if (clientName.length < 2) {
          responseMessage = `❌ Por favor, informe seu nome completo.

_Digite *0* para voltar ao menu_`;
        } else {
          const selectedService = conversation.conversation_data?.selectedService;
          
          responseMessage = `📋 *Resumo do Agendamento*

👤 Cliente: *${clientName}*
✂️ Serviço: *${selectedService?.name || "Serviço"}*
💰 Valor: *R$ ${selectedService?.price?.toFixed(2) || "0.00"}*
📅 Data: *${formatDate(conversation.selected_date || "")}*
⏰ Horário: *${conversation.selected_time}*
📍 Local: *${businessName}*

*Confirma o agendamento?*

*1* - ✅ Confirmar
*2* - ❌ Cancelar

_Digite *0* para voltar ao menu_`;

          nextStep = "awaiting_confirmation";
          await updateConversation(supabase, conversation.id, {
            current_step: "awaiting_confirmation",
            client_name: clientName,
          });
        }
        break;
      }

      case "awaiting_confirmation": {
        if (messageText === "1" || messageText === "sim" || messageText === "s") {
          // Create the appointment
          const selectedService = conversation.conversation_data?.selectedService;
          
          const { data: appointment, error: appointmentError } = await supabase
            .from("appointments")
            .insert({
              user_id: businessUserId,
              client_name: conversation.client_name,
              client_whatsapp: customerPhone,
              service_id: conversation.selected_service_id,
              date: conversation.selected_date,
              time: conversation.selected_time,
              status: "confirmado",
              confirmed_at: new Date().toISOString(),
            })
            .select()
            .single();

          if (appointmentError) {
            console.error("Error creating appointment:", appointmentError);
            responseMessage = `❌ Ocorreu um erro ao criar o agendamento. Por favor, tente novamente.

_Digite *0* para voltar ao menu_`;
          } else {
            // Create reminders (24h and 2h before)
            const appointmentDateTime = new Date(`${conversation.selected_date}T${conversation.selected_time}`);
            
            // 24h reminder
            const reminder24h = new Date(appointmentDateTime.getTime() - 24 * 60 * 60 * 1000);
            if (reminder24h > new Date()) {
              await supabase.from("reminders").insert({
                appointment_id: appointment.id,
                user_id: businessUserId,
                scheduled_for: reminder24h.toISOString(),
                status: "pending",
                reminder_type: "24h",
                message: `⏰ *Lembrete de agendamento*\n\nSeu horário é *amanhã* às *${conversation.selected_time}* para *${selectedService?.name}*.\n\n📍 ${businessName}`,
              });
            }

            // 2h reminder
            const reminder2h = new Date(appointmentDateTime.getTime() - 2 * 60 * 60 * 1000);
            if (reminder2h > new Date()) {
              await supabase.from("reminders").insert({
                appointment_id: appointment.id,
                user_id: businessUserId,
                scheduled_for: reminder2h.toISOString(),
                status: "pending",
                reminder_type: "2h",
                message: `⏰ *Seu horário é em 2 horas!*\n\n📅 Hoje às *${conversation.selected_time}*\n✂️ ${selectedService?.name}\n📍 ${businessName}\n\n_Te esperamos!_`,
              });
            }

            // Notify business owner
            if (profile?.whatsapp) {
              await sendWhatsAppMessage(
                profile.whatsapp,
                `📅 *Novo agendamento confirmado!*

👤 *Cliente:* ${conversation.client_name}
📱 *WhatsApp:* ${customerPhone}
📅 *Data:* ${formatDate(conversation.selected_date || "")}
⏰ *Horário:* ${conversation.selected_time}
✂️ *Serviço:* ${selectedService?.name}
💰 *Valor:* R$ ${selectedService?.price?.toFixed(2)}

_Agendamento via Bot WhatsApp UltraMind_`
              );
            }

            responseMessage = `✅ *Agendamento confirmado com sucesso!*

📅 *Data:* ${formatDate(conversation.selected_date || "")}
⏰ *Horário:* ${conversation.selected_time}
✂️ *Serviço:* ${selectedService?.name}
📍 *${businessName}*

Você receberá lembretes automáticos.

Obrigado por agendar com a gente! 🎉

_Digite *0* para voltar ao menu principal_`;

            // Clear conversation after successful booking
            await deleteConversation(supabase, conversation.id);
          }
        } else if (messageText === "2" || messageText === "nao" || messageText === "não" || messageText === "n") {
          responseMessage = `❌ Agendamento cancelado.

Para fazer um novo agendamento, digite *1*.

_Ou digite *0* para voltar ao menu_`;

          await updateConversation(supabase, conversation.id, {
            current_step: "menu",
            selected_service_id: null,
            selected_date: null,
            selected_time: null,
            client_name: null,
          });
        } else {
          responseMessage = `Por favor, confirme o agendamento:

*1* - ✅ Confirmar
*2* - ❌ Cancelar

_Digite *0* para voltar ao menu_`;
        }
        break;
      }
    }

    // Send response
    await sendWhatsAppMessage(message.From, responseMessage);

    // Return TwiML response for Twilio
    const twiml = `<?xml version="1.0" encoding="UTF-8"?><Response></Response>`;
    
    return new Response(twiml, {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "text/xml" },
    });
  } catch (error: any) {
    console.error("Error in whatsapp-bot:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
};

serve(handler);
