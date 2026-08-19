import webpush from 'web-push';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL, 
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

webpush.setVapidDetails(
  'mailto:votre_email_club@gmail.com', // Mettez votre vrai email
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY
);

export async function GET(req) {
  // 1. Obtenir les événements dont la deadline est dans moins de 24h et dont la liste n'est pas encore envoyée
  const twentyFourHoursFromNow = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
  const rightNow = new Date().toISOString();

  const { data: events } = await supabase.from('manual_events')
    .select('*')
    //.eq('list_sent', false) // Assurez-vous d'avoir une colonne list_sent boolean dans votre table !
    .lte('deadline', twentyFourHoursFromNow)
    .gte('deadline', rightNow);

  if (!events || events.length === 0) return Response.json({ status: "Rien à signaler" });

  // 2. Récupérer tous les téléphones administrateurs enregistrés
  const { data: subscriptions } = await supabase.from('admin_subscriptions').select('*');
  if (!subscriptions || subscriptions.length === 0) return Response.json({ status: "Aucun admin enregistré" });

  // 3. Envoyer la notification Push à chaque téléphone
  for (const event of events) {
    const payload = JSON.stringify({
      title: "🚨 URGENT : Deadline Approche",
      body: `La liste pour ${event.event_name} doit être envoyée d'ici 24 heures !`,
      url: "/admin"
    });

    for (const sub of subscriptions) {
      const pushConfig = {
        endpoint: sub.endpoint,
        keys: { p256dh: sub.p256dh, auth: sub.auth }
      };

      try {
        await webpush.sendNotification(pushConfig, payload);
      } catch (err) {
        // Si la notification échoue (ex: l'admin a révoqué l'accès), on supprime le téléphone de la DB
        if (err.statusCode === 410 || err.statusCode === 404) {
          await supabase.from('admin_subscriptions').delete().eq('endpoint', sub.endpoint);
        }
      }
    }
  }

  return Response.json({ success: true, alertedEvents: events.length });
}