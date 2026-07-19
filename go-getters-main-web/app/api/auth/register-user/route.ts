import { NextResponse } from "next/server";
import { saveServerUser, getServerUserByEmail } from "@/lib/serverStore";
import { sendRegistrationOtpEmail } from "@/lib/email";
import { User, UserRole } from "@/types";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, email, password, role, leaderId, leaderName, sponsorId, sponsorName, adminCode } = body;

    if (!name || !email || !password) {
      return NextResponse.json({ error: "Name, email, and password are required." }, { status: 400 });
    }

    const cleanEmail = email.trim().toLowerCase();

    if (role === "admin" && adminCode !== "GOGETTERS2024") {
      return NextResponse.json({ error: "Invalid admin setup code." }, { status: 400 });
    }

    const existing = getServerUserByEmail(cleanEmail);
    if (existing && existing.user.status !== "unconfirmed") {
      return NextResponse.json({ error: "An account with this email address already exists. Please sign in." }, { status: 400 });
    }

    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const userId = existing?.user?.id || "usr_" + Math.random().toString(36).substring(2) + Date.now().toString(36);

    const userObj: User = {
      id: userId,
      name,
      email: cleanEmail,
      role: role as UserRole,
      status: "unconfirmed",
      streak: 0,
      points: 0,
      completionRate: 0,
      consistency: 0,
      joinedAt: new Date().toISOString(),
      leaderId: leaderId || undefined,
      leaderName: leaderName || undefined,
      sponsorId: sponsorId || undefined,
      sponsorName: sponsorName || undefined,
    };

    saveServerUser({ password, otpCode, user: userObj });

    // Dispatch OTP email
    try {
      await sendRegistrationOtpEmail(cleanEmail, name, otpCode);
    } catch (emailErr) {
      console.error("[Register API] Failed to send OTP email:", emailErr);
    }

    return NextResponse.json({ success: true, user: userObj, otpCode });
  } catch (error: any) {
    console.error("[Register API Error]:", error);
    return NextResponse.json({ error: error?.message || "Internal Server Error" }, { status: 500 });
  }
}
