import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface CreatePaymentRequest {
  type: "plan" | "credits";
  plan?: "basic" | "pro" | "premium";
  credits_package?: string;
  payment_method: "pix" | "credit_card" | "boleto" | "checkout_pro";
  card_token?: string;
  installments?: number;
  payer_email?: string;
  payer_name?: string;
  payer_cpf?: string;
}

const PLAN_PRICES: Record<string, { price: number; credits: number; name: string }> = {
  basic: { price: 49, credits: 0, name: "Essencial" },
  pro: { price: 99, credits: 600, name: "Profissional" },
  premium: { price: 199, credits: 2500, name: "Master" },
};

const CREDIT_PACKAGES: Record<string, { credits: number; price: number }> = {
  pack_300: { credits: 300, price: 29 },
  pack_800: { credits: 800, price: 59 },
  pack_2000: { credits: 2000, price: 119 },
};

// Checkout Pro: creates a preference and returns init_point URL
async function createCheckoutProPreference(
  accessToken: string,
  amount: number,
  description: string,
  externalReference: string,
  payerEmail: string,
  notificationUrl: string,
  backUrls: { success: string; failure: string; pending: string }
) {
  const response = await fetch("https://api.mercadopago.com/checkout/preferences", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({
      items: [
        {
          title: description,
          quantity: 1,
          unit_price: amount,
          currency_id: "BRL",
        },
      ],
      payer: { email: payerEmail },
      payment_methods: {
        installments: 12,
        excluded_payment_types: [],
      },
      external_reference: externalReference,
      notification_url: notificationUrl,
      back_urls: backUrls,
      auto_return: "approved",
      statement_descriptor: "UltraMind SaaS",
    }),
  });

  const data = await response.json();
  console.log("Checkout Pro preference response:", JSON.stringify(data, null, 2));

  if (!response.ok) {
    throw new Error(`Checkout Pro error: ${data.message || JSON.stringify(data)}`);
  }

  return data;
}

