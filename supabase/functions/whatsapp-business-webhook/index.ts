import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

// ===== HELPERS =====

function formatDate(dateStr: string): string {
  const date = new Date(dateStr + "T12:00:00");
  return date.toLocaleDateString("pt-BR", {
    weekday: "long",
    day: "2-digit",
    month: "long",
  });
}

function parseDate(input: string): string | null {
  const today = new Date();
  const normalized = input.toLowerCase().trim();

  if (normalized === "hoje") return today.toISOString().split("T")[0];
  if (normalized === "amanha" || normalized === "amanhã") {
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split("T")[0];
  }

  const m = normalized.match(/^(\d{1,2})\/(\d{1,2})(?:\/(\d{2,4}))?$/);
  if (m) {
    const day = parseInt(m[1], 10);
    const month = parseInt(m[2], 10) - 1;
    let year = m[3] ? parseInt(m[3], 10) : today.getFullYear();
    if (year < 100) year += 2000;
    const date = new Date(year, month, day);
    if (date >= today) return date.toISOString().split("T")[0];
  }
  return null;
}

function parseTime(input: string): string | null {
  const normalized = input.toLowerCase().trim().replace("h", ":");
  const m = normalized.match(/^(\d{1,2}):?(\d{2})?$/);
  if (m) {
    const hours = parseInt(m[1], 10);
    const minutes = m[2] ? parseInt(m[2], 10) : 0;
    if (hours >= 0 && hours <= 23 && minutes >= 0 && minutes <= 59) {
      return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}`;
    }
  }
  return null;
}

// ===== SEND MESSAGE VIA META CLOUD API =====

async function sendMetaMessage(
  phoneNumberId: string,
  accessToken: string,
  to: string,
  text: string
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  try {
    const url = `https://graph.facebook.com/v18.0/${phoneNumberId}/messages`;
    const response = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to,
        type: "text",
        text: { body: text },
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("[BOT SEND] ❌ Meta API error:", JSON.stringify(data));
      return { success: false, error: data?.error?.message || "Meta API error" };
    }

    const messageId = data?.messages?.[0]?.id;
    console.log(`[BOT SEND] ✅ Sent to ${to}, messageId: ${messageId}`);
    return { success: true, messageId };
  } catch (err: any) {
    console.error("[BOT SEND] ❌ Exception:", err.message);
    return { success: false, error: err.message };
  }
}

// ===== BOT LOGIC =====

type ConversationStep =
  | "menu"
  | "awaiting_service"
  | "awaiting_date"
  | "awaiting_time"
  | "awaiting_name"
  | "awaiting_confirmation";

async function getOrCreateConversation(
  supabase: any,
  phoneNumber: string,
  businessUserId: string
) {
  const { data: existing } = await supabase
    .from("bot_conversations")
    .select("*")
    .eq("phone_number", phoneNumber)
    .eq("business_user_id", businessUserId)
    .gte("expires_at", new Date().toISOString())
    .single();

  if (existing) {
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

  const { data: newConv, error } = await supabase
    .from("bot_conversations")
    .upsert(
      {
        phone_number: phoneNumber,
        business_user_id: businessUserId,
        current_step: "menu",
        conversation_data: {},
        expires_at: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
      },
      { onConflict: "phone_number,business_user_id" }
    )
    .select()
    .single();

  if (error) {
    console.error("[BOT] Error creating conversation:", error);
    return null;
  }
  return newConv;
}

async function updateConversation(supabase: any, id: string, updates: any) {
  await supabase
    .from("bot_conversations")
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
      expires_at: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
    })
    .eq("id", id);
}

async function deleteConversation(supabase: any, id: string) {
  await supabase.from("bot_conversations").delete().eq("id", id);
}

