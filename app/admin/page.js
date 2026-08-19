"use client";
import { useState } from "react";
import { Lock, Settings, Save, Copy, Plus, Trash2, BellRing } from "lucide-react";
import { supabase } from "../../lib/supabase";

const INTERACT_CLUBS = [
  "IC Tunis Medina", "IC Mirabel Tunis", "IC North Africa", "IC Pilote Ariana", "IC Bloom City", "IC Big South Tunis", "IC Tunis Cosmopolitan", "IC Tunis Doyen", "IC Tunis Inner City", "IC Tunis El Bey", "IC Anastasia", "IC Ennaser", "IC Tunis Golden Eagles", "IC Rey De Carthago", "IC Tinast Glory", "IC Didon Amilcar", "IC Tunis Golfe", "IC Opportunity", "IC Aquatic North", "IC Tunis Moon City", "IC Tunis Les Berges Du Lac", "IC Tunis Hannibal", "IC Amilcar Sidibousaid", "IC Sidibousaid", "IC Tunis César", "IC Carthage La Renaissance", "IC Tunis Belvédère", "IC Ariana Tines", "IC Ariana La Rose", "IC Saint Germain", "IC Maxula Prates", "IC Tunis Golfe Carthagène", "IC Megrine", "IC Tunis Amilcar", "IC Hammam Lif", "IC Boumhel El Bassatine", "IC Hammamet", "IC Nabeul Neapolis", "IC Graces El Mourouj", "IC Pragma Sousse", "IC Sousse", "IC Kairouan", "IC Ruspina Monastir", "IC Monastir", "IC Sfax Doyen", "IC Sfax Métropole", "IC Sfax Flambeau", "IC Sfax Sindbad", "IC Sfax Tamaris", "IC Gabes Oasis", "IC Djerba Flamingo"
];

// Utility function required for Web Push Notifications
const urlBase64ToUint8Array = (base64String) => {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding).replace(/\-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
};

