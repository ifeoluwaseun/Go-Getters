import nodemailer from "nodemailer";

const smtpUser = process.env.SMTP_USER;
const smtpPass = process.env.SMTP_PASS;

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: smtpUser,
    pass: smtpPass,
  },
});

export async function sendEmail({
  to,
  subject,
  html,
}: {
  to: string;
  subject: string;
  html: string;
}) {
  if (!smtpUser || !smtpPass) {
    console.warn("SMTP_USER or SMTP_PASS is not configured. Email skipped:", { to, subject });
    return null;
  }
  try {
    const data = await transporter.sendMail({
      from: `"Go-Getters" <${smtpUser}>`,
      to,
      subject,
      html,
    });
    return data;
  } catch (error) {
    console.error("Failed to send email via SMTP:", error);
    throw error;
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
