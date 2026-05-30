import { createClient } from "@/lib/supabase/server";
import { sendAdminComplianceEmail, sendSupportCallPromptEmail } from "@/lib/resend";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  try {
    // Secure endpoint against unauthorized triggers in production
    const authHeader = request.headers.get("authorization");
    if (process.env.NODE_ENV !== "development" && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const supabase = await createClient();

    // 1. Fetch approved users
    const { data: users, error: usersErr } = await supabase
      .from("users")
      .select("*")
      .eq("status", "approved");

    if (usersErr) throw usersErr;

    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    const oneWeekAgoStr = oneWeekAgo.toISOString().split("T")[0];

    const usersToFollowUp: { name: string; missedCount: number }[] = [];
    let inactiveCount = 0;
    let totalCompletionRate = 0;

    for (const user of (users || [])) {
      // 2. Fetch tasks in the last 7 days
      const { data: tasks, error: tasksErr } = await supabase
        .from("tasks")
        .select("*")
        .eq("user_id", user.id)
        .gte("date", oneWeekAgoStr);

      if (tasksErr) continue;

      const totalTasks = tasks?.length || 0;
      const completedTasks = tasks?.filter(t => t.status === "completed") || [];
      const completedCount = completedTasks.length;

      // Calculate completion rate
      const completionRate = totalTasks > 0 ? Math.round((completedCount / totalTasks) * 100) : 0;
      totalCompletionRate += completionRate;

      // Calculate consistency (percentage of days in the week with at least 1 completed task)
      const activeDays = new Set(completedTasks.map(t => t.date));
      const consistency = Math.round((activeDays.size / 7) * 100);

      // Detect struggling users
      if (totalTasks > 0 && completionRate < 50) {
        usersToFollowUp.push({ name: user.name, missedCount: totalTasks - completedCount });
        inactiveCount++;

        // Send a support call invitation email
        try {
          await sendSupportCallPromptEmail(user.email, user.name);
        } catch (err) {
          console.error(`Failed to send support prompt to ${user.email}:`, err);
        }
      }

      // Update user consistency & completion metrics in DB
      await supabase
        .from("users")
        .update({
          completion_rate: completionRate,
          consistency: consistency,
        })
        .eq("id", user.id);
    }

    const avgCompliance = users && users.length > 0 ? Math.round(totalCompletionRate / users.length) : 0;

    // 3. Send weekly compliance report to Admins
    const admins = users?.filter(u => u.role === "admin") || [];
    for (const admin of admins) {
      try {
        await sendAdminComplianceEmail(admin.email, admin.name, {
          inactiveCount,
          compliancePercent: avgCompliance,
          usersToFollowUp,
        });
      } catch (err) {
        console.error(`Failed to send admin report to ${admin.email}:`, err);
      }
    }

    return NextResponse.json({
      success: true,
      auditedUsersCount: users?.length || 0,
      avgCompliance,
      inactiveCount,
    });
  } catch (error: any) {
    console.error("Weekly Compliance Cron Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
