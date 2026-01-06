import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface PresenceResponse {
  appointment_id: string;
  response: "sim" | "nao" | "yes" | "no";
  client_phone?: string;
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

    const payload: PresenceResponse = await req.json();
    
    console.log("Processing presence response:", payload);

    if (!payload.appointment_id) {
      throw new Error("appointment_id is required");
    }

    // Normalize response
    const isConfirmed = ["sim", "yes", "s", "1"].includes(
      payload.response.toLowerCase().trim()
    );

    const newStatus = isConfirmed ? "confirmado" : "cancelado";

    // Update appointment status
    const { data, error } = await supabase
      .from("appointments")
      .update({ 
        status: newStatus,
        confirmed_at: isConfirmed ? new Date().toISOString() : null
      })
      .eq("id", payload.appointment_id)
      .select()
      .single();

    if (error) {
      console.error("Error updating appointment:", error);
      throw error;
    }

    console.log(`Appointment ${payload.appointment_id} updated to ${newStatus}`);

    return new Response(
      JSON.stringify({
        success: true,
        status: newStatus,
        appointment: data,
        message: isConfirmed 
          ? "Presença confirmada com sucesso!" 
          : "Agendamento cancelado conforme solicitado."
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("Error in whatsapp-presence-webhook:", error);
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
