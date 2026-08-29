import webpush from 'web-push';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL, 
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

// Ensure these match the keys generated in your Vercel Environment Variables
webpush.setVapidDetails(
  'mailto:votre_email_club@gmail.com', 
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY
);

// Changed to POST to accept the data sent from your admin button
export async function POST(req) {
  try {
    // Read the title and message sent by the admin dashboard
    const { title, message } = await req.json();

    // 1. Fetch all subscribed admin devices
    const { data: subscriptions, error: subError } = await supabase
        .from('admin_subscriptions')
        .select('*');

    if (subError) throw subError;

    if (!subscriptions || subscriptions.length === 0) {
      return Response.json({ success: false, error: "Aucun admin enregistré pour recevoir des notifications." });
    }

    const payload = JSON.stringify({ 
        title: title || "Rappel Interact", 
        body: message 
    });

    // 2. Send the Push Notification to every device
    const sendPromises = subscriptions.map(sub => {
      const pushConfig = {
        endpoint: sub.endpoint,
        keys: { p256dh: sub.p256dh, auth: sub.auth }
      };

      return webpush.sendNotification(pushConfig, payload).catch(async (err) => {
        console.error("Push failed for an endpoint:", err);
        // Clean up invalid subscriptions if the user revoked access
        if (err.statusCode === 410 || err.statusCode === 404) {
          await supabase.from('admin_subscriptions').delete().eq('endpoint', sub.endpoint);
        }
      });
    });

    await Promise.all(sendPromises);

    return Response.json({ success: true, sent: subscriptions.length });

  } catch (error) {
    console.error("Server Route Error:", error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}