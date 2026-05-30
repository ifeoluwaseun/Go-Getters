import { createClient } from "@/lib/supabase/server";
import { sendTaskReminderEmail } from "@/lib/resend";
import { sendNativePushNotification } from "@/lib/push";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  try {
    // Secure endpoint against unauthorized triggers in production
    const authHeader = request.headers.get("authorization");
    if (process.env.NODE_ENV !== "development" && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const supabase = await createClient();
    const today = new Date().toISOString().split("T")[0];

    // 1. Fetch approved users
    const { data: users, error: usersErr } = await supabase
      .from("users")
      .select("*")
      .eq("status", "approved");

    if (usersErr) throw usersErr;

    let sentEmails = 0;
    let createdNotifications = 0;

    for (const user of (users || [])) {
      // 2. Fetch pending or overdue tasks for today or overdue from the past
      const { data: tasks, error: tasksErr } = await supabase
        .from("tasks")
        .select("*")
        .eq("user_id", user.id)
        .lte("date", today)
        .or("status.eq.pending,status.eq.overdue");

      if (tasksErr) continue;

      if (tasks && tasks.length > 0) {
        // Create in-app notification row
        const newNotifId = crypto.randomUUID();
        await supabase.from("notifications").insert({
          id: newNotifId,
          user_id: user.id,
          type: "reminder",
          title: "Protect Your Streak!",
          body: `You still have ${tasks.length} pending task${tasks.length > 1 ? "s" : ""} left today. Execute strong!`,
          is_read: false,
          level: 2,
          created_at: new Date().toLocaleDateString(),
        });
        createdNotifications++;

        // Send a native push notification to their device(s)
        try {
          await sendNativePushNotification(
            supabase,
            user.id,
            "Protect Your Streak!",
            `You still have ${tasks.length} pending task${tasks.length > 1 ? "s" : ""} left today. Execute strong!`
          );
        } catch (pushErr) {
          console.error(`Failed to send native push to user ${user.id}:`, pushErr);
        }

        // Send a Resend email reminder
        try {
          await sendTaskReminderEmail(user.email, user.name, tasks.length);
          sentEmails++;
        } catch (emailErr) {
          console.error(`Failed to send email to ${user.email}:`, emailErr);
        }
      }
    }

    return NextResponse.json({
      success: true,
      auditedUsersCount: users?.length || 0,
      createdNotifications,
      sentEmails,
    });
  } catch (error: any) {
    console.error("Daily Compliance Cron Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
