import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface CreatePaymentRequest {
  type: "plan" | "credits";
  plan?: "basic" | "pro" | "premium";
  credits_package?: string; // pack_300, pack_800, pack_2000
  payment_method: "pix" | "credit_card" | "boleto";
  card_token?: string; // For credit card payments
  installments?: number;
  payer_email?: string;
  payer_name?: string;
  payer_cpf?: string;
}

// Plan prices and credits
const PLAN_PRICES: Record<string, { price: number; credits: number }> = {
  basic: { price: 49, credits: 0 },
  pro: { price: 99, credits: 600 },
  premium: { price: 199, credits: 2500 },
};

// Credit packages
const CREDIT_PACKAGES: Record<string, { credits: number; price: number }> = {
  pack_300: { credits: 300, price: 29 },
  pack_800: { credits: 800, price: 59 },
  pack_2000: { credits: 2000, price: 119 },
};

async function createMercadoPagoPayment(
  accessToken: string,
  amount: number,
  description: string,
  paymentMethod: string,
  externalReference: string,
  payer: { email: string; first_name?: string; identification?: { type: string; number: string } },
  cardToken?: string,
  installments?: number
) {
  const baseUrl = "https://api.mercadopago.com/v1/payments";

  let paymentData: Record<string, unknown> = {
    transaction_amount: amount,
    description,
    external_reference: externalReference,
    payer,
    notification_url: `${Deno.env.get("SUPABASE_URL")}/functions/v1/payment-webhook`,
  };

  if (paymentMethod === "pix") {
    paymentData.payment_method_id = "pix";
  } else if (paymentMethod === "credit_card" && cardToken) {
    paymentData.token = cardToken;
    paymentData.installments = installments || 1;
    paymentData.payment_method_id = "credit_card";
  } else if (paymentMethod === "boleto") {
    paymentData.payment_method_id = "bolbradesco";
    paymentData.date_of_expiration = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(); // 3 days
  }

  console.log("Creating Mercado Pago payment:", JSON.stringify(paymentData, null, 2));

  const response = await fetch(baseUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
      "X-Idempotency-Key": externalReference,
    },
    body: JSON.stringify(paymentData),
  });

  const data = await response.json();
  console.log("Mercado Pago response:", JSON.stringify(data, null, 2));

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

    // Get authorization header
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("Authorization header required");
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      throw new Error("User not authenticated");
    }

    // Parse request
    const body: CreatePaymentRequest = await req.json();
    console.log("Payment request:", JSON.stringify(body, null, 2));

    // Validate request
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
      description = `UltraMind - Plano ${body.plan.charAt(0).toUpperCase() + body.plan.slice(1)}`;
    } else if (body.type === "credits") {
      if (!body.credits_package || !CREDIT_PACKAGES[body.credits_package]) {
        throw new Error("Invalid credits package");
      }
      const pkg = CREDIT_PACKAGES[body.credits_package];
      amount = pkg.price;
      creditsAmount = pkg.credits;
      description = `UltraMind - ${pkg.credits} Créditos WhatsApp`;
    } else {
      throw new Error("Invalid payment type");
    }

    // Create payment record in database
    const externalReference = `ultramind_${user.id}_${Date.now()}`;
    
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
        payment_method: body.payment_method,
        external_reference: externalReference,
        status: "pending",
      })
      .select()
      .single();

    if (insertError) {
      console.error("Error inserting payment:", insertError);
      throw new Error("Failed to create payment record");
    }

    // Build payer object
    const payer: { email: string; first_name?: string; identification?: { type: string; number: string } } = {
      email: body.payer_email || user.email || "cliente@ultramind.app",
    };
    
    if (body.payer_name) {
      payer.first_name = body.payer_name;
    }
    
    if (body.payer_cpf) {
      payer.identification = {
        type: "CPF",
        number: body.payer_cpf.replace(/\D/g, ""),
      };
    }

    // Create payment in Mercado Pago
    const mpPayment = await createMercadoPagoPayment(
      accessToken,
      amount,
      description,
      body.payment_method,
      externalReference,
      payer,
      body.card_token,
      body.installments
    );

    // Update payment record with Mercado Pago data
    const updateData: Record<string, unknown> = {
      external_id: mpPayment.id.toString(),
      status: mpPayment.status,
    };

    // Handle different payment methods
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

    // If payment is already approved (instant approval)
    if (mpPayment.status === "approved") {
      updateData.paid_at = new Date().toISOString();
    }

    const { error: updateError } = await supabaseAdmin
      .from("payments")
      .update(updateData)
      .eq("id", paymentRecord.id);

    if (updateError) {
      console.error("Error updating payment:", updateError);
    }

    // Process if already approved
    if (mpPayment.status === "approved") {
      await supabaseAdmin.rpc("process_approved_payment", { p_payment_id: paymentRecord.id });
    }

    // Prepare response
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
      { 
        status: 400, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );
  }
});
