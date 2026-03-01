import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const META_API_VERSION = "v18.0";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Auth check
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const userId = claimsData.claims.sub;

    const body = await req.json();
    const { phone_number_id, access_token, business_account_id } = body;

    // Validate inputs
    if (!phone_number_id || !access_token || !business_account_id) {
      return new Response(
        JSON.stringify({ error: "phone_number_id, access_token e business_account_id são obrigatórios" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (phone_number_id.length > 50 || business_account_id.length > 50) {
      return new Response(
        JSON.stringify({ error: "IDs inválidos" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate token with Meta API
    console.log("Validating Meta API token...");
    const metaResponse = await fetch(
      `https://graph.facebook.com/${META_API_VERSION}/${phone_number_id}?fields=display_phone_number,verified_name,quality_rating`,
      {
        headers: { Authorization: `Bearer ${access_token}` },
      }
    );

    if (!metaResponse.ok) {
      const errorData = await metaResponse.json().catch(() => ({}));
      console.error("Meta API validation failed:", errorData);
      return new Response(
        JSON.stringify({
          error: "Token inválido ou Phone Number ID incorreto",
          details: errorData?.error?.message || "Falha na validação com a API da Meta",
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const metaData = await metaResponse.json();
    console.log("Meta API validation successful:", metaData.display_phone_number);

    // Save config using service role for encryption safety
    const serviceClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { data, error } = await serviceClient
      .from("companies_whatsapp_config")
      .upsert(
        {
          user_id: userId,
          phone_number_id,
          access_token,
          business_account_id,
          is_verified: true,
          verified_at: new Date().toISOString(),
          phone_display: metaData.display_phone_number || null,
          business_name: metaData.verified_name || null,
        },
        { onConflict: "user_id" }
      )
      .select()
      .single();

    if (error) {
      console.error("Error saving config:", error);
      return new Response(
        JSON.stringify({ error: "Erro ao salvar configuração" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        status: "connected",
        phone_display: metaData.display_phone_number,
        business_name: metaData.verified_name,
        quality_rating: metaData.quality_rating,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("Unexpected error:", err);
    return new Response(
      JSON.stringify({ error: "Erro interno do servidor" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
