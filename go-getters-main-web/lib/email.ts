import nodemailer from "nodemailer";

const smtpUser = process.env.SMTP_USER || "akintayojoseph64@gmail.com";
const smtpPass = process.env.SMTP_PASS || "rzyalejjvxupxczx";
const resendApiKey = process.env.RESEND_API_KEY;
const fromEmail = process.env.FROM_EMAIL || "Go-Getters <onboarding@resend.dev>";

export async function sendEmail({
  to,
  subject,
  html,
}: {
  to: string;
  subject: string;
  html: string;
}) {
  // Determine if we can use Resend.
  // We use Resend if RESEND_API_KEY is configured AND either:
  // - FROM_EMAIL is not the default onboarding@resend.dev sandbox address (implying a custom domain).
  // - The recipient is the sandbox owner (akintayojoseph64@gmail.com).
  const canUseResend =
    !!resendApiKey &&
    (fromEmail !== "Go-Getters <onboarding@resend.dev>" &&
     fromEmail !== "onboarding@resend.dev" ||
     to === "akintayojoseph64@gmail.com");

  if (canUseResend) {
    console.log(`[Email System] Routing email to ${to} via Resend API`);
    try {
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${resendApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: fromEmail,
          to,
          subject,
          html,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.message || `Resend API returned status ${res.status}`);
      }

      const data = await res.json();
      return data;
    } catch (error) {
      console.error("[Email System] Failed to send email via Resend:", error);
      console.log("[Email System] Falling back to SMTP...");
    }
  }

  // Fallback / Default Mode: Gmail SMTP via nodemailer
  console.log(`[Email System] Routing email to ${to} via Gmail SMTP`);
  if (!smtpUser || !smtpPass) {
    console.warn("[Email System] SMTP_USER or SMTP_PASS is not configured. Email skipped:", { to, subject });
    return null;
  }

  // Create transporter on-demand to guarantee no leaked sockets in serverless environments
  const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 465,
    secure: true,
    pool: false, // Disable pooling to prevent sockets keeping the serverless event loop active
    connectionTimeout: 10000, // 10 seconds connection timeout
    greetingTimeout: 10000,   // 10 seconds greeting timeout
    socketTimeout: 15000,     // 15 seconds socket timeout
    auth: {
      user: smtpUser,
      pass: smtpPass,
    },
  } as any);

  try {
    const data = await transporter.sendMail({
      from: `"Go-Getters" <${smtpUser}>`,
      to,
      subject,
      html,
    });
    return data;
  } catch (error) {
    console.error("[Email System] Failed to send email via SMTP:", error);
    throw error;
  } finally {
    transporter.close(); // Clean up socket immediately!
  }
}

// ── Email Templates ──

const emailStyles = `
  font-family: 'Inter', Arial, sans-serif;
  background-color: #0d0d0f;
  color: #ffffff;
  padding: 30px;
  max-width: 600px;
  margin: 0 auto;
  border-radius: 12px;
  border: 1px solid #23262d;
`;

export async function sendRegistrationOtpEmail(to: string, userName: string, code: string) {
  const html = `
    <div style="${emailStyles}">
      <h1 style="color: #00d8fe; font-size: 24px; font-weight: 900; margin-bottom: 5px; letter-spacing: -0.05em;">GO-GETTERS</h1>
      <p style="color: #9ca3af; font-size: 14px; margin-top: 0;">High-Performance Execution System</p>
      
      <div style="background-color: #16171b; border: 1px solid #23262d; border-radius: 8px; padding: 25px; margin-top: 25px; text-align: center;">
        <h3 style="margin-top: 0; font-size: 18px; color: #ffffff; text-align: left;">Welcome to Go-Getters, ${userName.split(" ")[0]}!</h3>
        <p style="color: #d1d5db; font-size: 15px; line-height: 1.6; text-align: left; margin-bottom: 20px;">
          You are one step away from joining the elite execution network. Use the verification code below to confirm your email and complete your registration.
        </p>
        
        <div style="background-color: #0d0d0f; border: 1px solid #00d8fe; border-radius: 8px; padding: 15px 25px; display: inline-block; letter-spacing: 6px; font-size: 32px; font-weight: 900; color: #00d8fe; font-family: monospace; margin: 15px 0;">
          ${code}
        </div>
        
        <p style="color: #9ca3af; font-size: 13px; margin-top: 15px; text-align: left;">
          Note: This code will expire in 10 minutes. If you did not request this, you can safely ignore this email.
        </p>
      </div>
      
      <p style="color: #4b5563; font-size: 12px; margin-top: 30px; border-top: 1px solid #23262d; padding-top: 15px; text-align: center;">
        © 2026 Go-Getters. All rights reserved.
      </p>
    </div>
  `;
  return sendEmail({ to, subject: "Confirm Your Go-Getters Email Address", html });
}

export async function sendPasswordResetOtpEmail(to: string, userName: string, code: string) {
  const html = `
    <div style="${emailStyles}">
      <h1 style="color: #00d8fe; font-size: 24px; font-weight: 900; margin-bottom: 5px; letter-spacing: -0.05em;">GO-GETTERS</h1>
      <p style="color: #9ca3af; font-size: 14px; margin-top: 0;">High-Performance Execution System</p>
      
      <div style="background-color: #16171b; border: 1px solid #23262d; border-radius: 8px; padding: 25px; margin-top: 25px; text-align: center;">
        <h3 style="margin-top: 0; font-size: 18px; color: #ffffff; text-align: left;">Reset Your Password</h3>
        <p style="color: #d1d5db; font-size: 15px; line-height: 1.6; text-align: left; margin-bottom: 20px;">
          Hi ${userName.split(" ")[0]}, we received a request to reset your password. Use the verification code below to authorize the password change.
        </p>
        
        <div style="background-color: #0d0d0f; border: 1px solid #00d8fe; border-radius: 8px; padding: 15px 25px; display: inline-block; letter-spacing: 6px; font-size: 32px; font-weight: 900; color: #00d8fe; font-family: monospace; margin: 15px 0;">
          ${code}
        </div>
        
        <p style="color: #9ca3af; font-size: 13px; margin-top: 15px; text-align: left;">
          Note: This code will expire in 10 minutes. If you did not request a password reset, please secure your account immediately.
        </p>
      </div>
      
      <p style="color: #4b5563; font-size: 12px; margin-top: 30px; border-top: 1px solid #23262d; padding-top: 15px; text-align: center;">
        © 2026 Go-Getters. All rights reserved.
      </p>
    </div>
  `;
  return sendEmail({ to, subject: "Reset Your Go-Getters Password", html });
}
