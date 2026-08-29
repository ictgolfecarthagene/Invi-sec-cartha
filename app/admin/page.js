"use client";
import { useState, useEffect } from "react";
import { Lock, Settings, Save, Copy, Plus, Trash2, BellRing, Loader2, Sparkles, Edit, X, Calendar, Eye, RefreshCcw, Link as LinkIcon, Users } from "lucide-react";
import { supabase } from "../../lib/supabase";

const INTERACT_CLUBS = [
  "IC Tunis Medina", "IC Mirabel Tunis", "IC North Africa", "IC Pilote Ariana", "IC Bloom City", "IC Big South Tunis", "IC Tunis Cosmopolitan", "IC Tunis Doyen", "IC Tunis Inner City", "IC Tunis El Bey", "IC Anastasia", "IC Ennaser", "IC Tunis Golden Eagles", "IC Rey De Carthago", "IC Tinast Glory", "IC Didon Amilcar", "IC Tunis Golfe", "IC Opportunity", "IC Aquatic North", "IC Tunis Moon City", "IC Tunis Les Berges Du Lac", "IC Tunis Hannibal", "IC Amilcar Sidibousaid", "IC Sidibousaid", "IC Tunis César", "IC Carthage La Renaissance", "IC Tunis Belvédère", "IC Ariana Tines", "IC Ariana La Rose", "IC Saint Germain", "IC Maxula Prates", "IC Tunis Golfe Carthagène", "IC Megrine", "IC Tunis Amilcar", "IC Hammam Lif", "IC Boumhel El Bassatine", "IC Hammamet", "IC Nabeul Neapolis", "IC Graces El Mourouj", "IC Pragma Sousse", "IC Sousse", "IC Kairouan", "IC Ruspina Monastir", "IC Monastir", "IC Sfax Doyen", "IC Sfax Métropole", "IC Sfax Flambeau", "IC Sfax Sindbad", "IC Sfax Tamaris", "IC Gabes Oasis", "IC Djerba Flamingo"
];

const urlBase64ToUint8Array = (base64String) => {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
};

