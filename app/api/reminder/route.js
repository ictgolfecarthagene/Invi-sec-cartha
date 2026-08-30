import webpush from 'web-push';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL, 
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

webpush.setVapidDetails(
  'mailto:votre_email_club@gmail.com',
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY
);

// 1. BOUTON MANUEL (Requête POST)
export async function POST(req) {
  try {
    const { title, message } = await req.json();

    const { data: subscriptions, error: subError } = await supabase.from('admin_subscriptions').select('*');
    if (subError) throw subError;
    if (!subscriptions || subscriptions.length === 0) return Response.json({ success: false, error: "Aucun admin enregistré." });

    const payload = JSON.stringify({ title: title || "Rappel Interact", body: message, url: "/admin" });

    const sendPromises = subscriptions.map(sub => {
      const pushConfig = { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } };
      return webpush.sendNotification(pushConfig, payload).catch(async (err) => {
        if (err.statusCode === 410 || err.statusCode === 404) await supabase.from('admin_subscriptions').delete().eq('endpoint', sub.endpoint);
      });
    });

    await Promise.all(sendPromises);
    return Response.json({ success: true, sent: subscriptions.length });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}

// 2. RAPPEL AUTOMATIQUE CRON (Requête GET)
export async function GET(req) {
  try {
    const twentyFourHoursFromNow = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
    const rightNow = new Date().toISOString();

    // Récupérer les événements proches ET leurs participants
    const { data: events } = await supabase.from('manual_events')
      .select('*, rsvps(id, is_waitlist, is_sent)')
      .lte('deadline', twentyFourHoursFromNow)
      .gte('deadline', rightNow);

    if (!events || events.length === 0) return Response.json({ status: "Aucun événement proche" });

    // Filtrer : On ne garde que les événements qui ont des confirmés NON envoyés
    const eventsToAlert = events.filter(evt => {
      const confirmedUnsent = evt.rsvps ? evt.rsvps.filter(r => !r.is_waitlist && !r.is_sent) : [];
      return confirmedUnsent.length > 0;
    });

    if (eventsToAlert.length === 0) return Response.json({ status: "Toutes les listes sont déjà à jour et envoyées." });

    const { data: subscriptions } = await supabase.from('admin_subscriptions').select('*');
    if (!subscriptions || subscriptions.length === 0) return Response.json({ status: "Aucun admin enregistré" });

    for (const event of eventsToAlert) {
      const unsentCount = event.rsvps.filter(r => !r.is_waitlist && !r.is_sent).length;
      const payload = JSON.stringify({
        title: "🚨 URGENT : Liste à envoyer",
        body: `Il y a ${unsentCount} nouveau(x) membre(s) pour ${event.event_name}. Copiez la liste pour la secrétaire !`,
        url: "/admin"
      });

      for (const sub of subscriptions) {
        const pushConfig = { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } };
        try {
          await webpush.sendNotification(pushConfig, payload);
        } catch (err) {
          if (err.statusCode === 410 || err.statusCode === 404) await supabase.from('admin_subscriptions').delete().eq('endpoint', sub.endpoint);
        }
      }
    }

    return Response.json({ success: true, alertedEvents: eventsToAlert.length });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}