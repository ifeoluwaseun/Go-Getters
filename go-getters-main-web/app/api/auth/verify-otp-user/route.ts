import { NextResponse } from "next/server";
import { getServerUserByEmail, saveServerUser } from "@/lib/serverStore";
import { UserStatus } from "@/types";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, code } = body;

    if (!email || !code) {
      return NextResponse.json({ error: "Email and verification code are required." }, { status: 400 });
    }

    const cleanEmail = email.trim().toLowerCase();
    const storedRecord = getServerUserByEmail(cleanEmail);

    if (!storedRecord) {
      return NextResponse.json({ error: "No pending registration found for this email." }, { status: 404 });
    }

    if (storedRecord.otpCode && storedRecord.otpCode !== code.trim()) {
      return NextResponse.json({ error: "Invalid verification code. Please check your email." }, { status: 400 });
    }

    const statusVal: UserStatus = storedRecord.user.role === "admin" ? "approved" : "pending";

    const updatedUser = {
      ...storedRecord.user,
      status: statusVal,
    };

    saveServerUser({ ...storedRecord, otpCode: undefined, user: updatedUser });

    return NextResponse.json({ success: true, user: updatedUser });
  } catch (error: any) {
    console.error("[Verify OTP API Error]:", error);
    return NextResponse.json({ error: error?.message || "Internal Server Error" }, { status: 500 });
  }
}
