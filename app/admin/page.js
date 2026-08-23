"use client";
import { useState, useEffect } from "react";
import { Lock, Settings, Save, Copy, Plus, Trash2, BellRing, Loader2, Sparkles, Edit, X, Calendar } from "lucide-react";
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

  // Loading States
  const [isSaving, setIsSaving] = useState(false);
  const [isSubscribing, setIsSubscribing] = useState(false);
  const [isParsing, setIsParsing] = useState(false);
  const [isLoadingEvents, setIsLoadingEvents] = useState(false);

  // Event Management State
  const [eventsList, setEventsList] = useState([]);
  const [editingEventId, setEditingEventId] = useState(null);

  // Form State
  const [aiText, setAiText] = useState("");
  const [eventName, setEventName] = useState("");
  const [mainParagraph, setMainParagraph] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [deadline, setDeadline] = useState("");
  const [location, setLocation] = useState("");
  const [selectedClubs, setSelectedClubs] = useState([]);
  const [guestsAllowed, setGuestsAllowed] = useState(false);
  const [guestLimit, setGuestLimit] = useState(1);
  const [parts, setParts] = useState([{ name: "Programme", memberPrice: 0, guestPrice: 0 }]);
  const [template, setTemplate] = useState("Aslemaa ,\nVoici la liste des membres de l'ICTGC participant pour [EVENT_NAME]\n\n[LIST]\n\nBonne chance 🫶");

  // Fetch Events on Load
  const fetchEvents = async () => {
    setIsLoadingEvents(true);
    const { data, error } = await supabase.from('manual_events').select('*').order('created_at', { ascending: false });
    if (data) setEventsList(data);
    setIsLoadingEvents(false);
  };

  useEffect(() => {
    if (authenticated) fetchEvents();
  }, [authenticated]);

  const handleLogin = (e) => {
    if (e) e.preventDefault(); // Prevent page reload on form submit
    if (password === process.env.NEXT_PUBLIC_ADMIN_PASSWORD) {
      setAuthenticated(true);
    } else {
      alert("Mot de passe incorrect");
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
      
      // Strict Error Checking
      if (!response.ok) throw new Error(data.error || "Erreur API inconnue");
      
      if (data.eventName) setEventName(data.eventName);
      if (data.mainParagraph) setMainParagraph(data.mainParagraph);
      if (data.eventDate) setEventDate(data.eventDate);
      if (data.location) setLocation(data.location);
      if (data.deadline) setDeadline(data.deadline);
      if (data.hostClubs) setSelectedClubs(data.hostClubs);
      if (data.guestsAllowed !== undefined) setGuestsAllowed(data.guestsAllowed);
      if (data.guestLimit) setGuestLimit(data.guestLimit);
      if (data.parts && data.parts.length > 0) setParts(data.parts);
      
      alert("✅ Données extraites avec succès ! Veuillez vérifier les champs.");
    } catch (error) {
      console.error(error);
      alert("❌ Erreur lors de l'analyse par l'IA: " + error.message);
    } finally {
      setIsParsing(false);
    }
  };

  if (!authenticated) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
        <div className="bg-white p-10 rounded-[2rem] shadow-2xl max-w-md w-full text-center">
          <div className="bg-blue-50 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-8 shadow-inner">
            <Lock className="w-12 h-12 text-blue-600" />
          </div>
          <h2 className="text-3xl font-black text-gray-900 mb-2">Accès Sécurisé</h2>
          <p className="text-gray-500 mb-8 font-medium">Administration ICTGC</p>
          
          {/* Wrapped inputs in a form for password managers */}
          <form onSubmit={handleLogin}>
            <input 
              type="text" 
              name="username" 
              autoComplete="username" 
              value="admin" 
              readOnly 
              style={{ display: 'none' }} 
            />
            <input 
              type="password" 
              name="password"
              autoComplete="current-password"
              placeholder="Mot de passe..."
              className="w-full bg-gray-50 border-2 border-gray-200 p-4 rounded-2xl mb-6 text-center text-xl font-bold focus:border-blue-500 focus:bg-white outline-none"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black text-lg py-4 rounded-2xl shadow-xl active:scale-95">
              Déverrouiller
            </button>
          </form>
        </div>
      </div>
    );
  }

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
      const { error } = await supabase.from('admin_subscriptions').insert([{ endpoint: subData.endpoint, p256dh: subData.keys.p256dh, auth: subData.keys.auth }]);
      if (error) throw error;
      alert('✅ Notifications activées sur ce téléphone !');
    } catch (error) {
      alert("Erreur lors de l'activation des notifications.");
    } finally {
      setIsSubscribing(false);
    }
  };

  const handleSaveEvent = async () => {
    if (!eventName || !deadline) return alert("Le nom de l'événement et la date limite sont requis.");
    setIsSaving(true);
    
    const payload = {
      event_name: eventName,
      host_clubs: selectedClubs,
      event_date: eventDate,
      location: location,
      main_paragraph: mainParagraph,
      deadline: deadline,
      guests_allowed: guestsAllowed,
      guest_limit_per_member: guestsAllowed ? Number(guestLimit) : 0,
      event_parts: parts
    };

    let error;
    if (editingEventId) {
      const res = await supabase.from('manual_events').update(payload).eq('id', editingEventId);
      error = res.error;
    } else {
      const res = await supabase.from('manual_events').insert([payload]);
      error = res.error;
    }

    setIsSaving(false);
    
    if (error) {
      alert("Erreur de sauvegarde: " + error.message);
    } else {
      alert(editingEventId ? "✅ Événement mis à jour avec succès !" : "✅ Événement publié avec succès !");
      resetForm();
      fetchEvents();
    }
  };

  const handleDeleteEvent = async (id) => {
    if (!window.confirm("Êtes-vous sûr de vouloir supprimer cet événement ?")) return;
    const { error } = await supabase.from('manual_events').delete().eq('id', id);
    if (error) alert("Erreur lors de la suppression.");
    else {
      if (editingEventId === id) resetForm();
      fetchEvents();
    }
  };

  const loadEventToEdit = (evt) => {
    setEditingEventId(evt.id);
    setEventName(evt.event_name || "");
    setMainParagraph(evt.main_paragraph || "");
    setEventDate(evt.event_date || "");
    setDeadline(evt.deadline || "");
    setLocation(evt.location || "");
    setSelectedClubs(evt.host_clubs || []);
    setGuestsAllowed(evt.guests_allowed || false);
    setGuestLimit(evt.guest_limit_per_member || 1);
    setParts(evt.event_parts || [{ name: "Programme", memberPrice: 0, guestPrice: 0 }]);
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
    setGuestsAllowed(false);
    setGuestLimit(1);
    setParts([{ name: "Programme", memberPrice: 0, guestPrice: 0 }]);
    setAiText("");
  };

  const toggleClub = (club) => setSelectedClubs(prev => prev.includes(club) ? prev.filter(c => c !== club) : [...prev, club]);

  const updatePart = (index, field, value) => {
    const newParts = [...parts];
    newParts[index][field] = field === 'name' ? value : Number(value);
    setParts(newParts);
  };

  const generateAndCopy = async () => {
    let finalMessage = template.replace("[EVENT_NAME]", eventName || "l'événement").replace("[LIST]", "Liste simulée...");
    try {
      await navigator.clipboard.writeText(finalMessage);
      alert("✅ Template copié dans le presse-papiers !");
    } catch (err) {
      alert("❌ Erreur lors de la copie.");
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-4 md:p-8 font-sans">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-3xl shadow-sm border border-gray-200">
          <h1 className="text-3xl font-black flex items-center gap-3 text-gray-900">
            <Settings className="text-blue-600 w-8 h-8" /> Configuration Manuelle
          </h1>
          <button onClick={enableNotifications} disabled={isSubscribing} className="flex items-center gap-2 bg-gray-900 hover:bg-black text-white px-5 py-3 rounded-xl font-bold shadow-md active:scale-95 disabled:opacity-70">
            {isSubscribing ? <Loader2 className="w-5 h-5 text-yellow-400 animate-spin" /> : <BellRing className="w-5 h-5 text-yellow-400" />} 
            {isSubscribing ? "Activation..." : "Activer les Alertes"}
          </button>
        </div>

        {/* Existing Events Manager */}
        <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-200">
          <div className="flex justify-between items-center mb-6 border-b pb-3">
            <h2 className="font-bold text-xl text-gray-800">Événements Existants</h2>
            {editingEventId && (
              <button onClick={resetForm} className="text-sm bg-blue-100 text-blue-600 px-4 py-2 rounded-lg font-bold hover:bg-blue-200 flex items-center gap-2">
                <X className="w-4 h-4" /> Annuler l'édition
              </button>
            )}
          </div>
          
          {isLoadingEvents ? (
            <div className="flex items-center justify-center p-4"><Loader2 className="w-6 h-6 animate-spin text-blue-500" /></div>
          ) : eventsList.length === 0 ? (
            <p className="text-gray-500 text-sm italic">Aucun événement trouvé dans la base de données.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {eventsList.map(evt => (
                <div key={evt.id} className={`p-4 border-2 rounded-2xl ${editingEventId === evt.id ? 'border-blue-500 bg-blue-50' : 'border-gray-100 bg-gray-50'}`}>
                  <h3 className="font-bold text-gray-900 truncate">{evt.event_name}</h3>
                  <p className="text-xs text-gray-500 flex items-center gap-1 mt-1"><Calendar className="w-3 h-3"/> {evt.event_date || "Date non définie"}</p>
                  <div className="flex gap-2 mt-4">
                    <button onClick={() => loadEventToEdit(evt)} className="flex-1 bg-white border border-gray-200 text-gray-700 py-2 rounded-lg text-xs font-bold hover:bg-gray-100 flex items-center justify-center gap-1">
                      <Edit className="w-3 h-3" /> Éditer
                    </button>
                    <button onClick={() => handleDeleteEvent(evt.id)} className="bg-red-50 text-red-600 px-3 py-2 rounded-lg hover:bg-red-100 flex items-center justify-center">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* AI Integration */}
        <div className="bg-gradient-to-br from-indigo-900 to-blue-900 p-8 rounded-3xl shadow-lg border border-indigo-700">
          <h2 className="text-2xl font-black flex items-center gap-3 text-white mb-4">
            <Sparkles className="text-yellow-400 w-6 h-6" /> Assistant IA
          </h2>
          <p className="text-indigo-200 mb-6 text-sm font-medium">Collez le texte brut de l'invitation ici. L'IA va remplir tous les champs automatiquement pour vous.</p>
          <textarea 
            value={aiText} 
            onChange={e => setAiText(e.target.value)}
            placeholder="Chers amis, le club Interact organise sa cérémonie le..."
            className="w-full h-32 bg-white/10 border-2 border-indigo-400/50 p-4 rounded-xl mb-6 text-white placeholder-indigo-300 focus:outline-none focus:border-yellow-400 transition-colors resize-none"
          />
          <button 
            onClick={handleAIParsing} 
            disabled={isParsing}
            className="w-full bg-yellow-400 hover:bg-yellow-500 text-yellow-900 font-black text-lg py-4 rounded-xl shadow-lg active:scale-95 disabled:opacity-70 flex justify-center items-center gap-2">
            {isParsing ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
            {isParsing ? "Analyse en cours..." : "Auto-remplir avec l'IA"}
          </button>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          <div className="xl:col-span-2 space-y-8">
            <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-200">
              <h2 className="font-bold text-xl mb-6 text-gray-800 border-b pb-3">
                {editingEventId ? "Édition de l'événement" : "Créer un événement"}
              </h2>
              <input type="text" placeholder="Nom de l'événement" className="w-full border-2 border-gray-100 p-4 rounded-xl mb-5 bg-gray-50 focus:border-blue-500 outline-none font-medium" value={eventName} onChange={e => setEventName(e.target.value)} />
              <textarea placeholder="Paragraphe principal de l'invitation..." className="w-full h-40 border-2 border-gray-100 p-4 rounded-xl mb-5 bg-gray-50 focus:border-blue-500 outline-none resize-none" value={mainParagraph} onChange={e => setMainParagraph(e.target.value)} />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase ml-1">Date</label>
                  <input type="text" placeholder="Ex: 20 Août à 18h" className="w-full border-2 border-gray-100 p-4 rounded-xl bg-gray-50 focus:border-blue-500 outline-none mt-1" value={eventDate} onChange={e => setEventDate(e.target.value)} />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase ml-1">Lieu</label>
                  <input type="text" placeholder="Ex: Hammamet Nord" className="w-full border-2 border-gray-100 p-4 rounded-xl bg-gray-50 focus:border-blue-500 outline-none mt-1" value={location} onChange={e => setLocation(e.target.value)} />
                </div>
              </div>
              <div>
                <label className="text-xs font-bold text-red-500 uppercase ml-1">Deadline d'envoi</label>
                <input type="datetime-local" className="w-full border-2 border-red-100 p-4 rounded-xl bg-red-50 focus:border-red-500 outline-none mt-1 text-red-900 font-medium" value={deadline} onChange={e => setDeadline(e.target.value)} required />
              </div>
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
          </div>

          <div className="space-y-8">
            <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-200">
              <div className="flex justify-between items-center mb-6 border-b pb-3">
                <h2 className="font-bold text-xl text-gray-800">Programme & Prix</h2>
                <button onClick={() => setParts([...parts, { name: "Nouveau", memberPrice: 0, guestPrice: 0 }])} className="bg-blue-100 text-blue-600 p-2 rounded-lg hover:bg-blue-200"><Plus className="w-5 h-5"/></button>
              </div>
              <div className="space-y-6">
                {parts.map((part, index) => (
                  <div key={index} className="bg-gray-50 p-4 rounded-xl border border-gray-200 space-y-3">
                    <div className="flex gap-2">
                      <input type="text" placeholder="Nom (ex: Soirée)" value={part.name} onChange={(e) => updatePart(index, 'name', e.target.value)} className="flex-1 border border-gray-300 p-2 rounded-lg text-sm font-bold outline-none focus:border-blue-500" />
                      <button onClick={() => setParts(parts.filter((_, i) => i !== index))} className="bg-red-50 text-red-500 p-2 rounded-lg"><Trash2 className="w-4 h-4" /></button>
                    </div>
                    <div className="flex gap-2">
                      <div className="flex-1">
                        <label className="text-[10px] uppercase font-bold text-gray-500">Prix Interactien</label>
                        <input type="number" value={part.memberPrice} onChange={(e) => updatePart(index, 'memberPrice', e.target.value)} className="w-full border border-gray-300 p-2 rounded-lg text-sm font-semibold outline-none" />
                      </div>
                      <div className="flex-1">
                        <label className="text-[10px] uppercase font-bold text-gray-500">Prix Invité</label>
                        <input type="number" value={part.guestPrice} onChange={(e) => updatePart(index, 'guestPrice', e.target.value)} className="w-full border border-gray-300 p-2 rounded-lg text-sm font-semibold outline-none" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              <hr className="my-6 border-gray-200" />
              <div className="flex items-center justify-between p-4 border-2 border-gray-100 rounded-xl bg-gray-50 mb-4">
                <span className="font-bold text-gray-700">Autoriser les invités ?</span>
                <input type="checkbox" className="w-6 h-6 rounded text-blue-600 focus:ring-blue-500" checked={guestsAllowed} onChange={e => setGuestsAllowed(e.target.checked)} />
              </div>
              {guestsAllowed && (
                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase">Limite par membre</label>
                  <input type="number" className="w-full border-2 border-gray-100 p-3 rounded-xl bg-gray-50 mt-1 font-bold" value={guestLimit} onChange={e => setGuestLimit(e.target.value)} />
                </div>
              )}
            </div>

            <button onClick={handleSaveEvent} disabled={isSaving} className="bg-green-500 hover:bg-green-600 text-white w-full py-5 rounded-2xl font-black text-xl shadow-lg shadow-green-500/30 flex items-center justify-center gap-3 disabled:opacity-70">
              {isSaving ? <Loader2 className="w-6 h-6 animate-spin" /> : <Save className="w-6 h-6" />}
              {isSaving ? "Sauvegarde en cours..." : (editingEventId ? "Mettre à jour l'Événement" : "Publier l'Événement")}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}