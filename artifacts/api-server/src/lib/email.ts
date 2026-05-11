import { Resend } from "resend";
import { logger } from "./logger";

const resend = new Resend(process.env.RESEND_API_KEY);

const FROM = "Go-Getters <onboarding@resend.dev>";
const APP_NAME = "Go-Getters";

interface EmailPayload {
  to: string;
  subject: string;
  html: string;
}

async function send(payload: EmailPayload) {
  if (!process.env.RESEND_API_KEY) return;
  try {
    await resend.emails.send({ from: FROM, ...payload });
  } catch (err) {
    logger.error({ err }, "Failed to send email");
  }
}

function wrap(title: string, body: string, cta?: { text: string; url?: string }) {
  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#0d0d0f;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0d0d0f;padding:40px 16px;">
    <tr><td align="center">
      <table width="100%" style="max-width:560px;background:#18181b;border-radius:16px;border:1px solid #2a2a2e;overflow:hidden;">
        <!-- Header -->
        <tr><td style="background:linear-gradient(135deg,#00d8fe22,#00d8fe08);padding:28px 32px;border-bottom:1px solid #2a2a2e;">
          <p style="margin:0;font-size:22px;font-weight:900;color:#00d8fe;letter-spacing:-0.5px;">${APP_NAME}</p>
          <p style="margin:4px 0 0;font-size:13px;color:#6b7280;">The command center for driven teams</p>
        </td></tr>
        <!-- Body -->
        <tr><td style="padding:32px;">
          <h2 style="margin:0 0 12px;font-size:20px;font-weight:700;color:#f4f4f5;line-height:1.3;">${title}</h2>
          <div style="font-size:15px;color:#a1a1aa;line-height:1.6;">${body}</div>
          ${cta ? `<div style="margin-top:28px;"><a href="${cta.url ?? "#"}" style="display:inline-block;background:#00d8fe;color:#0d0d0f;font-weight:700;font-size:14px;padding:12px 28px;border-radius:8px;text-decoration:none;">${cta.text}</a></div>` : ""}
        </td></tr>
        <!-- Footer -->
        <tr><td style="padding:20px 32px;border-top:1px solid #2a2a2e;">
          <p style="margin:0;font-size:12px;color:#52525b;">You're receiving this because you're a member of ${APP_NAME}. Stay focused, stay consistent.</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

export const email = {
  async taskCompleted(to: string, name: string, taskTitle: string, streak: number) {
    await send({
      to,
      subject: `✅ Task complete — keep the momentum, ${name.split(" ")[0]}!`,
      html: wrap(
        `Nice work, ${name.split(" ")[0]}! ✅`,
        `You just completed <strong style="color:#f4f4f5;">"${taskTitle}"</strong>.<br><br>
        ${streak > 1 ? `You're on a <strong style="color:#00d8fe;">${streak}-day streak</strong>. Consistency is your superpower — don't break the chain!` : "Every task completed is a step closer to your goals. Keep going!"}`,
      ),
    });
  },

  async streakMilestone(to: string, name: string, streak: number) {
    await send({
      to,
      subject: `🔥 ${streak}-Day Streak — You're on fire, ${name.split(" ")[0]}!`,
      html: wrap(
        `${streak}-Day Streak! 🔥`,
        `<strong style="color:#f4f4f5;">${name.split(" ")[0]}</strong>, you've shown up for <strong style="color:#00d8fe;">${streak} days straight</strong>.<br><br>
        That level of consistency separates the top performers from everyone else. You're building something real. Keep showing up!`,
      ),
    });
  },

  async evidenceSubmitted(to: string, name: string, taskTitle: string) {
    await send({
      to,
      subject: `📎 Proof submitted — awaiting review`,
      html: wrap(
        "Your proof is in review 📎",
        `Hi <strong style="color:#f4f4f5;">${name.split(" ")[0]}</strong>,<br><br>
        Your evidence for <strong style="color:#f4f4f5;">"${taskTitle}"</strong> has been submitted successfully and is now awaiting review from your leader.<br><br>
        You'll receive another notification once it's been reviewed.`,
      ),
    });
  },

  async evidenceApproved(to: string, name: string, taskTitle: string) {
    await send({
      to,
      subject: `✅ Evidence approved — great work!`,
      html: wrap(
        "Evidence Approved! ✅",
        `Fantastic work, <strong style="color:#f4f4f5;">${name.split(" ")[0]}</strong>!<br><br>
        Your proof for <strong style="color:#f4f4f5;">"${taskTitle}"</strong> has been reviewed and <strong style="color:#00e57d;">approved</strong> by your leader.<br><br>
        This is what accountability looks like. You're setting the standard for the team!`,
      ),
    });
  },

  async evidenceRejected(to: string, name: string, taskTitle: string, feedback: string) {
    await send({
      to,
      subject: `⚠️ Evidence needs revision`,
      html: wrap(
        "Evidence Needs Revision ⚠️",
        `Hi <strong style="color:#f4f4f5;">${name.split(" ")[0]}</strong>,<br><br>
        Your proof for <strong style="color:#f4f4f5;">"${taskTitle}"</strong> was returned by your leader with the following feedback:<br><br>
        <div style="background:#1f1f23;border-left:3px solid #fbbf24;border-radius:4px;padding:12px 16px;margin:12px 0;color:#f4f4f5;font-style:italic;">"${feedback}"</div>
        Please resubmit with the requested changes. You've got this!`,
      ),
    });
  },

  async teamMessage(to: string, memberName: string, senderName: string, content: string, isNote: boolean) {
    await send({
      to,
      subject: `${isNote ? "📝 Note" : "💬 Message"} from ${senderName}`,
      html: wrap(
        `${isNote ? "A note" : "A message"} from ${senderName}`,
        `Hi <strong style="color:#f4f4f5;">${memberName.split(" ")[0]}</strong>,<br><br>
        Your ${isNote ? "leader left you a note" : "leader sent you a message"}:<br><br>
        <div style="background:#1f1f23;border-left:3px solid #00d8fe;border-radius:4px;padding:12px 16px;margin:12px 0;color:#f4f4f5;">${content}</div>`,
      ),
    });
  },

  async welcomeApproved(to: string, name: string) {
    await send({
      to,
      subject: `🎉 Welcome to Go-Getters, ${name.split(" ")[0]}!`,
      html: wrap(
        `You're in, ${name.split(" ")[0]}! 🎉`,
        `Your Go-Getters application has been <strong style="color:#00e57d;">approved</strong>!<br><br>
        You now have full access to the platform. Here's how to get started:<br><br>
        <ul style="color:#a1a1aa;padding-left:20px;line-height:2;">
          <li>Set your <strong style="color:#f4f4f5;">weekly goals</strong></li>
          <li>Add your <strong style="color:#f4f4f5;">daily tasks</strong> and start completing them</li>
          <li>Submit <strong style="color:#f4f4f5;">evidence</strong> to show your progress</li>
          <li>Check the <strong style="color:#f4f4f5;">leaderboard</strong> and climb the ranks</li>
        </ul>
        Welcome to the team — let's build something great together!`,
        { text: "Open Go-Getters" },
      ),
    });
  },
};
