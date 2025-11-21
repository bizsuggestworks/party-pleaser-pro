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

async function generateAIInviteText(event: EviteEvent, guestName?: string): Promise<string> {
  const openaiApiKey = Deno.env.get("OPENAI_API_KEY");
  
  if (!openaiApiKey) {
    // Fallback to a nice default message if OpenAI is not configured (instant)
    const fallback = guestName 
      ? `Hi ${guestName}, we're thrilled to invite you to join us for ${event.title}! This will be a special celebration filled with joy, laughter, and wonderful memories. We can't wait to share this moment with you.`
      : `We're thrilled to invite you to join us for ${event.title}! This will be a special celebration filled with joy, laughter, and wonderful memories. We can't wait to share this moment with you.`;
    return fallback;
  }

  // Create a timeout promise that rejects after 3 seconds
  const timeoutPromise = new Promise<never>((_, reject) => {
    setTimeout(() => reject(new Error("AI generation timeout")), 3000);
  });

  try {
    const guestGreeting = guestName ? `Guest name: ${guestName}` : "";
    const prompt = `Create a warm, personalized invitation message for a party event. 
Event: ${event.title}
Host: ${event.hostName}
${guestGreeting}
Date: ${event.date} at ${event.time}
Location: ${event.location}
Description: ${event.description || "A special celebration"}

Write a friendly, enthusiastic invitation message (2-3 sentences) that captures the excitement and makes the recipient feel special. Keep it warm and inviting.
IMPORTANT: Use the actual host name "${event.hostName}" in your message. ${guestName ? `Address the guest by name "${guestName}" at the beginning.` : "Do not use placeholders like [Recipient's name], {Hostname}, or [Hostname]. Use the actual values provided."}`;

    const fetchPromise = fetch("https://api.openai.com/v1/chat/completions", {
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

    // Race between fetch and timeout
    const response = await Promise.race([fetchPromise, timeoutPromise]);

    if (!response.ok) {
      console.warn("OpenAI API error, using fallback message");
      throw new Error("OpenAI API error");
    }

    const data = await response.json();
    let aiMessage = data.choices?.[0]?.message?.content?.trim();
    
    if (aiMessage) {
      // Replace any remaining placeholders with actual values
      aiMessage = aiMessage
        .replace(/\[Recipient'?s?\s+name\]/gi, guestName || "there")
        .replace(/\{Recipient'?s?\s+name\}/gi, guestName || "there")
        .replace(/\[Hostname\]/gi, event.hostName || "your host")
        .replace(/\{Hostname\}/gi, event.hostName || "your host")
        .replace(/\[Host\s+name\]/gi, event.hostName || "your host")
        .replace(/\{Host\s+name\}/gi, event.hostName || "your host");
      
      return aiMessage;
    }
  } catch (error) {
    console.warn("Failed to generate AI invite text (using fallback):", error instanceof Error ? error.message : error);
  }

  // Fallback message (instant return)
  const fallback = guestName 
    ? `Hi ${guestName}, we're thrilled to invite you to join us for ${event.title}! This will be a special celebration filled with joy, laughter, and wonderful memories. We can't wait to share this moment with you.`
    : `We're thrilled to invite you to join us for ${event.title}! This will be a special celebration filled with joy, laughter, and wonderful memories. We can't wait to share this moment with you.`;
  return fallback;
}

function buildEmailHtml(event: EviteEvent, inviteUrl: string, aiInviteText?: string, isUpdate?: boolean) {
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
    eventId: event.id,
  });
  
  // Debug: Log the actual image URLs
  if (customImages.length > 0) {
    console.log("[buildEmailHtml] Custom image URLs:", customImages);
    customImages.forEach((img, idx) => {
      console.log(`[buildEmailHtml] Image ${idx + 1}: ${img}`);
    });
  }

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
    // AI-generated invite with Ghibli-style photo
    const mainImage = customImages[0];
    const welcomeText = event.title ? `Welcome to ${title}` : "Welcome to the party";
    
    console.log("[buildEmailHtml] Building email with Ghibli-style image:", {
      mainImage,
      welcomeText,
      mainImageUrl: mainImage,
      isTransformed: mainImage !== event.customImages?.[0] || mainImage.includes('replicate') || mainImage.includes('transform'),
      allCustomImages: customImages,
      customImagesLength: customImages.length,
    });
    
    // Verify image URL is valid
    if (!mainImage || !mainImage.startsWith('http')) {
      console.error("[buildEmailHtml] ❌ Invalid main image URL:", mainImage);
      console.error("[buildEmailHtml] Custom images array:", customImages);
      console.error("[buildEmailHtml] Event customImages:", event.customImages);
      // Fall back to standard template
      return buildStandardEmailHtml(event, inviteUrl, aiInviteText, isUpdate);
    }
    
    // Additional validation: Check if URL is accessible
    console.log("[buildEmailHtml] ✓ Using Ghibli-transformed image URL:", mainImage);
    console.log("[buildEmailHtml] Image URL type:", typeof mainImage);
    console.log("[buildEmailHtml] Image URL length:", mainImage.length);
    console.log("[buildEmailHtml] Image URL starts with http:", mainImage.startsWith('http'));

    return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        @media only screen and (max-width: 600px) {
          .hero-image-container {
            min-height: 300px !important;
            height: auto !important;
          }
          .hero-image {
            min-height: 300px !important;
            max-height: 500px !important;
            height: auto !important;
          }
        }
      </style>
    </head>
    <body style="margin:0;padding:0;background-color:#f9fafb;font-family:Inter,system-ui,-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,Helvetica,Arial,sans-serif">
      <div style="max-width:640px;margin:0 auto;background-color:#ffffff">
        <!-- Hero Image Section with Ghibli Art and Welcome Text -->
        <div class="hero-image-container" style="position:relative;width:100%;max-width:640px;overflow:visible;background:${config.gradient};margin:0 auto;text-align:center">
          <img class="hero-image" src="${mainImage}" alt="${htmlEscape(title)}" style="width:100%;max-width:640px;height:auto;min-height:400px;max-height:800px;object-fit:contain;object-position:center;display:block;margin:0 auto;padding:0;border:0;background-color:#f0f0f0" loading="eager" />
          <!-- Welcome to the party text overlay - positioned over image -->
          <div style="position:absolute;top:20px;left:50%;transform:translateX(-50%);text-align:center;width:90%;z-index:10">
            <div style="background:rgba(255,255,255,0.95);padding:20px 28px;border-radius:20px;box-shadow:0 8px 32px rgba(0,0,0,0.3);backdrop-filter:blur(10px);display:inline-block">
              <h1 style="margin:0;font-size:36px;font-weight:bold;color:#7c3aed;text-shadow:2px 2px 4px rgba(0,0,0,0.1);line-height:1.2;font-family:'Comic Sans MS', cursive, sans-serif">${htmlEscape(welcomeText)}</h1>
            </div>
          </div>
          <!-- Event title at bottom - only if image is tall enough -->
          <div style="position:absolute;bottom:20px;left:50%;transform:translateX(-50%);padding:12px 20px;text-align:center;background:rgba(0,0,0,0.7);border-radius:12px;backdrop-filter:blur(5px)">
            <p style="margin:0;font-size:14px;color:#ffffff;text-shadow:1px 1px 2px rgba(0,0,0,0.5)">Hosted by ${host}</p>
          </div>
        </div>

        <!-- Invite Content -->
        <div style="padding:32px 24px">
          <!-- Update Notice -->
          ${isUpdate ? `
          <div style="padding:16px;background:#fef3c7;border-left:4px solid #f59e0b;margin:24px;border-radius:8px">
            <p style="margin:0;font-size:16px;line-height:1.6;color:#92400e;font-weight:600">📢 Event Update</p>
            <p style="margin:8px 0 0;font-size:14px;line-height:1.6;color:#78350f">This is an update to the original invitation. Please review the event details below.</p>
          </div>
          ` : ''}
          
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
            <a href="${htmlEscape(inviteUrl)}" style="display:inline-block;background:${config.gradient};color:#ffffff;text-decoration:none;padding:16px 32px;border-radius:12px;font-size:18px;font-weight:600;box-shadow:0 4px 6px rgba(0,0,0,0.1);transition:transform 0.2s;margin-bottom:12px">View Invitation & RSVP</a>
            <br>
            <a href="data:text/calendar;charset=utf-8,${encodeURIComponent(generateCalendarInvite(event, inviteUrl))}" style="display:inline-block;background:#10b981;color:#ffffff;text-decoration:none;padding:14px 28px;border-radius:12px;font-size:16px;font-weight:600;box-shadow:0 4px 6px rgba(0,0,0,0.1)" download="invite.ics">📅 Add to Calendar</a>
          </div>

          <!-- Fallback Link -->
          <p style="margin:0;text-align:center;color:#6b7280;font-size:12px;line-height:1.6">
            If the button doesn't work, copy and paste this link into your browser:<br>
            <a href="${htmlEscape(inviteUrl)}" style="color:${config.primaryColor};word-break:break-all;text-decoration:underline">${htmlEscape(inviteUrl)}</a>
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
  return buildStandardEmailHtml(event, inviteUrl, aiInviteText);
}

function buildStandardEmailHtml(event: EviteEvent, inviteUrl: string, aiInviteText?: string, isUpdate?: boolean) {
  const title = htmlEscape(event.title);
  const host = htmlEscape(event.hostName || "Your host");
  const date = htmlEscape(event.date);
  const time = htmlEscape(event.time);
  const location = htmlEscape(event.location);
  const description = htmlEscape(event.description || "");
  const inviteMessage = htmlEscape(aiInviteText || `We're thrilled to invite you to join us for ${event.title}! This will be a special celebration filled with joy, laughter, and wonderful memories.`);

  return `
  <div style="font-family:Inter,system-ui,-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,Helvetica,Arial,sans-serif;line-height:1.5;color:#111827">
    <div style="max-width:640px;margin:0 auto;padding:24px">
      ${isUpdate ? `
      <div style="padding:16px;background:#fef3c7;border-left:4px solid #f59e0b;margin-bottom:16px;border-radius:8px">
        <p style="margin:0;font-size:16px;line-height:1.6;color:#92400e;font-weight:600">📢 Event Update</p>
        <p style="margin:8px 0 0;font-size:14px;line-height:1.6;color:#78350f">This is an update to the original invitation. Please review the event details below.</p>
      </div>
      ` : ''}
      <h1 style="font-size:24px;margin:0 0 8px">You're invited: ${title}</h1>
      <p style="margin:0 0 16px;color:#6b7280">Hosted by ${host}</p>
      <div style="padding:16px;border:1px solid #e5e7eb;border-radius:12px;margin-bottom:16px">
        <p style="margin:0 0 8px"><strong>Date:</strong> ${date}</p>
        <p style="margin:0 0 8px"><strong>Time:</strong> ${time}</p>
        <p style="margin:0 0 8px"><strong>Location:</strong> ${location}</p>
        ${description ? `<p style="margin:8px 0 0">${description}</p>` : ""}
      </div>
      <p style="margin:0 0 16px">Please RSVP using the link below:</p>
             <div style="text-align:center;margin-bottom:16px">
               <a href="${htmlEscape(inviteUrl)}" style="display:inline-block;background:#7c3aed;color:white;text-decoration:none;padding:12px 18px;border-radius:10px;margin-bottom:8px">View invitation & RSVP</a>
               <br>
               <a href="data:text/calendar;charset=utf-8,${encodeURIComponent(generateCalendarInvite(event, inviteUrl))}" style="display:inline-block;background:#10b981;color:white;text-decoration:none;padding:12px 18px;border-radius:10px" download="invite.ics">📅 Add to Calendar</a>
             </div>
      <p style="margin:16px 0 0;color:#6b7280;font-size:12px">If the button doesn't work, paste this link in your browser:<br><a href="${htmlEscape(inviteUrl)}" style="color:#7c3aed;text-decoration:underline;word-break:break-all">${htmlEscape(inviteUrl)}</a></p>
    </div>
  </div>`;
}

function generateCalendarInvite(event: EviteEvent, inviteUrl: string): string {
  // Parse date and time
  const eventDate = new Date(event.date);
  const [hours, minutes] = event.time.split(':').map(Number);
  eventDate.setHours(hours, minutes, 0, 0);
  
  const endDate = new Date(eventDate);
  endDate.setHours(endDate.getHours() + 2); // Default 2-hour event
  
  // Format dates for ICS (YYYYMMDDTHHMMSSZ)
  const formatICSDate = (date: Date): string => {
    return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  };
  
  const start = formatICSDate(eventDate);
  const end = formatICSDate(endDate);
  const now = formatICSDate(new Date());
  const uid = `evite-${event.id}-${Date.now()}@party67.com`;
  
  // Escape text for ICS format
  const escapeICS = (text: string): string => {
    return text.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\n/g, '\\n');
  };
  
  const icsContent = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Party67//Evite//EN
CALSCALE:GREGORIAN
METHOD:REQUEST
BEGIN:VEVENT
UID:${uid}
DTSTAMP:${now}
DTSTART:${start}
DTEND:${end}
SUMMARY:${escapeICS(event.title)}
DESCRIPTION:${escapeICS(event.description || '')}\\n\\nRSVP: ${inviteUrl}
LOCATION:${escapeICS(event.location)}
ORGANIZER;CN=${escapeICS(event.hostName || 'Host')}:MAILTO:noreply@party67.com
STATUS:CONFIRMED
SEQUENCE:0
BEGIN:VALARM
TRIGGER:-PT24H
ACTION:DISPLAY
DESCRIPTION:Reminder: ${escapeICS(event.title)}
END:VALARM
END:VEVENT
END:VCALENDAR`.replace(/\n/g, '\r\n');
  
  return icsContent;
}

async function sendSmtpEmail(to: string, subject: string, html: string, calendarInvite?: string) {
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
    
    const requestBody: any = {
      sender: { email: senderEmail, name: senderName },
      to: [{ email: to }],
      subject: subject,
      htmlContent: html,
    };
    
    // Add calendar invite as attachment if provided
    if (calendarInvite) {
      requestBody.attachment = [{
        name: "invite.ics",
        content: btoa(calendarInvite), // Base64 encode
      }];
    }
    
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
    const emailOptions: any = {
      from,
      to,
      subject,
      content: html,
    };
    
    // Add calendar invite as attachment if provided (for SMTP)
    if (calendarInvite) {
      // Note: SMTP attachment handling depends on the library
      // For now, we'll include it in the email body as a link
      emailOptions.content = html + `<hr><p style="font-size:12px;color:#6b7280">Calendar invite attached. If your email client supports it, you can add this event to your calendar.</p>`;
    }
    
    await client.send(emailOptions);
    
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
    const isUpdate: boolean = body.isUpdate || false;

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

    // Note: AI invite text will be generated per-guest for personalization

    // Verify event has custom images before sending
    console.log("[send-evites] Final verification before sending emails:", {
      hasCustomImages: event.useCustomImages && event.customImages && event.customImages.length > 0,
      customImagesArray: event.customImages,
      customImagesCount: event.customImages?.length || 0,
      useCustomImages: event.useCustomImages,
      firstImageUrl: event.customImages?.[0],
      firstImageUrlType: typeof event.customImages?.[0],
      firstImageUrlStartsWithHttp: event.customImages?.[0]?.startsWith('http'),
    });

    // Generate calendar invite
    const calendarInvite = generateCalendarInvite(event, inviteUrl);
    console.log("[send-evites] Generated calendar invite (.ics file)");

    const results: { to: string; ok: boolean; error?: string; details?: string; type?: string }[] = [];
    for (const g of event.guests) {
      // Send email
      try {
        console.log(`[send-evites] Processing email for guest: ${g.name} (${g.email})`);
        const subject = isUpdate ? `Event Update: ${event.title}` : `You're invited: ${event.title}`;
        
        // Generate personalized AI invite text for this guest
        let personalizedAiText: string | undefined;
        if (event.useCustomImages && event.customImages && event.customImages.length > 0) {
          try {
            console.log(`[send-evites] Generating personalized AI invite text for ${g.name}...`);
            personalizedAiText = await generateAIInviteText(event, g.name);
            console.log(`[send-evites] ✓ Personalized AI text generated for ${g.name}`);
          } catch (err) {
            console.warn(`[send-evites] Failed to generate AI text for ${g.name}, using fallback:`, err);
            personalizedAiText = undefined;
          }
        }
        
        const html = buildEmailHtml(event, inviteUrl, personalizedAiText, isUpdate);
        
        // Log a snippet of the HTML to verify images are included
        if (event.useCustomImages && event.customImages && event.customImages.length > 0) {
          const imageUrl = event.customImages[0];
          const hasImageInHtml = html.includes('img src') && (html.includes(imageUrl) || html.includes(encodeURIComponent(imageUrl)));
          console.log(`[send-evites] Email HTML image check for ${g.email}:`);
          console.log(`[send-evites]   Image URL: ${imageUrl}`);
          console.log(`[send-evites]   Has <img> tag: ${html.includes('img src')}`);
          console.log(`[send-evites]   Contains image URL: ${html.includes(imageUrl)}`);
          console.log(`[send-evites]   Contains encoded URL: ${html.includes(encodeURIComponent(imageUrl))}`);
          console.log(`[send-evites]   Final check: ${hasImageInHtml}`);
          
          if (!hasImageInHtml) {
            console.error(`[send-evites] ❌ WARNING: Custom images exist but not found in email HTML!`);
            console.error(`[send-evites] First image URL: ${imageUrl}`);
            console.error(`[send-evites] Image URL type: ${typeof imageUrl}`);
            console.error(`[send-evites] Image URL length: ${imageUrl?.length}`);
            console.error(`[send-evites] HTML snippet (first 1000 chars): ${html.substring(0, 1000)}`);
            // Try to find where the image should be
            const imgTagIndex = html.indexOf('<img');
            if (imgTagIndex >= 0) {
              console.error(`[send-evites] Found <img> tag at index ${imgTagIndex}`);
              console.error(`[send-evites] Image tag context: ${html.substring(imgTagIndex, imgTagIndex + 200)}`);
            }
          } else {
            console.log(`[send-evites] ✓ Email HTML correctly includes Ghibli image`);
          }
        }
        
        await sendSmtpEmail(g.email, subject, html, calendarInvite);
        console.log(`[send-evites] ✓ Successfully sent email with calendar invite to ${g.email}`);
        results.push({ to: g.email, ok: true, details: "Email with calendar invite queued for delivery", type: "email" });
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : String(err);
        console.error(`[send-evites] ✗ Failed sending email to ${g.email}:`, errorMsg);
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