// Direct payment via /v1/payments (PIX, boleto, credit_card)
async function createDirectPayment(
  accessToken: string,
  amount: number,
  description: string,
  paymentMethod: string,
  externalReference: string,
  payer: { email: string; first_name?: string; identification?: { type: string; number: string } },
  notificationUrl: string,
  cardToken?: string,
  installments?: number
) {
  const paymentData: Record<string, unknown> = {
    transaction_amount: amount,
    description,
    external_reference: externalReference,
    payer,
    notification_url: notificationUrl,
  };

  if (paymentMethod === "pix") {
    paymentData.payment_method_id = "pix";
  } else if (paymentMethod === "credit_card" && cardToken) {
    paymentData.token = cardToken;
    paymentData.installments = installments || 1;
    paymentData.payment_method_id = "credit_card";
  } else if (paymentMethod === "boleto") {
    paymentData.payment_method_id = "bolbradesco";
    paymentData.date_of_expiration = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString();
  }

  console.log("Creating direct payment:", JSON.stringify(paymentData, null, 2));

  const response = await fetch("https://api.mercadopago.com/v1/payments", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
      "X-Idempotency-Key": externalReference,
    },
    body: JSON.stringify(paymentData),
  });

  const data = await response.json();
  console.log("Direct payment response:", JSON.stringify(data, null, 2));

  if (!response.ok) {
    throw new Error(`Mercado Pago error: ${data.message || JSON.stringify(data)}`);
  }

  return data;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const accessToken = Deno.env.get("MERCADOPAGO_ACCESS_TOKEN");
    if (!accessToken) {
      throw new Error("MERCADOPAGO_ACCESS_TOKEN not configured");
    }

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("Authorization header required");
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      throw new Error("User not authenticated");
    }

    const body: CreatePaymentRequest = await req.json();
    console.log("Payment request:", JSON.stringify(body, null, 2));

    if (!body.type || !body.payment_method) {
      throw new Error("Missing required fields: type, payment_method");
    }

    let amount: number;
    let description: string;
    let creditsAmount: number | null = null;
    let planName: string | null = null;

    if (body.type === "plan") {
      if (!body.plan || !PLAN_PRICES[body.plan]) {
        throw new Error("Invalid plan");
      }
      amount = PLAN_PRICES[body.plan].price;
      planName = body.plan;
      description = `UltraMind Solutions - Plano ${PLAN_PRICES[body.plan].name}`;
    } else if (body.type === "credits") {
      if (!body.credits_package || !CREDIT_PACKAGES[body.credits_package]) {
        throw new Error("Invalid credits package");
      }
      const pkg = CREDIT_PACKAGES[body.credits_package];
      amount = pkg.price;
      creditsAmount = pkg.credits;
      description = `UltraMind Solutions - ${pkg.credits} Créditos WhatsApp`;
    } else {
      throw new Error("Invalid payment type");
    }

    const externalReference = `ultramind_${user.id}_${Date.now()}`;
    const notificationUrl = `${supabaseUrl}/functions/v1/payment-webhook`;

    const supabaseAdmin = createClient(
      supabaseUrl,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { data: paymentRecord, error: insertError } = await supabaseAdmin
      .from("payments")
      .insert({
        user_id: user.id,
        type: body.type,
        plan: planName,
        credits_amount: creditsAmount,
        amount,
        payment_method: body.payment_method === "checkout_pro" ? "checkout_pro" : body.payment_method,
        external_reference: externalReference,
        status: "pending",
      })
      .select()
      .single();

    if (insertError) {
      console.error("Error inserting payment:", insertError);
      throw new Error("Failed to create payment record");
    }

    // --- CHECKOUT PRO FLOW ---
    if (body.payment_method === "checkout_pro") {
      // Determine back URLs based on origin or fallback
      const origin = req.headers.get("origin") || "https://ultramind.lovable.app";
      const backUrls = {
        success: `${origin}/dashboard/planos?payment=success&id=${paymentRecord.id}`,
        failure: `${origin}/dashboard/planos?payment=failure&id=${paymentRecord.id}`,
        pending: `${origin}/dashboard/planos?payment=pending&id=${paymentRecord.id}`,
      };

      const preference = await createCheckoutProPreference(
        accessToken,
        amount,
        description,
        externalReference,
        body.payer_email || user.email || "cliente@ultramind.app",
        notificationUrl,
        backUrls
      );

      // Update payment with preference ID
      await supabaseAdmin
        .from("payments")
        .update({
          external_id: preference.id,
          metadata: { checkout_pro: true, init_point: preference.init_point },
        })
        .eq("id", paymentRecord.id);

      return new Response(
        JSON.stringify({
          success: true,
          payment_id: paymentRecord.id,
          external_id: preference.id,
          status: "pending",
          checkout_url: preference.init_point,
          sandbox_checkout_url: preference.sandbox_init_point,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // --- DIRECT PAYMENT FLOW (PIX, Card, Boleto) ---
    const payer: { email: string; first_name?: string; identification?: { type: string; number: string } } = {
      email: body.payer_email || user.email || "cliente@ultramind.app",
    };
    if (body.payer_name) payer.first_name = body.payer_name;
    if (body.payer_cpf) {
      payer.identification = { type: "CPF", number: body.payer_cpf.replace(/\D/g, "") };
    }

    const mpPayment = await createDirectPayment(
      accessToken,
      amount,
      description,
      body.payment_method,
      externalReference,
      payer,
      notificationUrl,
      body.card_token,
      body.installments
    );

    const updateData: Record<string, unknown> = {
      external_id: mpPayment.id.toString(),
      status: mpPayment.status,
    };

    if (body.payment_method === "pix" && mpPayment.point_of_interaction?.transaction_data) {
      const txData = mpPayment.point_of_interaction.transaction_data;
      updateData.pix_qr_code = txData.qr_code;
      updateData.pix_qr_code_base64 = txData.qr_code_base64;
      updateData.pix_copy_paste = txData.qr_code;
      updateData.expires_at = mpPayment.date_of_expiration;
    } else if (body.payment_method === "boleto" && mpPayment.transaction_details) {
      updateData.boleto_url = mpPayment.transaction_details.external_resource_url;
      updateData.boleto_barcode = mpPayment.barcode?.content;
      updateData.boleto_expiration = mpPayment.date_of_expiration?.split("T")[0];
      updateData.expires_at = mpPayment.date_of_expiration;
    } else if (body.payment_method === "credit_card") {
      if (mpPayment.card) {
        updateData.card_last_four = mpPayment.card.last_four_digits;
        updateData.card_brand = mpPayment.payment_method_id;
      }
      updateData.installments = body.installments || 1;
    }

    if (mpPayment.status === "approved") {
      updateData.paid_at = new Date().toISOString();
    }

    await supabaseAdmin.from("payments").update(updateData).eq("id", paymentRecord.id);

    if (mpPayment.status === "approved") {
      await supabaseAdmin.rpc("process_approved_payment", { p_payment_id: paymentRecord.id });
    }

    const response: Record<string, unknown> = {
      success: true,
      payment_id: paymentRecord.id,
      external_id: mpPayment.id,
      status: mpPayment.status,
      status_detail: mpPayment.status_detail,
    };

    if (body.payment_method === "pix") {
      response.pix = {
        qr_code: mpPayment.point_of_interaction?.transaction_data?.qr_code,
        qr_code_base64: mpPayment.point_of_interaction?.transaction_data?.qr_code_base64,
        expires_at: mpPayment.date_of_expiration,
      };
    } else if (body.payment_method === "boleto") {
      response.boleto = {
        url: mpPayment.transaction_details?.external_resource_url,
        barcode: mpPayment.barcode?.content,
        expires_at: mpPayment.date_of_expiration,
      };
    }

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: unknown) {
    console.error("Error creating payment:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
