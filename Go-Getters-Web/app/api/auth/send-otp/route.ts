import { NextResponse } from "next/server";
import { sendRegistrationOtpEmail } from "@/lib/email";


export async function POST(request: Request) {
  try {
    const { email, name, code } = await request.json();

    if (!email || !name || !code) {
      return NextResponse.json(
        { error: "Missing required fields: email, name, and code are required." },
        { status: 400 }
      );
    }

    const data = await sendRegistrationOtpEmail(email, name, code);

    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    console.error("Error in /api/auth/send-otp route:", error);
    return NextResponse.json(
      { error: error?.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}
