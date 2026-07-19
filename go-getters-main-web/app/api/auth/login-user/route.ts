import { NextResponse } from "next/server";
import { getServerUserByEmail } from "@/lib/serverStore";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required." }, { status: 400 });
    }

    const cleanEmail = email.trim().toLowerCase();
    const storedRecord = getServerUserByEmail(cleanEmail);

    if (!storedRecord) {
      return NextResponse.json({ error: "Invalid email or password." }, { status: 401 });
    }

    if (storedRecord.password && storedRecord.password !== password) {
      return NextResponse.json({ error: "Invalid password." }, { status: 401 });
    }

    return NextResponse.json({ success: true, user: storedRecord.user });
  } catch (error: any) {
    console.error("[Login API Error]:", error);
    return NextResponse.json({ error: error?.message || "Internal Server Error" }, { status: 500 });
  }
}