export default function AdminDashboard() {
  // Authentication State
  const [password, setPassword] = useState("");
  const [authenticated, setAuthenticated] = useState(false);

  // Form State
  const [eventName, setEventName] = useState("");
  const [mainParagraph, setMainParagraph] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [deadline, setDeadline] = useState("");
  const [location, setLocation] = useState("");
  const [selectedClubs, setSelectedClubs] = useState([]);
  const [parts, setParts] = useState(["Cérémonie", "Soirée"]);
  const [guestsAllowed, setGuestsAllowed] = useState(false);
  const [guestLimit, setGuestLimit] = useState(1);
  const [memberPrice, setMemberPrice] = useState(10);
  const [guestPrice, setGuestPrice] = useState(20);
  const [template, setTemplate] = useState("Aslemaa ,\nVoici la liste des membres de l'ICTGC participant pour [EVENT_NAME]\n\n[LIST]\n\nBonne chance 🫶");

  // Authentication View
  if (!authenticated) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4 selection:bg-blue-500 selection:text-white">
        <div className="bg-white p-10 rounded-[2rem] shadow-2xl max-w-md w-full text-center border border-gray-100">
          <div className="bg-blue-50 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-8 shadow-inner">
            <Lock className="w-12 h-12 text-blue-600" />
          </div>
          <h2 className="text-3xl font-black text-gray-900 mb-2 tracking-tight">Accès Sécurisé</h2>
          <p className="text-gray-500 mb-8 font-medium">Administration ICTGC</p>
          
          <input 
            type="password" 
            placeholder="Mot de passe..."
            className="w-full bg-gray-50 border-2 border-gray-200 p-4 rounded-2xl mb-6 text-center text-xl font-bold focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10 outline-none transition-all"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && password === "secretaire2026" && setAuthenticated(true)}
          />
          <button 
            onClick={() => password === "secretaire2026" ? setAuthenticated(true) : alert("Mot de passe incorrect")} 
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black text-lg py-4 rounded-2xl transition-all shadow-xl shadow-blue-600/20 active:scale-95">
            Déverrouiller
          </button>
        </div>
      </div>
    );
  }

  // Push Notification Setup
  const enableNotifications = async () => {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      alert("Les notifications Push ne sont pas supportées sur ce navigateur.");
      return;
    }
    try {
      const registration = await navigator.serviceWorker.register('/sw.js');
      const permission = await window.Notification.requestPermission();
      if (permission !== 'granted') throw new Error('Permission refusée');

      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY)
      });

      const subData = JSON.parse(JSON.stringify(subscription));

      await supabase.from('admin_subscriptions').insert([{
        endpoint: subData.endpoint,
        p256dh: subData.keys.p256dh,
        auth: subData.keys.auth
      }]);

      alert('✅ Notifications activées sur ce téléphone !');
    } catch (error) {
      console.error(error);
      alert("Erreur lors de l'activation des notifications.");
    }
  };

  // Database Save
  const handleSaveEvent = async () => {
    if (!eventName || !deadline) {
      alert("Veuillez au moins remplir le nom de l'événement et la date limite.");
      return;
    }

    const { error } = await supabase.from('manual_events').insert([{
      event_name: eventName,
      host_clubs: selectedClubs,
      event_date: eventDate,
      location: location,
      main_paragraph: mainParagraph,
      deadline: deadline,
      member_price: memberPrice,
      guest_price: guestPrice,
      guests_allowed: guestsAllowed,
      guest_limit_per_member: guestLimit,
      event_parts: parts
    }]);

    if (error) alert("Erreur de sauvegarde: " + error.message);
    else alert("✅ Événement publié avec succès !");
  };

  const toggleClub = (club) => {
    setSelectedClubs(prev => 
      prev.includes(club) ? prev.filter(c => c !== club) : [...prev, club]
    );
  };

  const generateAndCopy = () => {
    const simulatedRSVPs = [
      { type: "Membre", name: "Yessine Ben Fraj (Cérémonie & Soirée)" },
      { type: "Invité", name: "Yassou (Soirée)" }
    ];

    let listText = simulatedRSVPs.map(r => `${r.type} :\n- ${r.name}`).join("\n\n");
    let finalMessage = template.replace("[EVENT_NAME]", eventName || "l'événement").replace("[LIST]", listText);
    
    navigator.clipboard.writeText(finalMessage);
    alert("✅ Liste copiée dans le presse-papiers !");
  };

  return (
    <div className="min-h-screen bg-gray-100 p-4 md:p-8 font-sans">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-3xl shadow-sm border border-gray-200">
          <h1 className="text-3xl font-black flex items-center gap-3 text-gray-900">
            <Settings className="text-blue-600 w-8 h-8" /> Configuration Manuelle
          </h1>
          <button onClick={enableNotifications} className="flex items-center justify-center gap-2 bg-gray-900 hover:bg-black text-white px-5 py-3 rounded-xl font-bold shadow-md transition-all active:scale-95">
            <BellRing className="w-5 h-5 text-yellow-400" /> Activer les Alertes
          </button>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          
          {/* LEFT COLUMN: Main Form */}
          <div className="xl:col-span-2 space-y-8">
            <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-200">
              <h2 className="font-bold text-xl mb-6 text-gray-800 border-b pb-3">Informations Générales</h2>
              <input type="text" placeholder="Nom de l'événement" className="w-full border-2 border-gray-100 p-4 rounded-xl mb-5 bg-gray-50 focus:bg-white focus:border-blue-500 outline-none transition-colors font-medium text-lg" value={eventName} onChange={e => setEventName(e.target.value)} />
              <textarea placeholder="Paragraphe principal de l'invitation..." className="w-full h-40 border-2 border-gray-100 p-4 rounded-xl mb-5 bg-gray-50 focus:bg-white focus:border-blue-500 outline-none transition-colors resize-none" value={mainParagraph} onChange={e => setMainParagraph(e.target.value)} />
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wide ml-1">Date de l'événement</label>
                  <input type="text" placeholder="Ex: 20 Août 2026 à 18h" className="w-full border-2 border-gray-100 p-4 rounded-xl bg-gray-50 focus:border-blue-500 outline-none mt-1" value={eventDate} onChange={e => setEventDate(e.target.value)} />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wide ml-1">Lieu (Nom ou lien Maps)</label>
                  <input type="text" placeholder="Ex: Hammamet Nord" className="w-full border-2 border-gray-100 p-4 rounded-xl bg-gray-50 focus:border-blue-500 outline-none mt-1" value={location} onChange={e => setLocation(e.target.value)} />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-red-500 uppercase tracking-wide ml-1">Deadline d'envoi (Requis pour alertes)</label>
                <input type="datetime-local" className="w-full border-2 border-red-100 p-4 rounded-xl bg-red-50/50 focus:border-red-500 outline-none mt-1 text-red-900 font-medium" value={deadline} onChange={e => setDeadline(e.target.value)} required />
              </div>
            </div>

            <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-200">
              <h2 className="font-bold text-xl mb-6 text-gray-800 border-b pb-3">Clubs Organisateurs</h2>
              <div className="h-64 overflow-y-auto border-2 border-gray-100 rounded-xl p-4 bg-gray-50 grid grid-cols-1 md:grid-cols-2 gap-3 custom-scrollbar">
                {INTERACT_CLUBS.map(club => (
                  <label key={club} className="flex items-center gap-3 cursor-pointer p-2 hover:bg-gray-200/50 rounded-lg transition-colors">
                    <input type="checkbox" checked={selectedClubs.includes(club)} onChange={() => toggleClub(club)} className="w-5 h-5 text-blue-600 rounded border-gray-300 focus:ring-blue-500" />
                    <span className="text-sm font-semibold text-gray-700">{club}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: Settings & Export */}
          <div className="space-y-8">
            <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-200">
              <h2 className="font-bold text-xl mb-6 text-gray-800 border-b pb-3">Prix & Invités</h2>
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase">Prix Membre</label>
                  <div className="relative mt-1">
                    <input type="number" className="w-full border-2 border-gray-100 p-3 rounded-xl bg-gray-50 font-bold" value={memberPrice} onChange={e => setMemberPrice(e.target.value)} />
                    <span className="absolute right-4 top-3 text-gray-400 font-bold">DT</span>
                  </div>
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase">Prix Invité</label>
                  <div className="relative mt-1">
                    <input type="number" className="w-full border-2 border-gray-100 p-3 rounded-xl bg-gray-50 font-bold" value={guestPrice} onChange={e => setGuestPrice(e.target.value)} />
                    <span className="absolute right-4 top-3 text-gray-400 font-bold">DT</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between p-4 border-2 border-gray-100 rounded-xl bg-gray-50 mb-4">
                <span className="font-bold text-gray-700">Autoriser les invités ?</span>
                <input type="checkbox" className="w-6 h-6 rounded text-blue-600 focus:ring-blue-500" checked={guestsAllowed} onChange={e => setGuestsAllowed(e.target.checked)} />
              </div>

              {guestsAllowed && (
                <div className="animate-in fade-in slide-in-from-top-2">
                  <label className="text-xs font-bold text-gray-500 uppercase">Limite par membre</label>
                  <input type="number" className="w-full border-2 border-gray-100 p-3 rounded-xl bg-gray-50 mt-1 font-bold" value={guestLimit} onChange={e => setGuestLimit(e.target.value)} />
                </div>
              )}
            </div>

            <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-200">
              <div className="flex justify-between items-center mb-6 border-b pb-3">
                <h2 className="font-bold text-xl text-gray-800">Programme</h2>
                <button onClick={() => setParts([...parts, "Nouvelle Option"])} className="bg-blue-100 text-blue-600 p-2 rounded-lg hover:bg-blue-200 transition-colors"><Plus className="w-5 h-5"/></button>
              </div>
              <div className="space-y-3">
                {parts.map((part, index) => (
                  <div key={index} className="flex gap-2 animate-in fade-in">
                    <input 
                      type="text" 
                      value={part} 
                      onChange={(e) => {
                        const newParts = [...parts];
                        newParts[index] = e.target.value;
                        setParts(newParts);
                      }}
                      className="flex-1 border-2 border-gray-100 p-3 rounded-xl bg-gray-50 text-sm font-semibold focus:border-blue-500 outline-none" 
                    />
                    <button onClick={() => setParts(parts.filter((_, i) => i !== index))} className="bg-red-50 text-red-500 p-3 rounded-xl hover:bg-red-100 transition-colors"><Trash2 className="w-5 h-5" /></button>
                  </div>
                ))}
              </div>
            </div>

            <button onClick={handleSaveEvent} className="bg-green-500 hover:bg-green-600 text-white w-full py-5 rounded-2xl font-black text-xl shadow-lg shadow-green-500/30 flex items-center justify-center gap-3 transition-all active:scale-95">
              <Save className="w-6 h-6" /> Publier l'Événement
            </button>

            <div className="bg-gradient-to-br from-blue-600 to-blue-800 p-8 rounded-3xl shadow-lg border border-blue-500 text-white">
              <h2 className="font-black text-xl mb-4 text-blue-50">Template d'Export</h2>
              <textarea 
                value={template} 
                onChange={e => setTemplate(e.target.value)}
                className="w-full h-32 bg-blue-900/40 border border-blue-500/50 p-4 rounded-xl mb-6 text-sm font-medium text-blue-50 placeholder-blue-300 focus:outline-none focus:border-white transition-colors resize-none"
              />
              <button onClick={generateAndCopy} className="flex items-center justify-center gap-2 bg-white text-blue-900 hover:bg-gray-50 w-full py-4 rounded-xl font-black shadow-md transition-all active:scale-95">
                <Copy className="w-5 h-5" /> Copier la Liste Finale
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}