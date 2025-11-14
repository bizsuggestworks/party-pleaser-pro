// Setup type definitions for built-in Supabase Runtime APIs
import "jsr:@supabase/functions-js/edge-runtime.d.ts";

// Declare Deno for TypeScript
declare const Deno: any;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface Guest {
  id: string;
  name: string;
  email: string;
  status: "pending" | "accepted" | "declined";
}

interface EviteEvent {
  id: string;
  title: string;
  hostName: string;
  date: string;
  time: string;
  location: string;
  description: string;
  template: string;
  guests: Guest[];
  createdAt: number;
}

function htmlEscape(input: string) {
  return input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function buildEmailHtml(event: EviteEvent, inviteUrl: string) {
  const title = htmlEscape(event.title);
  const host = htmlEscape(event.hostName || "Your host");
  const date = htmlEscape(event.date);
  const time = htmlEscape(event.time);
  const location = htmlEscape(event.location);
  const description = htmlEscape(event.description || "");

  return `
  <div style="font-family:Inter,system-ui,-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,Helvetica,Arial,sans-serif;line-height:1.5;color:#111827">
    <div style="max-width:640px;margin:0 auto;padding:24px">
      <h1 style="font-size:24px;margin:0 0 8px">You're invited: ${title}</h1>
      <p style="margin:0 0 16px;color:#6b7280">Hosted by ${host}</p>
      <div style="padding:16px;border:1px solid #e5e7eb;border-radius:12px;margin-bottom:16px">
        <p style="margin:0 0 8px"><strong>Date:</strong> ${date}</p>
        <p style="margin:0 0 8px"><strong>Time:</strong> ${time}</p>
        <p style="margin:0 0 8px"><strong>Location:</strong> ${location}</p>
        ${description ? `<p style="margin:8px 0 0">${description}</p>` : ""}
      </div>
      <p style="margin:0 0 16px">Please RSVP using the link below:</p>
      <p>
        <a href="${inviteUrl}" style="display:inline-block;background:#7c3aed;color:white;text-decoration:none;padding:12px 18px;border-radius:10px">View invitation & RSVP</a>
      </p>
      <p style="margin:16px 0 0;color:#6b7280;font-size:12px">If the button doesn't work, paste this link in your browser:<br>${inviteUrl}</p>
    </div>
  </div>`;
}

async function sendSmtpEmail(to: string, subject: string, html: string) {
  const host = Deno.env.get("SMTP_HOST");
  const port = parseInt(Deno.env.get("SMTP_PORT") || "465", 10);
  const user = Deno.env.get("SMTP_USER");
  const pass = Deno.env.get("SMTP_PASS");
  const from = Deno.env.get("SMTP_FROM") || Deno.env.get("SMTP_USER") || "";

  if (!host || !user || !pass || !from) {
    throw new Error("SMTP not configured. Set SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM");
  }

  // Check if using Brevo - if so, prefer HTTP API (more reliable)
  const useBrevoApi = host.includes("brevo") && Deno.env.get("BREVO_API_KEY");
  
  if (useBrevoApi) {
    // Use Brevo HTTP API (more reliable than SMTP)
    const apiKey = Deno.env.get("BREVO_API_KEY");
    
    // Parse sender format: "Name<email>" or "Name <email>" or just "email"
    let senderEmail: string;
    let senderName: string;
    
    if (from.includes("<") && from.includes(">")) {
      // Extract email from <email> format
      senderEmail = from.match(/<([^>]+)>/)?.[1] || from;
      // Extract name (everything before <, with or without space)
      const nameMatch = from.match(/^(.+?)\s*</);
      senderName = nameMatch ? nameMatch[1].trim() : "Party67";
    } else {
      // Just email address, no name
      senderEmail = from.trim();
      senderName = "Party67";
    }
    
    console.log(`Sending email via Brevo API to: ${to}, from: ${senderName} <${senderEmail}>`);
    
    const requestBody = {
      sender: { email: senderEmail, name: senderName },
      to: [{ email: to }],
      subject: subject,
      htmlContent: html,
    };
    
    const response = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: {
        "Accept": "application/json",
        "Content-Type": "application/json",
        "api-key": apiKey!,
      },
      body: JSON.stringify(requestBody),
    });

    const responseText = await response.text();
    
    if (!response.ok) {
      console.error(`Brevo API error: ${response.status}`, responseText);
      throw new Error(`Brevo API error: ${response.status} - ${responseText}`);
    }
    
    // Log successful response
    let responseData;
    try {
      responseData = JSON.parse(responseText);
      console.log(`Email sent successfully via Brevo. Message ID: ${responseData.messageId || 'N/A'}`);
    } catch {
      console.log(`Email sent successfully via Brevo. Response: ${responseText}`);
    }
    
    return;
  }

  // Fallback to SMTP using a working library
  // Use a version that's compatible with current Deno (avoids Deno.writeAll issue)
  console.log(`Using SMTP to send email to: ${to}, via ${host}:${port}`);
  const { SmtpClient } = await import("https://deno.land/x/smtp@v0.9.0/mod.ts");
  const client = new SmtpClient();

  try {
    // Port 465 uses TLS/SSL directly, port 587 uses STARTTLS
    if (port === 465) {
      console.log(`Connecting via TLS to ${host}:${port}`);
      await client.connectTLS({ hostname: host, port, username: user, password: pass });
    } else {
      console.log(`Connecting via STARTTLS to ${host}:${port}`);
      await client.connect({ hostname: host, port, username: user, password: pass });
    }

    console.log(`Sending email via SMTP...`);
    await client.send({
      from,
      to,
      subject,
      content: html,
    });
    
    console.log(`✓ Email sent successfully via SMTP`);
    await client.close();
  } catch (error) {
    await client.close().catch(() => {}); // Ensure connection is closed
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error(`✗ SMTP send failed:`, errorMsg);
    throw new Error(`SMTP send failed: ${errorMsg}`);
  }
}

console.info("send-evites function ready");

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const event: EviteEvent = body.event;
    const origin: string = body.origin || Deno.env.get("SITE_URL") || "";

    if (!event || !event.id) {
      return new Response(JSON.stringify({ error: "Missing event payload" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!origin) {
      return new Response(JSON.stringify({ error: "Missing origin/SITE_URL" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const inviteUrl = `${origin.replace(/\/$/, "")}/evite/${event.id}`;

    const results: { to: string; ok: boolean; error?: string; details?: string }[] = [];
    for (const g of event.guests) {
      try {
        console.log(`Processing email for guest: ${g.name} (${g.email})`);
        const subject = `You're invited: ${event.title}`;
        const html = buildEmailHtml(event, inviteUrl);
        await sendSmtpEmail(g.email, subject, html);
        console.log(`✓ Successfully sent email to ${g.email}`);
        results.push({ to: g.email, ok: true, details: "Email queued for delivery" });
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : String(err);
        console.error(`✗ Failed sending to ${g.email}:`, errorMsg);
        results.push({ to: g.email, ok: false, error: errorMsg });
      }
    }

    const sent = results.filter((r) => r.ok).length;
    const failed = results.filter((r) => !r.ok);

    // Log detailed failure information
    if (failed.length > 0) {
      console.error("Email sending failures:", JSON.stringify(failed, null, 2));
    }

    return new Response(
      JSON.stringify({
        sent,
        failed,
        inviteUrl,
        total: results.length,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (error) {
    console.error("send-evites error:", error);
    const msg = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});