async function processBotMessage(
  supabase: any,
  senderNumber: string,
  messageBody: string,
  businessUserId: string
): Promise<string> {
  // Get business info
  const { data: profile } = await supabase
    .from("profiles")
    .select("business_name, slug, whatsapp")
    .eq("user_id", businessUserId)
    .single();

  const businessName = profile?.business_name || "Estabelecimento";
  const bookingLink = profile?.slug
    ? `https://ultramind.lovable.app/agendar/${profile.slug}`
    : "";

  // Get or create conversation
  const conversation = await getOrCreateConversation(supabase, senderNumber, businessUserId);
  if (!conversation) return "Desculpe, ocorreu um erro. Tente novamente mais tarde.";

  const text = messageBody.trim().toLowerCase();
  let nextStep: ConversationStep = conversation.current_step as ConversationStep;

  // Handle reset commands
  if (text === "voltar" || text === "menu" || text === "0") {
    nextStep = "menu";
    await updateConversation(supabase, conversation.id, {
      current_step: "menu",
      selected_service_id: null,
      selected_date: null,
      selected_time: null,
      client_name: null,
    });
  }

  switch (nextStep) {
    case "menu": {
      if (text === "1") {
        const { data: services } = await supabase
          .from("services")
          .select("id, name, price, duration")
          .eq("user_id", businessUserId)
          .eq("status", "active")
          .order("name");

        if (!services || services.length === 0) {
          return "😕 Não há serviços disponíveis no momento.\n\nDigite *0* para voltar ao menu.";
        }

        let list = "Escolha um serviço:\n\n";
        services.forEach((s: any, i: number) => {
          list += `*${i + 1}* - ${s.name} (R$ ${s.price.toFixed(2)} - ${s.duration} min)\n`;
        });
        list += "\n_Digite o número do serviço ou *0* para voltar_";

        await updateConversation(supabase, conversation.id, {
          current_step: "awaiting_service",
          conversation_data: { services },
        });
        return list;
      }

      if (text === "2") {
        const { data: services } = await supabase
          .from("services")
          .select("name, price, duration, description")
          .eq("user_id", businessUserId)
          .eq("status", "active")
          .order("name");

        if (!services || services.length === 0) {
          return "😕 Não há serviços cadastrados no momento.\n\nDigite *0* para voltar ao menu.";
        }

        let priceList = "💈 *Serviços e Preços*\n\n";
        services.forEach((s: any) => {
          priceList += `✂️ *${s.name}*\n💰 R$ ${s.price.toFixed(2)} | ⏱️ ${s.duration} min\n`;
          if (s.description) priceList += `📝 ${s.description}\n`;
          priceList += "\n";
        });
        priceList += "Para agendar, digite *1*\n_Ou *0* para voltar ao menu_";
        return priceList;
      }

      if (text === "3") {
        const bw = profile?.whatsapp;
        // Notify business owner
        if (bw) {
          // We'll send notification after this function returns
          // Store flag in conversation_data
          await updateConversation(supabase, conversation.id, {
            conversation_data: { ...conversation.conversation_data, notify_owner: true, sender: senderNumber },
          });
        }
        return bw
          ? `👤 Você será atendido por um humano em breve!\n\nEnquanto isso, entre em contato:\n📱 ${bw}\n\n_Digite *0* para voltar ao menu_`
          : "👤 Um atendente entrará em contato com você em breve!\n\n_Digite *0* para voltar ao menu_";
      }

      // Default menu
      return `Olá 👋 Sou o assistente inteligente da *${businessName}*.\n\nEscolha uma opção:\n\n*1* - 📅 Agendar serviço\n*2* - 💰 Serviços e preços\n*3* - 👤 Falar com atendente humano\n${bookingLink ? `\nOu acesse: ${bookingLink}` : ""}\n\n_Digite o número da opção desejada_`;
    }

    case "awaiting_service": {
      const services = conversation.conversation_data?.services || [];
      const idx = parseInt(text, 10) - 1;

      if (idx >= 0 && idx < services.length) {
        const selected = services[idx];
        await updateConversation(supabase, conversation.id, {
          current_step: "awaiting_date",
          selected_service_id: selected.id,
          conversation_data: { ...conversation.conversation_data, selectedService: selected },
        });
        return `✅ Serviço selecionado: *${selected.name}*\n\n📅 Informe a *data* do agendamento.\n\nFormatos: *hoje*, *amanha*, *15/01*, *15/01/2026*\n\n_Digite *0* para voltar ao menu_`;
      }
      return "❌ Opção inválida. Digite o *número* do serviço desejado.\n\n_Digite *0* para voltar ao menu_";
    }

    case "awaiting_date": {
      const parsedDate = parseDate(messageBody);
      if (!parsedDate) {
        return "❌ Data inválida. Use: *hoje*, *amanha*, *15/01*, *15/01/2026*\n\n_Digite *0* para voltar ao menu_";
      }

      const { data: settings } = await supabase
        .from("settings")
        .select("working_days, working_hours_start, working_hours_end, appointment_interval")
        .eq("user_id", businessUserId)
        .single();

      const workingDays = settings?.working_days || ["monday", "tuesday", "wednesday", "thursday", "friday"];
      const dayOfWeek = new Date(parsedDate + "T12:00:00").toLocaleDateString("en-US", { weekday: "long" }).toLowerCase();

      if (!workingDays.includes(dayOfWeek)) {
        const daysMap: Record<string, string> = {
          monday: "Segunda", tuesday: "Terça", wednesday: "Quarta",
          thursday: "Quinta", friday: "Sexta", saturday: "Sábado", sunday: "Domingo",
        };
        return `❌ Não atendemos neste dia.\n\nDias disponíveis: ${workingDays.map((d: string) => daysMap[d] || d).join(", ")}\n\n_Digite outra data ou *0* para voltar_`;
      }

      const startHour = settings?.working_hours_start || "09:00";
      const endHour = settings?.working_hours_end || "18:00";
      const interval = settings?.appointment_interval || 30;

      const { data: existing } = await supabase
        .from("appointments")
        .select("time")
        .eq("user_id", businessUserId)
        .eq("date", parsedDate)
        .neq("status", "cancelado");

      const booked = new Set((existing || []).map((a: any) => a.time.slice(0, 5)));
      const [sH, sM] = startHour.split(":").map(Number);
      const [eH, eM] = endHour.split(":").map(Number);
      let cur = sH * 60 + sM;
      const end = eH * 60 + eM;
      const slots: string[] = [];

      while (cur < end) {
        const t = `${Math.floor(cur / 60).toString().padStart(2, "0")}:${(cur % 60).toString().padStart(2, "0")}`;
        if (!booked.has(t)) slots.push(t);
        cur += interval;
      }

      if (slots.length === 0) {
        return `😕 Sem horários para ${formatDate(parsedDate)}.\n\n_Digite outra data ou *0* para voltar_`;
      }

      let msg = `📅 *${formatDate(parsedDate)}*\n\nHorários disponíveis:\n\n`;
      slots.forEach((s, i) => { msg += `*${i + 1}* - ${s}\n`; });
      msg += "\n_Digite o número do horário ou *0* para voltar_";

      await updateConversation(supabase, conversation.id, {
        current_step: "awaiting_time",
        selected_date: parsedDate,
        conversation_data: { ...conversation.conversation_data, availableSlots: slots },
      });
      return msg;
    }

    case "awaiting_time": {
      const slots = conversation.conversation_data?.availableSlots || [];
      const idx = parseInt(text, 10) - 1;
      const direct = parseTime(messageBody);
      let selectedTime: string | null = null;

      if (idx >= 0 && idx < slots.length) selectedTime = slots[idx];
      else if (direct && slots.includes(direct)) selectedTime = direct;

      if (selectedTime) {
        await updateConversation(supabase, conversation.id, {
          current_step: "awaiting_name",
          selected_time: selectedTime,
        });
        return `✅ Horário: *${selectedTime}*\n\n👤 Informe seu *nome completo*:\n\n_Digite *0* para voltar ao menu_`;
      }
      return "❌ Horário inválido. Digite o *número* do horário.\n\n_Digite *0* para voltar ao menu_";
    }

    case "awaiting_name": {
      const clientName = messageBody.trim();
      if (clientName.length < 2 || clientName.length > 100 || !/^[\p{L}\s'\-]+$/u.test(clientName)) {
        return "❌ Nome inválido. Use apenas letras (sem números).\n\n_Digite *0* para voltar ao menu_";
      }

      const selectedService = conversation.conversation_data?.selectedService;
      await updateConversation(supabase, conversation.id, {
        current_step: "awaiting_confirmation",
        client_name: clientName,
      });

      return `📋 *Resumo do Agendamento*\n\n👤 Cliente: *${clientName}*\n✂️ Serviço: *${selectedService?.name || "Serviço"}*\n💰 Valor: *R$ ${selectedService?.price?.toFixed(2) || "0.00"}*\n📅 Data: *${formatDate(conversation.selected_date || "")}*\n⏰ Horário: *${conversation.selected_time}*\n📍 Local: *${businessName}*\n\n*Confirma?*\n\n*1* - ✅ Confirmar\n*2* - ❌ Cancelar`;
    }

    case "awaiting_confirmation": {
      if (text === "1" || text === "sim" || text === "s") {
        const selectedService = conversation.conversation_data?.selectedService;

        const { data: appointment, error: appErr } = await supabase
          .from("appointments")
          .insert({
            user_id: businessUserId,
            client_name: conversation.client_name,
            client_whatsapp: senderNumber,
            service_id: conversation.selected_service_id,
            date: conversation.selected_date,
            time: conversation.selected_time,
            status: "confirmado",
            confirmed_at: new Date().toISOString(),
          })
          .select()
          .single();

        if (appErr) {
          console.error("[BOT] Error creating appointment:", appErr);
          return "❌ Erro ao criar agendamento. Tente novamente.\n\n_Digite *0* para voltar ao menu_";
        }

        // Create reminders
        const dt = new Date(`${conversation.selected_date}T${conversation.selected_time}`);
        const r24 = new Date(dt.getTime() - 24 * 60 * 60 * 1000);
        if (r24 > new Date()) {
          await supabase.from("reminders").insert({
            appointment_id: appointment.id,
            user_id: businessUserId,
            scheduled_for: r24.toISOString(),
            status: "pending",
            reminder_type: "24h",
            message: `⏰ *Lembrete*\n\nSeu horário é *amanhã* às *${conversation.selected_time}* para *${selectedService?.name}*.\n\n📍 ${businessName}`,
          });
        }
        const r2 = new Date(dt.getTime() - 2 * 60 * 60 * 1000);
        if (r2 > new Date()) {
          await supabase.from("reminders").insert({
            appointment_id: appointment.id,
            user_id: businessUserId,
            scheduled_for: r2.toISOString(),
            status: "pending",
            reminder_type: "2h",
            message: `⏰ *Seu horário é em 2 horas!*\n\n📅 Hoje às *${conversation.selected_time}*\n✂️ ${selectedService?.name}\n📍 ${businessName}`,
          });
        }

        await deleteConversation(supabase, conversation.id);

        // Flag to notify owner after response
        return `__NOTIFY_OWNER__${JSON.stringify({ appointmentId: appointment.id, clientName: conversation.client_name, phone: senderNumber, date: conversation.selected_date, time: conversation.selected_time, service: selectedService?.name, price: selectedService?.price })}__END__✅ *Agendamento confirmado!*\n\n📅 *Data:* ${formatDate(conversation.selected_date || "")}\n⏰ *Horário:* ${conversation.selected_time}\n✂️ *Serviço:* ${selectedService?.name}\n📍 *${businessName}*\n\nVocê receberá lembretes automáticos.\nObrigado! 🎉\n\n_Digite *0* para novo agendamento_`;
      }

      if (text === "2" || text === "nao" || text === "não" || text === "n") {
        await updateConversation(supabase, conversation.id, {
          current_step: "menu",
          selected_service_id: null,
          selected_date: null,
          selected_time: null,
          client_name: null,
        });
        return "❌ Agendamento cancelado.\n\nDigite *1* para novo agendamento.\n_Ou *0* para voltar ao menu_";
      }

      return "Por favor, confirme:\n\n*1* - ✅ Confirmar\n*2* - ❌ Cancelar";
    }

    default:
      return "Desculpe, não entendi. Digite *0* para voltar ao menu.";
  }
}

// ===== MAIN HANDLER =====

Deno.serve(async (req) => {
  // Handle webhook verification (GET request from Meta)
  if (req.method === "GET") {
    const url = new URL(req.url);
    const mode = url.searchParams.get("hub.mode");
    const verifyToken = url.searchParams.get("hub.verify_token");
    const challenge = url.searchParams.get("hub.challenge");

    const expectedToken = Deno.env.get("WHATSAPP_WEBHOOK_VERIFY_TOKEN") || "ultramind_verify_token";

    console.log(`[WEBHOOK GET] Verification - mode: ${mode}, token match: ${verifyToken === expectedToken}`);

    if (mode === "subscribe" && verifyToken === expectedToken) {
      console.log("[WEBHOOK GET] ✅ Verified");
      return new Response(challenge, { status: 200 });
    }

    return new Response("Forbidden", { status: 403 });
  }

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  try {
    const body = await req.json();
    console.log("[WEBHOOK POST] Received:", JSON.stringify(body).substring(0, 1000));

    const serviceClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const entries = body?.entry || [];
    for (const entry of entries) {
      const changes = entry?.changes || [];
      for (const change of changes) {
        const value = change?.value || {};
        const metadata = value?.metadata || {};
        const phoneNumberId = metadata?.phone_number_id;

        // --- Process incoming MESSAGES ---
        const messages = value?.messages || [];
        const contacts = value?.contacts || [];

        for (const message of messages) {
          const senderNumber = message?.from;
          const messageText = message?.text?.body || "";
          const messageId = message?.id;
          const messageType = message?.type;
          const contactName =
            contacts?.find((c: any) => c?.wa_id === senderNumber)?.profile?.name || "Desconhecido";

          console.log(`[WEBHOOK MSG] 📩 De: ${senderNumber} (${contactName}), Texto: "${messageText}", Type: ${messageType}`);

          // Log incoming message
          await serviceClient.from("webhook_logs").insert({
            event_type: "whatsapp_incoming_message",
            event_action: messageType || "text",
            status: "received",
            severity: "info",
            payload: {
              from: senderNumber,
              contact_name: contactName,
              text: messageText,
              phone_number_id: phoneNumberId,
              message_id: messageId,
            },
          });

          // Only process text messages
          if (messageType !== "text" || !messageText) {
            console.log("[WEBHOOK MSG] ⏭️ Skipping non-text message");
            continue;
          }

          // Find business by phone_number_id
          const { data: waConfig, error: configErr } = await serviceClient
            .from("companies_whatsapp_config")
            .select("user_id, access_token, phone_number_id, business_name")
            .eq("phone_number_id", phoneNumberId)
            .eq("is_verified", true)
            .single();

          if (configErr || !waConfig) {
            console.error(`[WEBHOOK MSG] ❌ No config found for phone_number_id: ${phoneNumberId}`, configErr);
            continue;
          }

          const businessUserId = waConfig.user_id;
          console.log(`[WEBHOOK MSG] 🏢 Business: ${waConfig.business_name || businessUserId}`);

          // Check if bot is active and has credits
          const { data: canSend } = await serviceClient.rpc("can_send_whatsapp_message", {
            p_user_id: businessUserId,
          });

          if (!canSend) {
            const { data: credits } = await serviceClient.rpc("get_available_credits", {
              p_user_id: businessUserId,
            });
            const reason = credits === 0 ? "sem créditos" : "bot inativo";
            console.log(`[WEBHOOK MSG] ⚠️ Bot unavailable: ${reason}`);

            // Log that we couldn't respond
            await serviceClient.from("webhook_logs").insert({
              event_type: "whatsapp_bot_skipped",
              event_action: reason,
              status: "skipped",
              severity: "warning",
              payload: { from: senderNumber, business_user_id: businessUserId, reason },
            });
            continue;
          }

          // Process bot logic
          let botResponse: string;
          try {
            botResponse = await processBotMessage(serviceClient, senderNumber, messageText, businessUserId);
          } catch (botErr: any) {
            console.error("[WEBHOOK MSG] ❌ Bot error:", botErr);
            botResponse = "Desculpe, ocorreu um erro. Tente novamente mais tarde.\n\nDigite *0* para voltar ao menu.";

            await serviceClient.from("webhook_logs").insert({
              event_type: "whatsapp_bot_error",
              event_action: "processing_error",
              status: "error",
              severity: "error",
              error_message: botErr.message,
              payload: { from: senderNumber, text: messageText, business_user_id: businessUserId },
            });
          }

          // Check for owner notification flag
          let ownerNotification: any = null;
          if (botResponse.startsWith("__NOTIFY_OWNER__")) {
            const match = botResponse.match(/__NOTIFY_OWNER__(.+?)__END__([\s\S]*)/);
            if (match) {
              try {
                ownerNotification = JSON.parse(match[1]);
              } catch {}
              botResponse = match[2];
            }
          }

          // Send bot response via Meta Cloud API
          const sendResult = await sendMetaMessage(
            waConfig.phone_number_id,
            waConfig.access_token,
            senderNumber,
            botResponse
          );

          // Consume credit if sent successfully
          if (sendResult.success) {
            await serviceClient.rpc("consume_credit", { p_user_id: businessUserId, p_amount: 1 });
          }

          // Log outgoing message
          await serviceClient.from("whatsapp_message_logs").insert({
            user_id: businessUserId,
            recipient_phone: senderNumber,
            recipient_type: "client",
            message_type: "bot_reply",
            message_content: botResponse.substring(0, 5000),
            status: sendResult.success ? "sent" : "failed",
            error_message: sendResult.error || null,
            sent_at: sendResult.success ? new Date().toISOString() : null,
          });

          console.log(`[WEBHOOK MSG] ${sendResult.success ? "✅" : "❌"} Bot response ${sendResult.success ? "sent" : "failed"} to ${senderNumber}`);

          // Send owner notification if needed
          if (ownerNotification && sendResult.success) {
            const { data: profile } = await serviceClient
              .from("profiles")
              .select("whatsapp")
              .eq("user_id", businessUserId)
              .single();

            if (profile?.whatsapp) {
              const ownerMsg = `📅 *Novo agendamento via Bot!*\n\n👤 *Cliente:* ${ownerNotification.clientName}\n📱 *WhatsApp:* ${ownerNotification.phone}\n📅 *Data:* ${formatDate(ownerNotification.date)}\n⏰ *Horário:* ${ownerNotification.time}\n✂️ *Serviço:* ${ownerNotification.service}\n💰 *Valor:* R$ ${ownerNotification.price?.toFixed(2) || "0.00"}\n\n_Bot WhatsApp UltraMind_`;

              const ownerResult = await sendMetaMessage(
                waConfig.phone_number_id,
                waConfig.access_token,
                profile.whatsapp.replace(/\D/g, ""),
                ownerMsg
              );

              if (ownerResult.success) {
                await serviceClient.rpc("consume_credit", { p_user_id: businessUserId, p_amount: 1 });
              }

              await serviceClient.from("whatsapp_message_logs").insert({
                user_id: businessUserId,
                appointment_id: ownerNotification.appointmentId,
                recipient_phone: profile.whatsapp,
                recipient_type: "owner",
                message_type: "confirmation",
                message_content: ownerMsg,
                status: ownerResult.success ? "sent" : "failed",
                error_message: ownerResult.error || null,
                sent_at: ownerResult.success ? new Date().toISOString() : null,
              });
            }
          }
        }

        // --- Process STATUS UPDATES ---
        const statuses = value?.statuses || [];
        for (const statusUpdate of statuses) {
          const msgId = statusUpdate?.id;
          const status = statusUpdate?.status;
          const recipientId = statusUpdate?.recipient_id;
          const errors = statusUpdate?.errors;

          if (!msgId || !status) continue;

          console.log(`[WEBHOOK STATUS] 📊 ${msgId} -> ${status} (to: ${recipientId})`);

          let errorCode = null;
          let errorMessage = null;
          if (status === "failed" && errors?.length > 0) {
            errorCode = errors[0]?.code?.toString();
            errorMessage = errors[0]?.title || errors[0]?.message;
          }

          await serviceClient
            .from("whatsapp_business_messages")
            .update({
              status,
              status_updated_at: statusUpdate?.timestamp
                ? new Date(parseInt(statusUpdate.timestamp) * 1000).toISOString()
                : new Date().toISOString(),
              ...(errorCode ? { error_code: errorCode } : {}),
              ...(errorMessage ? { error_message: errorMessage } : {}),
            })
            .eq("message_id", msgId);
        }
      }
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("[WEBHOOK POST] ❌ Processing error:", err);
    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
