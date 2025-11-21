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
  phone?: string;
  status: "pending" | "accepted" | "declined";
  // RSVP details (only if accepted)
  foodPreference?: "veg" | "non-veg" | "both";
  numberOfAttendees?: number;
  numberOfAdults?: number;
  numberOfKids?: number;
  kids?: Array<{ name: string; age: number }>;
  dietaryPreferences?: string;
  note?: string;
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
  useCustomImages?: boolean;
  customStyle?: "classic" | "elegant" | "kids" | "minimal";
  customImages?: string[]; // public URLs
}

function htmlEscape(input: string) {
  return input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

async function generateAIInviteText(event: EviteEvent): Promise<string> {
  const openaiApiKey = Deno.env.get("OPENAI_API_KEY");
  
  if (!openaiApiKey) {
    // Fallback to a nice default message if OpenAI is not configured
    return `We're thrilled to invite you to join us for ${event.title}! This will be a special celebration filled with joy, laughter, and wonderful memories. We can't wait to share this moment with you.`;
  }

  try {
    const prompt = `Create a warm, personalized invitation message for a party event. 
Event: ${event.title}
Host: ${event.hostName}
Date: ${event.date} at ${event.time}
Location: ${event.location}
Description: ${event.description || "A special celebration"}

Write a friendly, enthusiastic invitation message (2-3 sentences) that captures the excitement and makes the recipient feel special. Keep it warm and inviting.`;

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${openaiApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content: "You are a creative party invitation writer. Write warm, enthusiastic, and personalized invitation messages.",
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        max_tokens: 150,
        temperature: 0.8,
      }),
    });

    if (!response.ok) {
      console.warn("OpenAI API error, using fallback message");
      throw new Error("OpenAI API error");
    }

    const data = await response.json();
    const aiMessage = data.choices?.[0]?.message?.content?.trim();
    
    if (aiMessage) {
      return aiMessage;
    }
  } catch (error) {
    console.warn("Failed to generate AI invite text:", error);
  }

  // Fallback message
  return `We're thrilled to invite you to join us for ${event.title}! This will be a special celebration filled with joy, laughter, and wonderful memories. We can't wait to share this moment with you.`;
}

