import webpush from "web-push";

const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY;

// Standard identifier mailto address for VAPID configuration
const mailTo = "mailto:support@gogetters.app";

if (vapidPublicKey && vapidPrivateKey) {
  webpush.setVapidDetails(mailTo, vapidPublicKey, vapidPrivateKey);
} else {
  console.warn("VAPID Keys are not fully configured in environment variables. Web Push will run in simulation mode.");
}

export async function sendPushNotification(
  subscription: { endpoint: string; keys: { p256dh: string; auth: string } },
  title: string,
  body: string,
  url = "/dashboard"
) {
  if (!vapidPublicKey || !vapidPrivateKey) {
    console.warn("Skipping Web Push. VAPID Keys missing:", { title, body });
    return null;
  }

  const payload = JSON.stringify({ title, body, url });

  try {
    const response = await webpush.sendNotification(subscription, payload);
    return response;
  } catch (error: any) {
    console.error("Failed to send Web Push notification:", error);
    // If the endpoint is no longer active (404/410), caller should delete the subscription
    if (error.statusCode === 404 || error.statusCode === 410) {
      return { expired: true };
    }
    throw error;
  }
}
