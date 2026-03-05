import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header");

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) throw new Error("Unauthorized");

    // Fetch all user data in parallel
    const [appointmentsRes, servicesRes, clientsRes, settingsRes] = await Promise.all([
      supabase.from("appointments").select("*").eq("user_id", user.id).order("date", { ascending: false }).limit(500),
      supabase.from("services").select("*").eq("user_id", user.id),
      supabase.from("clients").select("*").eq("user_id", user.id),
      supabase.from("settings").select("*").eq("user_id", user.id).single(),
    ]);

    const appointments = appointmentsRes.data || [];
    const services = servicesRes.data || [];
    const clients = clientsRes.data || [];
    const settings = settingsRes.data;

    // Build a summary for the AI
    const today = new Date().toISOString().split("T")[0];
    const thisMonth = today.slice(0, 7);

    const monthAppts = appointments.filter((a: any) => a.date.startsWith(thisMonth));
    const confirmed = monthAppts.filter((a: any) => a.status === "confirmado").length;
    const cancelled = monthAppts.filter((a: any) => a.status === "cancelado").length;
    const completed = monthAppts.filter((a: any) => a.status === "concluido").length;
    const noShows = monthAppts.filter((a: any) => a.status === "falta").length;
    const pending = monthAppts.filter((a: any) => a.status === "pending").length;

    // Hour distribution
    const hourCounts: Record<string, number> = {};
    appointments.forEach((a: any) => {
      const hour = a.time?.slice(0, 5) || "00:00";
      hourCounts[hour] = (hourCounts[hour] || 0) + 1;
    });

    // Day of week distribution
    const dayCounts: Record<string, number> = {};
    const dayNames = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];
    appointments.forEach((a: any) => {
      const day = dayNames[new Date(a.date + "T00:00:00").getDay()];
      dayCounts[day] = (dayCounts[day] || 0) + 1;
    });

    // Service popularity
    const serviceCounts: Record<string, number> = {};
    appointments.forEach((a: any) => {
      if (a.service_id) {
        const svc = services.find((s: any) => s.id === a.service_id);
        const name = svc?.name || "Desconhecido";
        serviceCounts[name] = (serviceCounts[name] || 0) + 1;
      }
    });

    // No-show clients
    const clientNoShows: Record<string, number> = {};
    appointments.filter((a: any) => a.status === "falta").forEach((a: any) => {
      clientNoShows[a.client_name] = (clientNoShows[a.client_name] || 0) + 1;
    });
    const frequentNoShows = Object.entries(clientNoShows)
      .filter(([, count]) => count >= 2)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);

    // Today's empty slots
    const todayAppts = appointments.filter((a: any) => a.date === today && a.status !== "cancelado");
    const workStart = settings?.working_hours_start || "09:00";
    const workEnd = settings?.working_hours_end || "18:00";
    const interval = settings?.appointment_interval || 30;

    const allSlots: string[] = [];
    let current = workStart;
    while (current < workEnd) {
      allSlots.push(current);
      const [h, m] = current.split(":").map(Number);
      const totalMin = h * 60 + m + interval;
      current = `${String(Math.floor(totalMin / 60)).padStart(2, "0")}:${String(totalMin % 60).padStart(2, "0")}`;
    }
    const occupiedSlots = new Set(todayAppts.map((a: any) => a.time?.slice(0, 5)));
    const emptySlots = allSlots.filter(s => !occupiedSlots.has(s));

    const dataSummary = `
Dados do negócio (mês atual: ${thisMonth}):
- Total de agendamentos no mês: ${monthAppts.length}
- Confirmados: ${confirmed}
- Concluídos: ${completed}
- Cancelamentos: ${cancelled}
- Faltas: ${noShows}
- Pendentes: ${pending}
- Taxa de ocupação: ${monthAppts.length > 0 ? Math.round(((completed + confirmed) / monthAppts.length) * 100) : 0}%
- Serviços cadastrados: ${services.length}
- Clientes cadastrados: ${clients.length}

Distribuição por horário (top 5):
${Object.entries(hourCounts).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([h, c]) => `  ${h}: ${c} agendamentos`).join("\n")}

Distribuição por dia da semana:
${Object.entries(dayCounts).sort((a, b) => b[1] - a[1]).map(([d, c]) => `  ${d}: ${c} agendamentos`).join("\n")}

Serviços mais populares:
${Object.entries(serviceCounts).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([s, c]) => `  ${s}: ${c} vezes`).join("\n")}

Clientes com faltas frequentes:
${frequentNoShows.length > 0 ? frequentNoShows.map(([name, count]) => `  ${name}: ${count} faltas`).join("\n") : "  Nenhum cliente com faltas frequentes"}

Horários vazios hoje (${today}):
${emptySlots.length > 0 ? `  ${emptySlots.length} horários vazios: ${emptySlots.slice(0, 8).join(", ")}${emptySlots.length > 8 ? "..." : ""}` : "  Nenhum horário vazio"}

Horário de funcionamento: ${workStart} - ${workEnd}
Intervalo entre agendamentos: ${interval} minutos
`;

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          {
            role: "system",
            content: `Você é um assistente de inteligência artificial para gestão de agenda de negócios locais (salões, barbearias, clínicas, etc). Analise os dados fornecidos e retorne insights e recomendações.

IMPORTANTE: Responda APENAS com um JSON válido no formato especificado. Não inclua markdown, explicações ou texto fora do JSON.

Formato de resposta:
{
  "insights": [
    {"icon": "clock|calendar|trending|users|scissors|alert", "title": "Título curto", "description": "Descrição detalhada", "type": "info|warning|success|tip"}
  ],
  "recommendations": [
    {"title": "Título da recomendação", "description": "Detalhes da recomendação", "priority": "high|medium|low"}
  ],
  "metrics": {
    "occupancy_rate": number,
    "cancellation_rate": number,
    "no_show_rate": number,
    "confirmation_rate": number,
    "busiest_hour": "HH:MM",
    "slowest_day": "Nome do dia",
    "top_service": "Nome do serviço",
    "empty_slots_today": number
  },
  "suggested_time": "HH:MM ou null"
}

Gere entre 4-6 insights relevantes e 2-4 recomendações acionáveis. Seja específico com os dados fornecidos.`
          },
          {
            role: "user",
            content: dataSummary,
          },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "return_insights",
              description: "Return agenda insights and recommendations",
              parameters: {
                type: "object",
                properties: {
                  insights: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        icon: { type: "string", enum: ["clock", "calendar", "trending", "users", "scissors", "alert"] },
                        title: { type: "string" },
                        description: { type: "string" },
                        type: { type: "string", enum: ["info", "warning", "success", "tip"] }
                      },
                      required: ["icon", "title", "description", "type"],
                      additionalProperties: false
                    }
                  },
                  recommendations: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        title: { type: "string" },
                        description: { type: "string" },
                        priority: { type: "string", enum: ["high", "medium", "low"] }
                      },
                      required: ["title", "description", "priority"],
                      additionalProperties: false
                    }
                  },
                  metrics: {
                    type: "object",
                    properties: {
                      occupancy_rate: { type: "number" },
                      cancellation_rate: { type: "number" },
                      no_show_rate: { type: "number" },
                      confirmation_rate: { type: "number" },
                      busiest_hour: { type: "string" },
                      slowest_day: { type: "string" },
                      top_service: { type: "string" },
                      empty_slots_today: { type: "number" }
                    },
                    required: ["occupancy_rate", "cancellation_rate", "no_show_rate", "confirmation_rate", "busiest_hour", "slowest_day", "top_service", "empty_slots_today"],
                    additionalProperties: false
                  },
                  suggested_time: { type: "string", description: "Best suggested time for next appointment or null" }
                },
                required: ["insights", "recommendations", "metrics", "suggested_time"],
                additionalProperties: false
              }
            }
          }
        ],
        tool_choice: { type: "function", function: { name: "return_insights" } },
      }),
    });

    if (!aiResponse.ok) {
      if (aiResponse.status === 429) {
        return new Response(JSON.stringify({ error: "Limite de requisições atingido. Tente novamente em alguns minutos." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (aiResponse.status === 402) {
        return new Response(JSON.stringify({ error: "Créditos de IA esgotados." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errorText = await aiResponse.text();
      console.error("AI gateway error:", aiResponse.status, errorText);
      throw new Error("AI gateway error");
    }

    const aiData = await aiResponse.json();
    
    // Extract tool call result
    let result;
    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
    if (toolCall?.function?.arguments) {
      result = typeof toolCall.function.arguments === "string" 
        ? JSON.parse(toolCall.function.arguments) 
        : toolCall.function.arguments;
    } else {
      // Fallback: try to parse from content
      const content = aiData.choices?.[0]?.message?.content || "";
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        result = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error("Could not parse AI response");
      }
    }

    // Add raw computed data
    result.rawMetrics = {
      monthTotal: monthAppts.length,
      confirmed,
      completed,
      cancelled,
      noShows,
      pending,
      emptySlots: emptySlots.length,
      frequentNoShows,
    };

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("agenda-insights error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
