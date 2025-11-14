## Party67 E‑Vite SMTP Setup

To send real emails from the E‑Vite builder, configure SMTP as Supabase Function secrets for `send-evites`.

1) Choose a provider and collect SMTP credentials
- **Brevo (formerly Sendinblue) - RECOMMENDED**
  - SMTP_HOST: smtp-relay.brevo.com
  - SMTP_PORT: 587 (STARTTLS) or 465 (SSL/TLS)
  - SMTP_USER: Your Brevo SMTP login (usually your email address)
  - SMTP_PASS: Your Brevo SMTP key (get from: Settings → SMTP & API → SMTP)
  - SMTP_FROM: Your verified sender email (e.g., noreply@yourdomain.com)
  - Note: Brevo requires sender email to be verified in your account
- Gmail/Google Workspace (use an App Password)
  - SMTP_HOST: smtp.gmail.com
  - SMTP_PORT: 465
  - SMTP_USER: your full email (e.g., noreply@party67.com)
  - SMTP_PASS: app password (not your normal password)
  - SMTP_FROM: Party67 <noreply@party67.com>
- Mailgun/SendGrid/Postmark/AWS SES: use the SMTP host, port, username, password they provide; verify your sending domain and set a suitable FROM.
- Mailtrap (dev only): use sandbox creds to test without delivering to real inboxes.

2) Set Supabase Function secrets (Dashboard)
- Go to Supabase → Project Settings → Functions → Secrets → Add:
  - SMTP_HOST
  - SMTP_PORT (e.g., 465)
  - SMTP_USER
  - SMTP_PASS
  - SMTP_FROM (e.g., "Party67 <noreply@party67.com>")
  - SITE_URL (e.g., https://party67.com or http://localhost:8080)
- Deploy/restart the `send-evites` function.

2b) Or via Supabase CLI
```bash
supabase functions secrets set \
  SMTP_HOST=smtp.yourprovider.com \
  SMTP_PORT=465 \
  SMTP_USER=noreply@party67.com \
  SMTP_PASS=your_smtp_or_app_password \
  SMTP_FROM="Party67 <noreply@party67.com>" \
  SITE_URL=https://party67.com \
  --project-ref <your-project-ref>
```

3) Frontend environment (Vite)
- Create `.env.local` in the project root and set:
```
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_PUBLISHABLE_KEY=your_supabase_anon_key
```
- Restart `npm run dev`.

4) Send invites
- Visit `/evite`, create an event, add guests, click “Submit & Send E‑Vite”.
- The app calls the Supabase Function `send-evites`, which sends SMTP emails and returns the result.

Troubleshooting
- If you see auth errors, verify SMTP_USER/SMTP_PASS.
- If emails are blocked, verify your domain/sender with the provider.
- Ensure `SITE_URL` points to your live or local origin (used in the invite link).