export default function AdminDashboard() {
  const [password, setPassword] = useState("");
  const [authenticated, setAuthenticated] = useState(false);

  const [isSaving, setIsSaving] = useState(false);
  const [isSubscribing, setIsSubscribing] = useState(false);
  const [isParsing, setIsParsing] = useState(false);
  const [isLoadingEvents, setIsLoadingEvents] = useState(false);
  const [isNotifying, setIsNotifying] = useState(false);
  const [isSyncingSheet, setIsSyncingSheet] = useState(false);

  const [eventsList, setEventsList] = useState([]);
  const [editingEventId, setEditingEventId] = useState(null);
  
  // Waitlist & Deletion States
  const [currentPreviewEvent, setCurrentPreviewEvent] = useState(null);
  const [previewRsvps, setPreviewRsvps] = useState([]);

  const [aiText, setAiText] = useState("");
  const [eventName, setEventName] = useState("");
  const [mainParagraph, setMainParagraph] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [deadline, setDeadline] = useState("");
  const [location, setLocation] = useState("");
  const [selectedClubs, setSelectedClubs] = useState([]);
  const [totalMemberLimit, setTotalMemberLimit] = useState("");
  const [guestsAllowed, setGuestsAllowed] = useState(false);
  const [totalGuestLimit, setTotalGuestLimit] = useState("");
  
  const [parts, setParts] = useState([{ name: "Programme", memberPrice: 0, guestPrice: 0, memberLimit: "", guestLimit: "" }]);
  const [template, setTemplate] = useState("Aslemaa ,\nVoici la liste des participants pour [EVENT_NAME]\n\n[LIST]\n\nBonne chance 🫶");

  const fetchEvents = async () => {
    setIsLoadingEvents(true);
    const { data } = await supabase.from('manual_events').select('*').order('created_at', { ascending: false });
    if (data) setEventsList(data);
    setIsLoadingEvents(false);
  };

  useEffect(() => {
    if (authenticated) fetchEvents();
  }, [authenticated]);

  const handleLogin = (e) => {
    if (e) e.preventDefault();
    if (password === process.env.NEXT_PUBLIC_ADMIN_PASSWORD) setAuthenticated(true);
    else alert("Mot de passe incorrect");
  };

  const syncGoogleSheets = async () => {
    setIsSyncingSheet(true);
    try {
      const response = await fetch('/api/sync-members', { method: 'POST' });
      const text = await response.text();
      try {
        const data = JSON.parse(text);
        if (data.success) alert(`✅ Synchronisation réussie ! ${data.count} membres ont été importés.`);
        else alert("❌ Erreur de synchronisation: " + data.error);
      } catch(e) {
        alert("❌ Erreur de l'API. Avez-vous créé le fichier /api/sync-members/route.js ? Détails: " + text.substring(0,100));
      }
    } catch (error) {
      alert("❌ Impossible de contacter le serveur de synchronisation.");
    } finally {
      setIsSyncingSheet(false);
    }
  };

  const handleAIParsing = async () => {
    if (!aiText.trim()) return alert("Veuillez coller le texte de l'invitation.");
    setIsParsing(true);
    try {
      const response = await fetch('/api/parse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: aiText })
      });
      const data = await response.json();
      
      if (!response.ok) throw new Error(data.error || "Erreur API inconnue");
      
      if (data.eventName) setEventName(data.eventName);
      if (data.mainParagraph) setMainParagraph(data.mainParagraph);
      if (data.eventDate) setEventDate(data.eventDate);
      if (data.location) setLocation(data.location);
      if (data.deadline) setDeadline(data.deadline);
      if (data.hostClubs) setSelectedClubs(Array.isArray(data.hostClubs) ? data.hostClubs : [data.hostClubs]);
      if (data.guestsAllowed !== undefined) setGuestsAllowed(data.guestsAllowed);
      
      if (data.parts && data.parts.length > 0) {
        const aiParts = data.parts.map(p => ({ ...p, memberLimit: "", guestLimit: "" }));
        setParts(aiParts);
      }
      
      alert("✅ Données extraites avec succès ! Veuillez vérifier les champs.");
    } catch (error) {
      alert("❌ Erreur: " + error.message);
    } finally {
      setIsParsing(false);
    }
  };

  const copyDirectLink = (id) => {
    const url = `${window.location.origin}/?id=${id}`;
    navigator.clipboard.writeText(url);
    alert("✅ Lien direct copié : " + url);
  };

  if (!authenticated) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
        <div className="bg-white p-10 rounded-[2rem] shadow-2xl max-w-md w-full text-center">
          <div className="bg-blue-50 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-8 shadow-inner">
            <Lock className="w-12 h-12 text-blue-600" />
          </div>
          <h2 className="text-3xl font-black text-gray-900 mb-2">Accès Sécurisé</h2>
          <form onSubmit={handleLogin}>
            <input type="text" name="username" autoComplete="username" value="admin" readOnly style={{ display: 'none' }} />
            <input 
              type="password" name="password" autoComplete="current-password" placeholder="Mot de passe..."
              className="w-full bg-gray-50 border-2 border-gray-200 p-4 rounded-2xl mb-6 text-center text-xl font-bold focus:border-blue-500 focus:bg-white outline-none"
              value={password} onChange={(e) => setPassword(e.target.value)}
            />
            <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black text-lg py-4 rounded-2xl shadow-xl active:scale-95">Déverrouiller</button>
          </form>
        </div>
      </div>
    );
  }

  const handleSaveEvent = async () => {
    if (!eventName || !deadline) return alert("Le nom de l'événement et la date limite sont requis.");
    setIsSaving(true);
    
    const cleanParts = parts.map(p => ({
      ...p,
      memberLimit: p.memberLimit ? Number(p.memberLimit) : null,
      guestLimit: p.guestLimit ? Number(p.guestLimit) : null
    }));

    const payload = {
      event_name: eventName,
      host_clubs: selectedClubs,
      event_date: eventDate,
      location: location,
      main_paragraph: mainParagraph,
      deadline: deadline,
      total_member_limit: totalMemberLimit ? Number(totalMemberLimit) : null,
      guests_allowed: guestsAllowed,
      total_guest_limit: guestsAllowed && totalGuestLimit ? Number(totalGuestLimit) : null,
      event_parts: cleanParts
    };

    let error;
    if (editingEventId) error = (await supabase.from('manual_events').update(payload).eq('id', editingEventId)).error;
    else error = (await supabase.from('manual_events').insert([payload])).error;

    setIsSaving(false);
    
    if (error) alert("Erreur de sauvegarde: " + error.message);
    else {
      alert(editingEventId ? "✅ Événement mis à jour !" : "✅ Événement publié !");
      resetForm();
      fetchEvents();
    }
  };

  const handleDeleteEvent = async (id) => {
    if (!window.confirm("Êtes-vous sûr de vouloir supprimer cet événement ?")) return;
    await supabase.from('manual_events').delete().eq('id', id);
    if (editingEventId === id) resetForm();
    fetchEvents();
  };

  const loadEventToEdit = (evt) => {
    setEditingEventId(evt.id);
    setEventName(evt.event_name || "");
    setMainParagraph(evt.main_paragraph || "");
    setEventDate(evt.event_date || "");
    setDeadline(evt.deadline || "");
    setLocation(evt.location || "");
    setSelectedClubs(Array.isArray(evt.host_clubs) ? evt.host_clubs : []);
    setTotalMemberLimit(evt.total_member_limit || "");
    setGuestsAllowed(evt.guests_allowed || false);
    setTotalGuestLimit(evt.total_guest_limit || "");
    
    const loadedParts = evt.event_parts || [{ name: "Programme", memberPrice: 0, guestPrice: 0 }];
    const cleanParts = loadedParts.map(p => ({
        ...p,
        memberLimit: p.memberLimit || "",
        guestLimit: p.guestLimit || ""
    }));
    setParts(cleanParts);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const resetForm = () => {
    setEditingEventId(null);
    setEventName("");
    setMainParagraph("");
    setEventDate("");
    setDeadline("");
    setLocation("");
    setSelectedClubs([]);
    setTotalMemberLimit("");
    setGuestsAllowed(false);
    setTotalGuestLimit("");
    setParts([{ name: "Programme", memberPrice: 0, guestPrice: 0, memberLimit: "", guestLimit: "" }]);
    setAiText("");
  };

  const toggleClub = (club) => {
    setSelectedClubs(prev => {
      const currentList = Array.isArray(prev) ? prev : [];
      return currentList.includes(club) ? currentList.filter(c => c !== club) : [...currentList, club];
    });
  };

  const updatePart = (index, field, value) => {
    const newParts = [...parts];
    newParts[index][field] = (field === 'name' || field === 'memberLimit' || field === 'guestLimit') ? value : Number(value);
    setParts(newParts);
  };

  const openPreview = async (evt) => {
    const { data: rsvps } = await supabase.from('rsvps').select('*').eq('event_id', evt.id).order('created_at', { ascending: true });
    setCurrentPreviewEvent(evt);
    setPreviewRsvps(rsvps || []);
  };

  const handleDeleteRSVP = async (rsvp) => {
    if (!window.confirm(`Voulez-vous vraiment annuler la réservation de ${rsvp.member_name} ?`)) return;
    
    await supabase.from('rsvps').delete().eq('id', rsvp.id);
    
    // Promote the first waitlisted person if a confirmed spot opens up
    if (!rsvp.is_waitlist) {
      const { data: waitlisted } = await supabase
        .from('rsvps')
        .select('*')
        .eq('event_id', rsvp.event_id)
        .eq('is_waitlist', true)
        .order('created_at', { ascending: true }) 
        .limit(1);

      if (waitlisted && waitlisted.length > 0) {
        await supabase.from('rsvps').update({ is_waitlist: false }).eq('id', waitlisted[0].id);
        alert(`✅ Une place s'est libérée ! ${waitlisted[0].member_name} a été automatiquement promu(e) aux confirmations.`);
      }
    }
    openPreview(currentPreviewEvent);
  };

  const copyToClipboard = () => {
    let listText = "Aucun participant pour le moment.";
    const confirmed = previewRsvps.filter(r => !r.is_waitlist);
    
    if (confirmed.length > 0) {
      listText = confirmed.map((r, i) => {
        let partsStr = Array.isArray(r.selected_parts) ? r.selected_parts.join(' + ') : r.selected_parts;
        let str = `${i + 1}. Membre : ${r.member_name} (Options : ${partsStr})`;
        if (r.guest_name) str += `\n    ↳ Invité : ${r.guest_name}`;
        return str;
      }).join("\n\n");
    }

    let finalMessage = template.replace("[EVENT_NAME]", currentPreviewEvent.event_name).replace("[LIST]", listText);
    navigator.clipboard.writeText(finalMessage);
    alert("✅ Liste des CONFIRMÉS copiée dans le presse-papiers !");
  };

  const sendReminder = async (evt) => {
    if (!window.confirm(`Voulez-vous vraiment envoyer une notification push pour "${evt.event_name}" ?`)) return;
    setIsNotifying(true);
    try {
      const response = await fetch('/api/reminder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: "Rappel Interact", message: `Dernier rappel pour: ${evt.event_name}. Veuillez confirmer votre présence !` })
      });
      
      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        const text = await response.text();
        throw new Error(`Code ${response.status} - Détail: ${text.substring(0, 150)}...`);
      }

      const data = await response.json();
      if (data.success) alert(`✅ Notifications envoyées avec succès à ${data.sent} appareils !`);
      else alert("❌ Erreur: " + data.error);
    } catch (err) {
      console.error(err);
      alert("❌ Problème de serveur: " + err.message);
    } finally {
      setIsNotifying(false);
    }
  };

  const enableNotifications = async () => {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) return alert("Push non supporté.");
    setIsSubscribing(true);
    try {
      const registration = await navigator.serviceWorker.register('/sw.js');
      const permission = await window.Notification.requestPermission();
      if (permission !== 'granted') throw new Error('Permission refusée');
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY)
      });
      const subData = JSON.parse(JSON.stringify(subscription));
      await supabase.from('admin_subscriptions').insert([{ endpoint: subData.endpoint, p256dh: subData.keys.p256dh, auth: subData.keys.auth }]);
      alert('✅ Notifications activées sur ce téléphone !');
    } catch (error) {
      alert("Erreur lors de l'activation des notifications.");
    } finally {
      setIsSubscribing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-4 md:p-8 font-sans relative">
      
      {/* Waitlist and Deletion Modal */}
      {currentPreviewEvent && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-3xl p-8 max-w-2xl w-full shadow-2xl relative max-h-[90vh] flex flex-col">
            <button onClick={() => setCurrentPreviewEvent(null)} className="absolute top-6 right-6 text-gray-400 hover:text-gray-900"><X className="w-6 h-6" /></button>
            <h2 className="text-2xl font-black text-gray-900 mb-6 flex items-center gap-2"><Users className="w-6 h-6 text-blue-600"/> Gestion des Présences</h2>
            
            <div className="overflow-y-auto flex-1 pr-2 space-y-6">
               <div>
                 <h3 className="font-bold text-lg text-green-700 border-b pb-2 mb-3">✅ Confirmés ({previewRsvps.filter(r => !r.is_waitlist).length})</h3>
                 {previewRsvps.filter(r => !r.is_waitlist).length === 0 ? <p className="text-sm text-gray-500 italic">Aucun membre confirmé pour le moment.</p> : previewRsvps.filter(r => !r.is_waitlist).map(r => (
                    <div key={r.id} className="flex justify-between items-center bg-gray-50 p-3 rounded-xl mb-2 border border-gray-100">
                       <div>
                         <p className="font-bold text-sm text-gray-800">{r.member_name}</p>
                         <p className="text-xs text-gray-500">{Array.isArray(r.selected_parts) ? r.selected_parts.join(', ') : r.selected_parts} {r.guest_name && ` | Invité: ${r.guest_name}`}</p>
                       </div>
                       <button onClick={() => handleDeleteRSVP(r)} className="p-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-colors"><Trash2 className="w-4 h-4"/></button>
                    </div>
                 ))}
               </div>

               <div>
                 <h3 className="font-bold text-lg text-orange-600 border-b pb-2 mb-3">⏳ Liste d'attente ({previewRsvps.filter(r => r.is_waitlist).length})</h3>
                 {previewRsvps.filter(r => r.is_waitlist).length === 0 ? <p className="text-sm text-gray-500 italic">Aucun membre en attente.</p> : previewRsvps.filter(r => r.is_waitlist).map(r => (
                    <div key={r.id} className="flex justify-between items-center bg-orange-50 p-3 rounded-xl mb-2 border border-orange-100">
                       <div>
                         <p className="font-bold text-sm text-gray-800">{r.member_name}</p>
                         <p className="text-xs text-gray-500">{Array.isArray(r.selected_parts) ? r.selected_parts.join(', ') : r.selected_parts}</p>
                       </div>
                       <button onClick={() => handleDeleteRSVP(r)} className="p-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-colors"><Trash2 className="w-4 h-4"/></button>
                    </div>
                 ))}
               </div>
            </div>

            <div className="mt-6 pt-4 border-t">
              <button onClick={copyToClipboard} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black text-lg py-4 rounded-xl shadow-lg flex justify-center items-center gap-2 transition-transform active:scale-95">
                <Copy className="w-5 h-5"/> Copier la liste confirmée
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-6xl mx-auto space-y-8">
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-3xl shadow-sm border border-gray-200">
          <h1 className="text-3xl font-black flex items-center gap-3 text-gray-900"><Settings className="text-blue-600 w-8 h-8" /> Administration</h1>
          <div className="flex flex-col sm:flex-row gap-3">
            <button onClick={syncGoogleSheets} disabled={isSyncingSheet} className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-5 py-3 rounded-xl font-bold shadow-md active:scale-95 disabled:opacity-70">
              {isSyncingSheet ? <Loader2 className="w-5 h-5 animate-spin" /> : <RefreshCcw className="w-5 h-5" />} Sync Sheets
            </button>
            <button onClick={enableNotifications} disabled={isSubscribing} className="flex items-center gap-2 bg-gray-900 hover:bg-black text-white px-5 py-3 rounded-xl font-bold shadow-md active:scale-95 disabled:opacity-70">
              {isSubscribing ? <Loader2 className="w-5 h-5 text-yellow-400 animate-spin" /> : <BellRing className="w-5 h-5 text-yellow-400" />} Alertes
            </button>
          </div>
        </div>

        <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-200">
          <h2 className="font-bold text-xl mb-4 text-gray-800">Template de Message (Pour la Secrétaire)</h2>
          <p className="text-xs text-gray-500 mb-4">Utilisez [EVENT_NAME] et [LIST] pour injecter les données automatiquement.</p>
          <textarea 
            value={template} 
            onChange={(e) => setTemplate(e.target.value)} 
            className="w-full h-32 bg-gray-50 border border-gray-200 p-4 rounded-xl text-sm font-medium focus:outline-none focus:border-blue-500 resize-none"
          />
        </div>

        <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-200">
          <div className="flex justify-between items-center mb-6 border-b pb-3">
            <h2 className="font-bold text-xl text-gray-800">Événements Existants</h2>
            {editingEventId && <button onClick={resetForm} className="text-sm bg-blue-100 text-blue-600 px-4 py-2 rounded-lg font-bold hover:bg-blue-200 flex items-center gap-2"><X className="w-4 h-4" /> Annuler l'édition</button>}
          </div>
          
          {isLoadingEvents ? (
            <div className="flex justify-center p-4"><Loader2 className="w-6 h-6 animate-spin text-blue-500" /></div>
          ) : eventsList.length === 0 ? (
            <p className="text-gray-500 text-sm italic">Aucun événement trouvé.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {eventsList.map(evt => (
                <div key={evt.id} className={`p-5 border-2 rounded-2xl flex flex-col ${editingEventId === evt.id ? 'border-blue-500 bg-blue-50' : 'border-gray-100 bg-gray-50'}`}>
                  <h3 className="font-bold text-gray-900 truncate text-lg mb-2">{evt.event_name}</h3>
                  <p className="text-xs text-gray-500 flex items-center gap-1 mb-4"><Calendar className="w-3 h-3"/> {evt.event_date || "Date non définie"}</p>
                  
                  <div className="space-y-2 mt-auto">
                    <button onClick={() => copyDirectLink(evt.id)} className="w-full bg-indigo-100 text-indigo-700 py-2 rounded-lg text-xs font-bold hover:bg-indigo-200 flex items-center justify-center gap-2">
                      <LinkIcon className="w-4 h-4" /> Copier le Lien Direct
                    </button>
                    <button onClick={() => openPreview(evt)} className="w-full bg-blue-600 text-white py-2 rounded-lg text-xs font-bold hover:bg-blue-700 flex items-center justify-center gap-2">
                      <Eye className="w-4 h-4" /> Voir & Gérer la liste
                    </button>
                    <button onClick={() => sendReminder(evt)} disabled={isNotifying} className="w-full bg-yellow-500 text-yellow-950 py-2 rounded-lg text-xs font-bold hover:bg-yellow-600 flex items-center justify-center gap-2 disabled:opacity-70">
                      {isNotifying ? <Loader2 className="w-4 h-4 animate-spin"/> : <BellRing className="w-4 h-4" />} Envoyer un Rappel
                    </button>
                    <div className="flex gap-2 pt-2">
                      <button onClick={() => loadEventToEdit(evt)} className="flex-1 bg-white border border-gray-200 text-gray-700 py-2 rounded-lg text-xs font-bold hover:bg-gray-100 flex items-center justify-center gap-1"><Edit className="w-3 h-3" /> Éditer</button>
                      <button onClick={() => handleDeleteEvent(evt.id)} className="bg-red-50 text-red-600 px-3 py-2 rounded-lg hover:bg-red-100 flex items-center justify-center"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          <div className="xl:col-span-2 space-y-8">
            <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-200">
              <h2 className="font-bold text-xl mb-6 text-gray-800 border-b pb-3">{editingEventId ? "Édition de l'événement" : "Créer un événement"}</h2>
              <input type="text" placeholder="Nom de l'événement" className="w-full border-2 border-gray-100 p-4 rounded-xl mb-5 bg-gray-50 focus:border-blue-500 outline-none font-medium" value={eventName} onChange={e => setEventName(e.target.value)} />
              <textarea placeholder="Paragraphe principal..." className="w-full h-40 border-2 border-gray-100 p-4 rounded-xl mb-5 bg-gray-50 focus:border-blue-500 outline-none resize-none" value={mainParagraph} onChange={e => setMainParagraph(e.target.value)} />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
                <div><label className="text-xs font-bold text-gray-500 uppercase ml-1">Date</label><input type="text" placeholder="Ex: 20 Août à 18h" className="w-full border-2 border-gray-100 p-4 rounded-xl bg-gray-50 mt-1" value={eventDate} onChange={e => setEventDate(e.target.value)} /></div>
                <div><label className="text-xs font-bold text-gray-500 uppercase ml-1">Lieu</label><input type="text" placeholder="Ex: Hammamet Nord" className="w-full border-2 border-gray-100 p-4 rounded-xl bg-gray-50 mt-1" value={location} onChange={e => setLocation(e.target.value)} /></div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
                <div><label className="text-xs font-bold text-red-500 uppercase ml-1">Deadline d'envoi</label><input type="datetime-local" className="w-full border-2 border-red-100 p-4 rounded-xl bg-red-50 mt-1 text-red-900 font-bold" value={deadline} onChange={e => setDeadline(e.target.value)} required /></div>
                <div><label className="text-xs font-bold text-gray-500 uppercase ml-1">Limite Globale (Membres)</label><input type="number" placeholder="Ex: 50 (Vide si illimité)" className="w-full border-2 border-gray-100 p-4 rounded-xl bg-gray-50 mt-1 font-bold" value={totalMemberLimit} onChange={e => setTotalMemberLimit(e.target.value)} /></div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-indigo-900 to-blue-900 p-8 rounded-3xl shadow-lg border border-indigo-700">
              <h2 className="text-2xl font-black flex items-center gap-3 text-white mb-4"><Sparkles className="text-yellow-400 w-6 h-6" /> Assistant IA</h2>
              <textarea value={aiText} onChange={e => setAiText(e.target.value)} placeholder="Collez l'invitation ici..." className="w-full h-32 bg-white/10 border-2 border-indigo-400/50 p-4 rounded-xl mb-6 text-white placeholder-indigo-300 focus:outline-none focus:border-yellow-400 resize-none" />
              <button onClick={handleAIParsing} disabled={isParsing} className="w-full bg-yellow-400 hover:bg-yellow-500 text-yellow-900 font-black text-lg py-4 rounded-xl shadow-lg active:scale-95 disabled:opacity-70 flex justify-center items-center gap-2">
                {isParsing ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />} Auto-remplir avec l'IA
              </button>
            </div>
          </div>

          <div className="space-y-8">
            <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-200">
              <div className="flex justify-between items-center mb-6 border-b pb-3"><h2 className="font-bold text-xl text-gray-800">Programme & Limites</h2><button onClick={() => setParts([...parts, { name: "Nouveau", memberPrice: 0, guestPrice: 0, memberLimit: "", guestLimit: "" }])} className="bg-blue-100 text-blue-600 p-2 rounded-lg hover:bg-blue-200"><Plus className="w-5 h-5"/></button></div>
              <div className="space-y-6">
                {parts.map((part, index) => (
                  <div key={index} className="bg-gray-50 p-4 rounded-xl border border-gray-200 space-y-3 relative">
                    <button onClick={() => setParts(parts.filter((_, i) => i !== index))} className="absolute top-4 right-4 bg-red-50 text-red-500 p-2 rounded-lg"><Trash2 className="w-4 h-4" /></button>
                    
                    <input type="text" placeholder="Nom (ex: Soirée)" value={part.name} onChange={(e) => updatePart(index, 'name', e.target.value)} className="w-full border border-gray-300 p-2 rounded-lg text-sm font-bold pr-12" />
                    
                    <div className="grid grid-cols-2 gap-2">
                      <div><label className="text-[10px] uppercase font-bold text-gray-500">Prix Membre (DT)</label><input type="number" value={part.memberPrice} onChange={(e) => updatePart(index, 'memberPrice', e.target.value)} className="w-full border border-gray-300 p-2 rounded-lg text-sm font-semibold" /></div>
                      <div><label className="text-[10px] uppercase font-bold text-gray-500">Prix Invité (DT)</label><input type="number" value={part.guestPrice} onChange={(e) => updatePart(index, 'guestPrice', e.target.value)} className="w-full border border-gray-300 p-2 rounded-lg text-sm font-semibold" /></div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-2 pt-2 border-t border-gray-200">
                      <div><label className="text-[10px] uppercase font-bold text-blue-600">Max Membres</label><input type="number" placeholder="Illimité" value={part.memberLimit} onChange={(e) => updatePart(index, 'memberLimit', e.target.value)} className="w-full border border-blue-200 bg-blue-50 p-2 rounded-lg text-sm font-semibold" /></div>
                      <div><label className="text-[10px] uppercase font-bold text-orange-600">Max Invités</label><input type="number" placeholder="Illimité" value={part.guestLimit} onChange={(e) => updatePart(index, 'guestLimit', e.target.value)} className="w-full border border-orange-200 bg-orange-50 p-2 rounded-lg text-sm font-semibold" /></div>
                    </div>
                  </div>
                ))}
              </div>
              <hr className="my-6 border-gray-200" />
              <div className="flex items-center justify-between p-4 border-2 border-gray-100 rounded-xl bg-gray-50 mb-4">
                <span className="font-bold text-gray-700">Autoriser les invités ?</span>
                <input type="checkbox" className="w-6 h-6 rounded text-blue-600" checked={guestsAllowed} onChange={e => setGuestsAllowed(e.target.checked)} />
              </div>
              {guestsAllowed && (
                <div><label className="text-xs font-bold text-gray-500 uppercase">Limite Globale (Invités)</label><input type="number" placeholder="Ex: 20 (vide si illimité)" className="w-full border-2 border-gray-100 p-3 rounded-xl bg-gray-50 mt-1 font-bold" value={totalGuestLimit} onChange={e => setTotalGuestLimit(e.target.value)} /></div>
              )}
            </div>

            <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-200">
              <h2 className="font-bold text-xl mb-6 text-gray-800 border-b pb-3">Clubs Organisateurs</h2>
              <div className="h-64 overflow-y-auto border-2 border-gray-100 rounded-xl p-4 bg-gray-50 grid grid-cols-1 md:grid-cols-2 gap-3 custom-scrollbar">
                {INTERACT_CLUBS.map(club => (
                  <label key={club} className="flex items-center gap-3 cursor-pointer p-2 hover:bg-gray-200/50 rounded-lg">
                    <input type="checkbox" checked={selectedClubs.includes(club)} onChange={() => toggleClub(club)} className="w-5 h-5 text-blue-600 rounded border-gray-300" />
                    <span className="text-sm font-semibold text-gray-700">{club}</span>
                  </label>
                ))}
              </div>
            </div>

            <button onClick={handleSaveEvent} disabled={isSaving} className="bg-green-500 hover:bg-green-600 text-white w-full py-5 rounded-2xl font-black text-xl shadow-lg shadow-green-500/30 flex items-center justify-center gap-3">
              {isSaving ? <Loader2 className="w-6 h-6 animate-spin" /> : <Save className="w-6 h-6" />} {editingEventId ? "Mettre à jour" : "Publier l'Événement"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}