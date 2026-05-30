import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const body = await request.json();
    const { subscription } = body;

    // Retrieve active logged-in user securely from Supabase Auth cookies
    const { data: { user }, error: authErr } = await supabase.auth.getUser();
    if (authErr || !user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    if (!subscription || !subscription.endpoint) {
      return NextResponse.json({ success: false, error: "Invalid subscription payload" }, { status: 400 });
    }

    // Insert or update subscription in DB push_subscriptions table
    const subscriptionId = crypto.randomUUID();
    
    // Check if the user already has any subscription stored
    const { data: existing } = await supabase
      .from("push_subscriptions")
      .select("id")
      .eq("user_id", user.id);

    // Let's upsert by matching user_id
    if (existing && existing.length > 0) {
      const { error } = await supabase
        .from("push_subscriptions")
        .update({
          subscription: subscription,
        })
        .eq("user_id", user.id);
      if (error) throw error;
    } else {
      const { error } = await supabase
        .from("push_subscriptions")
        .insert({
          id: subscriptionId,
          user_id: user.id,
          subscription: subscription,
        });
      if (error) throw error;
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Push Subscription API Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
