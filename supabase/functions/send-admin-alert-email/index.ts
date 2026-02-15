import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const ADMIN_EMAIL = "james.jhey025@gmail.com";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { alert_type, severity, title, description, metadata } = await req.json();

    // Use Supabase's built-in email via the Auth admin API (SMTP)
    // Since we don't have a dedicated email service, we'll use the Resend-compatible approach
    // For now, log the alert and attempt to send via Supabase's inbuilt SMTP
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // Format the email body
    const severityEmoji = severity === "critical" ? "🔴" : severity === "error" ? "🟠" : "🟡";
    const timestamp = new Date().toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" });

    const htmlBody = `
      <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #1a1a2e; color: #e0e0e0; border-radius: 12px; overflow: hidden;">
        <div style="background: ${severity === 'critical' ? '#dc2626' : severity === 'error' ? '#ea580c' : '#d97706'}; padding: 20px 24px;">
          <h1 style="margin: 0; font-size: 20px; color: white;">
            ${severityEmoji} Alerta UltraMind: ${title}
          </h1>
        </div>
        <div style="padding: 24px;">
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 8px 0; color: #9ca3af; width: 120px;">Severidade</td>
              <td style="padding: 8px 0; font-weight: bold; color: ${severity === 'critical' ? '#ef4444' : severity === 'error' ? '#f97316' : '#eab308'};">
                ${severity.toUpperCase()}
              </td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #9ca3af;">Tipo</td>
              <td style="padding: 8px 0;">${alert_type}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #9ca3af;">Data/Hora</td>
              <td style="padding: 8px 0;">${timestamp}</td>
            </tr>
          </table>
          
          ${description ? `
          <div style="margin-top: 16px; padding: 16px; background: #16213e; border-radius: 8px; border-left: 4px solid ${severity === 'critical' ? '#dc2626' : '#ea580c'};">
            <p style="margin: 0; font-size: 14px;">${description}</p>
          </div>` : ''}
          
          ${metadata ? `
          <details style="margin-top: 16px;">
            <summary style="cursor: pointer; color: #9ca3af; font-size: 13px;">Detalhes técnicos</summary>
            <pre style="margin-top: 8px; padding: 12px; background: #0f0f23; border-radius: 6px; font-size: 12px; overflow-x: auto; color: #a0a0a0;">${JSON.stringify(metadata, null, 2)}</pre>
          </details>` : ''}
          
          <div style="margin-top: 24px; padding-top: 16px; border-top: 1px solid #2a2a4a; text-align: center;">
            <a href="https://ultramind.lovable.app/dashboard/admin" 
               style="display: inline-block; padding: 10px 24px; background: #6366f1; color: white; text-decoration: none; border-radius: 8px; font-weight: 600;">
              Abrir Painel Admin
            </a>
          </div>
          
          <p style="margin-top: 16px; font-size: 11px; color: #6b7280; text-align: center;">
            UltraMind — Sistema de Monitoramento Automático
          </p>
        </div>
      </div>
    `;

    // Send email using Supabase Auth Admin API (inviteUserByEmail workaround won't work)
    // Use the built-in Supabase edge function to send email via the REST API
    // We'll use a direct SMTP approach via Deno
    
    // Alternative: Use Supabase's internal email hook
    // For production, the best approach is to use the admin_alerts table + realtime
    // and log the email attempt for audit

    console.log(`[ALERT EMAIL] Sending to ${ADMIN_EMAIL}`);
    console.log(`[ALERT EMAIL] Subject: ${severityEmoji} ${title}`);
    console.log(`[ALERT EMAIL] Severity: ${severity}`);
    console.log(`[ALERT EMAIL] Description: ${description}`);

    // Check if RESEND_API_KEY is available for actual email sending
    const resendKey = Deno.env.get("RESEND_API_KEY");
    
    if (resendKey) {
      const emailResponse = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${resendKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: "UltraMind Alerts <alerts@ultramind.lovable.app>",
          to: [ADMIN_EMAIL],
          subject: `${severityEmoji} Alerta ${severity.toUpperCase()}: ${title}`,
          html: htmlBody,
        }),
      });

      if (!emailResponse.ok) {
        const errText = await emailResponse.text();
        console.error(`[ALERT EMAIL] Resend failed: ${errText}`);
        return new Response(JSON.stringify({ 
          sent: false, 
          logged: true, 
          method: "resend_failed",
          error: errText 
        }), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      console.log("[ALERT EMAIL] Sent via Resend successfully");
      return new Response(JSON.stringify({ sent: true, method: "resend" }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fallback: Log the alert (email will be sent when Resend is configured)
    console.log("[ALERT EMAIL] No email service configured. Alert logged for admin panel.");
    
    return new Response(JSON.stringify({ 
      sent: false, 
      logged: true, 
      method: "console_log",
      message: "Alert logged. Configure RESEND_API_KEY for email delivery." 
    }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    console.error("[ALERT EMAIL] Error:", msg);
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
