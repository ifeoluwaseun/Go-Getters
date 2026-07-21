import { NextResponse } from "next/server";
import { getServerUserByEmail, saveServerUser } from "@/lib/serverStore";
import { UserStatus } from "@/types";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://xbeyycvhatzyoqilqjqi.supabase.co";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhiZXl5Y3ZoYXR6eW9xaWxxanFpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQ0OTUyODYsImV4cCI6MjEwMDA3MTI4Nn0.85mnkV7X2q4_JpkyxNID09-s4QOSp1Buqac9sh3qPZc";
const supabase = createClient(supabaseUrl, supabaseAnonKey);

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

    // Save locally to serverStore
    saveServerUser({ ...storedRecord, otpCode: undefined, user: updatedUser });

    // Save to live Supabase database
    const dbProfile = {
      id: updatedUser.id,
      name: updatedUser.name,
      email: cleanEmail,
      password_hash: storedRecord.password || "app_auth_hash",
      role: updatedUser.role,
      status: updatedUser.status,
      streak: 0,
      points: 0,
      completion_rate: 0,
      consistency: 0,
      joined_at: updatedUser.joinedAt || new Date().toISOString(),
      leader_id: updatedUser.leaderId || null,
      leader_name: updatedUser.leaderName || null,
      sponsor_id: updatedUser.sponsorId || null,
      sponsor_name: updatedUser.sponsorName || null,
    };

    try {
      const { error: insertErr } = await supabase.from('users').insert(dbProfile);
      if (insertErr) {
        console.error("[Verify OTP API] Supabase database insert failed:", insertErr.message, insertErr);
      } else {
        console.log("[Verify OTP API] User successfully saved to Supabase:", cleanEmail);
      }
    } catch (dbErr) {
      console.error("[Verify OTP API] Supabase offline/error during insert:", dbErr);
    }

    return NextResponse.json({ success: true, user: updatedUser });
  } catch (error: any) {
    console.error("[Verify OTP API Error]:", error);
    return NextResponse.json({ error: error?.message || "Internal Server Error" }, { status: 500 });
  }
}
