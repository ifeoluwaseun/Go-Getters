import { Resend } from "resend";

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;
const FROM_EMAIL = "onboarding@resend.dev"; // Standard demo Resend sender address

export async function sendEmail({
  to,
  subject,
  html,
}: {
  to: string;
  subject: string;
  html: string;
}) {
  if (!resend) {
    console.warn("Resend API key is not configured. Email skipped:", { to, subject });
    return null;
  }
  try {
    const data = await resend.emails.send({
      from: `Go-Getters <${FROM_EMAIL}>`,
      to,
      subject,
      html,
    });
    return data;
  } catch (error) {
    console.error("Failed to send email via Resend:", error);
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

const buttonStyles = `
  display: inline-block;
  background-color: #00d8fe;
  color: #000000;
  font-weight: bold;
  padding: 12px 24px;
  border-radius: 6px;
  text-decoration: none;
  margin-top: 15px;
`;

export async function sendTaskReminderEmail(to: string, userName: string, taskCount: number) {
  const html = `
    <div style="${emailStyles}">
      <h1 style="color: #00d8fe; font-size: 24px; font-weight: 900; margin-bottom: 5px; tracking-tight: -0.05em;">GO-GETTERS</h1>
      <p style="color: #9ca3af; font-size: 14px; margin-top: 0;">High-Performance Execution System</p>
      
      <div style="background-color: #16171b; border: 1px solid #23262d; border-radius: 8px; padding: 20px; margin-top: 25px;">
        <h3 style="margin-top: 0; font-size: 18px; color: #ffffff;">Action Required, ${userName.split(" ")[0]}!</h3>
        <p style="color: #d1d5db; font-size: 15px; line-height: 1.6;">
          You still have <strong>${taskCount} pending tasks</strong> on your plate today. Protect your streak and execute your goals.
        </p>
        <a href="http://localhost:3000/tasks" style="${buttonStyles}">Open Task Center</a>
      </div>
      
      <p style="color: #4b5563; font-size: 12px; margin-top: 30px; border-top: 1px solid #23262d; padding-top: 15px; text-align: center;">
        Unsubscribe from daily alerts in your profile settings.
      </p>
    </div>
  `;
  return sendEmail({ to, subject: `Finish Strong! You have ${taskCount} tasks left`, html });
}

export async function sendSupportCallPromptEmail(to: string, userName: string) {
  const html = `
    <div style="${emailStyles}">
      <h1 style="color: #00d8fe; font-size: 24px; font-weight: 900; margin-bottom: 5px;">GO-GETTERS</h1>
      <p style="color: #9ca3af; font-size: 14px; margin-top: 0;">Accountability Support</p>
      
      <div style="background-color: #1a151b; border: 1px solid #3b1c24; border-radius: 8px; padding: 20px; margin-top: 25px;">
        <h3 style="margin-top: 0; font-size: 18px; color: #ff5555;">Let's Get Back On Track</h3>
        <p style="color: #e5e7eb; font-size: 15px; line-height: 1.6;">
          We noticed you may need support staying consistent this week. Go-Getters protect their momentum together. Please book a brief, high-impact accountability support call so we can remove any roadblocks.
        </p>
        <a href="http://localhost:3000/dashboard" style="${buttonStyles}">Book Accountability Call</a>
      </div>
    </div>
  `;
  return sendEmail({ to, subject: "Need support staying consistent? Let's talk.", html });
}

export async function sendAdminComplianceEmail(
  to: string,
  adminName: string,
  stats: {
    inactiveCount: number;
    compliancePercent: number;
    usersToFollowUp: { name: string; missedCount: number }[];
  }
) {
  const usersList = stats.usersToFollowUp
    .map(u => `<li style="margin-bottom: 6px;"><strong>${u.name}</strong> (missed ${u.missedCount} goals)</li>`)
    .join("");

  const html = `
    <div style="${emailStyles}">
      <h1 style="color: #00d8fe; font-size: 24px; font-weight: 900; margin-bottom: 5px;">GO-GETTERS</h1>
      <p style="color: #9ca3af; font-size: 14px; margin-top: 0;">Compliance Report</p>
      
      <div style="background-color: #16171b; border: 1px solid #23262d; border-radius: 8px; padding: 20px; margin-top: 25px;">
        <h3 style="margin-top: 0; font-size: 18px; color: #ffffff;">Hello, Admin ${adminName}</h3>
        <p style="color: #d1d5db; font-size: 15px;">
          Here is your daily team accountability audit:
        </p>
        
        <table style="width: 100%; margin: 20px 0; border-collapse: collapse; font-size: 14px;">
          <tr>
            <td style="padding: 8px; border-bottom: 1px solid #23262d; color: #9ca3af;">Overall Compliance</td>
            <td style="padding: 8px; border-bottom: 1px solid #23262d; font-weight: bold; text-align: right; color: #00e57d;">${stats.compliancePercent}%</td>
          </tr>
          <tr>
            <td style="padding: 8px; border-bottom: 1px solid #23262d; color: #9ca3af;">Inactive Members</td>
            <td style="padding: 8px; border-bottom: 1px solid #23262d; font-weight: bold; text-align: right; color: #ffdd00;">${stats.inactiveCount}</td>
          </tr>
        </table>
        
        {stats.usersToFollowUp.length > 0 ? (
          <div>
            <p style="color: #ffffff; font-weight: bold; margin-bottom: 8px;">Action Items (Low Compliance):</p>
            <ul style="color: #d1d5db; padding-left: 20px; margin-top: 0;">
              ${usersList}
            </ul>
          </div>
        ) : ""}
        
        <a href="http://localhost:3000/admin" style="${buttonStyles}">Open Admin Console</a>
      </div>
    </div>
  `;
  return sendEmail({ to, subject: "Daily Accountability Audit Summary Report", html });
}