function buildEmailHtml(event: EviteEvent, inviteUrl: string, aiInviteText?: string) {
  const title = htmlEscape(event.title);
  const host = htmlEscape(event.hostName || "Your host");
  const date = htmlEscape(event.date);
  const time = htmlEscape(event.time);
  const location = htmlEscape(event.location);
  const description = htmlEscape(event.description || "");
  const inviteMessage = htmlEscape(aiInviteText || `We're thrilled to invite you to join us for ${event.title}! This will be a special celebration filled with joy, laughter, and wonderful memories.`);

  // Check if custom images are available
  const hasCustomImages = event.useCustomImages && event.customImages && event.customImages.length > 0;
  const customImages = event.customImages || [];
  const style = event.customStyle || "classic";
  
  console.log("[buildEmailHtml] Image check:", {
    useCustomImages: event.useCustomImages,
    customImagesLength: customImages.length,
    hasCustomImages,
    customImages: customImages,
    style,
  });

  // Style configurations
  const styleConfigs = {
    classic: {
      primaryColor: "#7c3aed",
      secondaryColor: "#a855f7",
      gradient: "linear-gradient(135deg, #7c3aed 0%, #a855f7 100%)",
      textColor: "#1f2937",
    },
    elegant: {
      primaryColor: "#e11d48",
      secondaryColor: "#f43f5e",
      gradient: "linear-gradient(135deg, #e11d48 0%, #f43f5e 100%)",
      textColor: "#1f2937",
    },
    kids: {
      primaryColor: "#f59e0b",
      secondaryColor: "#f97316",
      gradient: "linear-gradient(135deg, #f59e0b 0%, #f97316 100%)",
      textColor: "#1f2937",
    },
    minimal: {
      primaryColor: "#374151",
      secondaryColor: "#4b5563",
      gradient: "linear-gradient(135deg, #374151 0%, #4b5563 100%)",
      textColor: "#1f2937",
    },
  };

  const config = styleConfigs[style] || styleConfigs.classic;

  if (hasCustomImages) {
    // AI-generated invite with photos
    const mainImage = customImages[0];
    const additionalImages = customImages.slice(1, 3);

    return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="margin:0;padding:0;background-color:#f9fafb;font-family:Inter,system-ui,-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,Helvetica,Arial,sans-serif">
      <div style="max-width:640px;margin:0 auto;background-color:#ffffff">
        <!-- Hero Image Section -->
        <div style="position:relative;width:100%;height:300px;overflow:hidden;background:${config.gradient}">
          <img src="${mainImage}" alt="${title}" style="width:100%;height:100%;object-fit:cover;opacity:0.9" />
          <div style="position:absolute;top:0;left:0;right:0;bottom:0;background:linear-gradient(to bottom, rgba(0,0,0,0.3), rgba(0,0,0,0.6))"></div>
          <div style="position:absolute;bottom:0;left:0;right:0;padding:32px 24px;text-align:center">
            <h1 style="margin:0;font-size:36px;font-weight:bold;color:#ffffff;text-shadow:2px 2px 4px rgba(0,0,0,0.5);line-height:1.2">${title}</h1>
            <p style="margin:8px 0 0;font-size:18px;color:#ffffff;text-shadow:1px 1px 2px rgba(0,0,0,0.5)">Hosted by ${host}</p>
          </div>
        </div>

        <!-- Additional Images Gallery (if available) -->
        ${additionalImages.length > 0 ? `
        <div style="display:flex;gap:4px;padding:4px;background-color:#f3f4f6">
          ${additionalImages.map(img => `
            <div style="flex:1;height:120px;overflow:hidden;border-radius:8px">
              <img src="${img}" alt="Event photo" style="width:100%;height:100%;object-fit:cover" />
            </div>
          `).join('')}
        </div>
        ` : ''}

        <!-- Invite Content -->
        <div style="padding:32px 24px">
          <!-- AI-Generated Invite Message -->
          <div style="padding:24px;background:${config.gradient};border-radius:16px;margin-bottom:24px;text-align:center">
            <p style="margin:0;font-size:18px;line-height:1.6;color:#ffffff;font-weight:500">${inviteMessage}</p>
          </div>

          <!-- Event Details -->
          <div style="background-color:#f9fafb;border-radius:12px;padding:24px;margin-bottom:24px;border-left:4px solid ${config.primaryColor}">
            <div style="margin-bottom:16px">
              <div style="display:flex;align-items:center;margin-bottom:12px">
                <span style="font-size:20px;margin-right:12px">📅</span>
                <div>
                  <p style="margin:0;font-size:14px;color:#6b7280;text-transform:uppercase;letter-spacing:0.5px">Date & Time</p>
                  <p style="margin:4px 0 0;font-size:18px;font-weight:600;color:${config.textColor}">${date} at ${time}</p>
                </div>
              </div>
            </div>
            <div style="margin-bottom:16px">
              <div style="display:flex;align-items:center;margin-bottom:12px">
                <span style="font-size:20px;margin-right:12px">📍</span>
                <div>
                  <p style="margin:0;font-size:14px;color:#6b7280;text-transform:uppercase;letter-spacing:0.5px">Location</p>
                  <p style="margin:4px 0 0;font-size:18px;font-weight:600;color:${config.textColor}">${location}</p>
                </div>
              </div>
            </div>
            ${description ? `
            <div style="padding-top:16px;border-top:1px solid #e5e7eb">
              <p style="margin:0;font-size:16px;line-height:1.6;color:${config.textColor}">${description}</p>
            </div>
            ` : ''}
          </div>

          <!-- CTA Button -->
          <div style="text-align:center;margin-bottom:24px">
            <a href="${inviteUrl}" style="display:inline-block;background:${config.gradient};color:#ffffff;text-decoration:none;padding:16px 32px;border-radius:12px;font-size:18px;font-weight:600;box-shadow:0 4px 6px rgba(0,0,0,0.1);transition:transform 0.2s">View Invitation & RSVP</a>
          </div>

          <!-- Fallback Link -->
          <p style="margin:0;text-align:center;color:#6b7280;font-size:12px;line-height:1.6">
            If the button doesn't work, copy and paste this link into your browser:<br>
            <a href="${inviteUrl}" style="color:${config.primaryColor};word-break:break-all">${inviteUrl}</a>
          </p>
        </div>

        <!-- Footer -->
        <div style="padding:24px;text-align:center;background-color:#f9fafb;border-top:1px solid #e5e7eb">
          <p style="margin:0;font-size:14px;color:#6b7280">We hope to see you there! 🎉</p>
        </div>
      </div>
    </body>
    </html>`;
  }

  // Standard invite without custom images
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

async function sendSMS(to: string, message: string) {
  // Normalize phone number (remove spaces, ensure + prefix)
  const normalizedTo = to.replace(/\s+/g, "").replace(/^\+?/, "+");
  console.log(`[SMS] Sending SMS to: ${normalizedTo}`);

  // Try Twilio first (most common)
  const twilioAccountSid = Deno.env.get("TWILIO_ACCOUNT_SID");
  const twilioAuthToken = Deno.env.get("TWILIO_AUTH_TOKEN");
  const twilioFrom = Deno.env.get("TWILIO_PHONE_NUMBER");

  console.log(`[SMS] Twilio config check:`, {
    hasAccountSid: !!twilioAccountSid,
    hasAuthToken: !!twilioAuthToken,
    hasPhoneNumber: !!twilioFrom,
    phoneNumber: twilioFrom ? `${twilioFrom.substring(0, 4)}...` : "not set",
  });

  if (twilioAccountSid && twilioAuthToken && twilioFrom) {
    // Normalize from number too
    const normalizedFrom = twilioFrom.replace(/\s+/g, "").replace(/^\+?/, "+");
    const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${twilioAccountSid}/Messages.json`;
    const auth = btoa(`${twilioAccountSid}:${twilioAuthToken}`);

    console.log(`[SMS] Calling Twilio API:`, {
      from: normalizedFrom,
      to: normalizedTo,
      messageLength: message.length,
    });

    const response = await fetch(twilioUrl, {
      method: "POST",
      headers: {
        "Authorization": `Basic ${auth}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        From: normalizedFrom,
        To: normalizedTo,
        Body: message,
      }),
    });

    const responseText = await response.text();
    console.log(`[SMS] Twilio response status: ${response.status}`);
    console.log(`[SMS] Twilio response:`, responseText);

    if (!response.ok) {
      let errorDetails;
      try {
        errorDetails = JSON.parse(responseText);
      } catch {
        errorDetails = responseText;
      }
      console.error(`[SMS] Twilio error:`, errorDetails);
      throw new Error(`Twilio SMS error: ${response.status} - ${JSON.stringify(errorDetails)}`);
    }

    const data = JSON.parse(responseText);
    console.log(`[SMS] ✓ SMS sent via Twilio. SID: ${data.sid}, Status: ${data.status}`);
    return;
  }

  // Try Brevo SMS (if using Brevo)
  const brevoApiKey = Deno.env.get("BREVO_API_KEY");
  if (brevoApiKey) {
    const response = await fetch("https://api.brevo.com/v3/transactionalSMS/sms", {
      method: "POST",
      headers: {
        "Accept": "application/json",
        "Content-Type": "application/json",
        "api-key": brevoApiKey,
      },
      body: JSON.stringify({
        sender: Deno.env.get("SMS_SENDER_NAME") || "Party67",
        recipient: to,
        content: message,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Brevo SMS error: ${response.status} - ${error}`);
    }

    const data = await response.json();
    console.log(`SMS sent via Brevo. Message ID: ${data.messageId || "N/A"}`);
    return;
  }

  throw new Error("SMS not configured. Set TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE_NUMBER or BREVO_API_KEY");
}

function buildSMSMessage(event: EviteEvent, inviteUrl: string): string {
  return `You're invited to ${event.title}!\n\nDate: ${event.date}\nTime: ${event.time}\nLocation: ${event.location}\n\nRSVP: ${inviteUrl}\n\nHosted by ${event.hostName || "your host"}`;
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

    // Log event data for debugging
    console.log("[send-evites] Event data received:", {
      id: event.id,
      title: event.title,
      useCustomImages: event.useCustomImages,
      customImages: event.customImages,
      customImagesCount: event.customImages?.length || 0,
      customStyle: event.customStyle,
      guestsCount: event.guests.length,
    });

    // Generate AI invite text if custom images are available
    let aiInviteText: string | undefined;
    if (event.useCustomImages && event.customImages && event.customImages.length > 0) {
      try {
        console.log("[send-evites] Generating AI invite text for event with custom images...");
        console.log("[send-evites] Custom images URLs:", event.customImages);
        aiInviteText = await generateAIInviteText(event);
        console.log("[send-evites] ✓ AI invite text generated successfully");
      } catch (err) {
        console.warn("[send-evites] Failed to generate AI invite text, using fallback:", err);
      }
    } else {
      console.log("[send-evites] No custom images found. useCustomImages:", event.useCustomImages, "customImages:", event.customImages);
    }

    const results: { to: string; ok: boolean; error?: string; details?: string; type?: string }[] = [];
    for (const g of event.guests) {
      // Send email
      try {
        console.log(`Processing email for guest: ${g.name} (${g.email})`);
        const subject = `You're invited: ${event.title}`;
        const html = buildEmailHtml(event, inviteUrl, aiInviteText);
        await sendSmtpEmail(g.email, subject, html);
        console.log(`✓ Successfully sent email to ${g.email}`);
        results.push({ to: g.email, ok: true, details: "Email queued for delivery", type: "email" });
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : String(err);
        console.error(`✗ Failed sending email to ${g.email}:`, errorMsg);
        results.push({ to: g.email, ok: false, error: errorMsg, type: "email" });
      }

      // Send SMS if phone number is provided
      if (g.phone) {
        try {
          console.log(`[send-evites] Processing SMS for guest: ${g.name} (${g.phone})`);
          const smsMessage = buildSMSMessage(event, inviteUrl);
          console.log(`[send-evites] SMS message preview:`, smsMessage.substring(0, 100) + "...");
          await sendSMS(g.phone, smsMessage);
          console.log(`[send-evites] ✓ Successfully sent SMS to ${g.phone}`);
          results.push({ to: g.phone, ok: true, details: "SMS sent", type: "sms" });
        } catch (err) {
          const errorMsg = err instanceof Error ? err.message : String(err);
          console.error(`[send-evites] ✗ Failed sending SMS to ${g.phone}:`, errorMsg);
          console.error(`[send-evites] Error details:`, err);
          results.push({ to: g.phone, ok: false, error: errorMsg, type: "sms" });
        }
      } else {
        console.log(`[send-evites] Guest ${g.name} has no phone number, skipping SMS`);
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
        results, // Include all results (email + SMS) for detailed tracking
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
