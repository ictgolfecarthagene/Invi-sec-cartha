"use client";
import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { Calendar, MapPin, Users, ChevronDown, ChevronUp, Loader2, CheckCircle, Lock } from "lucide-react";

export default function Home() {
  const [eventData, setEventData] = useState(null);
  const [members, setMembers] = useState([]); 
  const [expandedEvent, setExpandedEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // RSVP Tracking
  const [membersCount, setMembersCount] = useState(0);
  const [guestsCount, setGuestsCount] = useState(0);

  // Form State
  const [selectedMember, setSelectedMember] = useState("");
  const [selectedParts, setSelectedParts] = useState([]);
  const [guestName, setGuestName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        const { data: events } = await supabase.from("manual_events").select("*").order("created_at", { ascending: false }).limit(1);

        if (events && events.length > 0) {
          setEventData(events[0]);
          if (events[0].event_parts) setSelectedParts(events[0].event_parts.map(p => p.name));

          // Calculate RSVPs vs Limits
          const { data: rsvps } = await supabase.from("rsvps").select("*").eq("event_id", events[0].id);
          if (rsvps) {
            setMembersCount(rsvps.length);
            setGuestsCount(rsvps.filter(r => r.guest_name && r.guest_name.trim() !== "").length);
          }
        }

        const { data: membersList } = await supabase.from("members").select("id, full_name").order("full_name", { ascending: true });
        if (membersList) setMembers(membersList);

      } catch (err) {
        console.error("Error loading:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const togglePart = (partName) => setSelectedParts(prev => prev.includes(partName) ? prev.filter(p => p !== partName) : [...prev, partName]);

  const calculateTotal = () => {
    if (!eventData || !eventData.event_parts) return 0;
    let total = 0;
    eventData.event_parts.forEach(part => { if (selectedParts.includes(part.name)) total += Number(part.memberPrice || 0); });
    if (guestName.trim() && eventData.guests_allowed) {
      eventData.event_parts.forEach(part => { if (selectedParts.includes(part.name)) total += Number(part.guestPrice || 0); });
    }
    return total;
  };

  const handleConfirm = async (e) => {
    e.preventDefault();
    if (!selectedMember) return alert("Veuillez sélectionner votre nom.");
    if (selectedParts.length === 0) return alert("Veuillez sélectionner au moins une partie.");

    setIsSubmitting(true);
    const { error } = await supabase.from("rsvps").insert([{
      event_id: eventData.id,
      member_name: selectedMember,
      selected_parts: selectedParts,
      guest_name: guestName.trim() || null,
      total_price: calculateTotal()
    }]);
    setIsSubmitting(false);

    if (error) alert("Erreur: " + error.message);
    else setSubmitted(true);
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-gray-50"><Loader2 className="w-8 h-8 text-blue-600 animate-spin" /></div>;
  if (!eventData) return <div className="min-h-screen flex items-center justify-center bg-gray-50"><p className="text-gray-500 font-medium">Aucun événement actif.</p></div>;

  // Enforcements
  const isPastDeadline = new Date() > new Date(eventData.deadline);
  const isMembersFull = eventData.member_limit !== null && membersCount >= eventData.member_limit;
  const isGuestsFull = eventData.total_guest_limit !== null && guestsCount >= eventData.total_guest_limit;
  
  // Entire form is locked if deadline passed OR member slots are full
  const isFormLocked = isPastDeadline || isMembersFull;

  return (
    <main className="min-h-screen bg-slate-50 py-10 px-4 font-sans flex flex-col items-center">
      <div className="max-w-xl w-full bg-white p-6 rounded-3xl shadow-sm border border-gray-200 mb-6 flex items-center gap-4">
        <img src="/logo.png" alt="Logo" className="w-16 h-16 rounded-full object-cover border border-gray-100" onError={(e) => { e.target.style.display = 'none'; }} />
        <div>
          <h1 className="text-2xl font-black text-blue-900 tracking-tight">Portail ICTGC</h1>
          <p className="text-sm text-gray-500 font-medium">Réservation aux événements</p>
        </div>
      </div>

      <div className="max-w-xl w-full bg-white p-8 rounded-3xl shadow-sm border border-gray-200 space-y-6">
        <div className="flex justify-between items-start mb-4">
          <span className={`text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wide ${isPastDeadline ? 'bg-gray-100 text-gray-600' : 'bg-red-50 text-red-600'}`}>
            Deadline: {eventData.deadline ? new Date(eventData.deadline).toLocaleDateString("fr-FR", { day: 'numeric', month: 'short', hour: '2-digit', minute:'2-digit' }) : 'Bientôt'}
          </span>
          {isPastDeadline && <span className="bg-gray-800 text-white text-xs font-bold px-3 py-1 rounded-full uppercase flex items-center gap-1"><Lock className="w-3 h-3"/> Fermé</span>}
        </div>
        
        <h2 className="text-3xl font-black text-gray-900 leading-tight">{eventData.event_name}</h2>
        {eventData.host_clubs?.length > 0 && <p className="text-md text-gray-500 font-medium">{eventData.host_clubs.join(" & ")}</p>}

        <div className="space-y-2 text-sm text-gray-700 font-medium">
          <div className="flex items-center gap-2"><Calendar className="w-5 h-5 text-blue-500" /> {eventData.event_date}</div>
          <div className="flex items-center gap-2"><MapPin className="w-5 h-5 text-red-500" /> {eventData.location}</div>
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-green-500" /> 
            <span>
              {eventData.guests_allowed ? `Invités Autorisés` : `Membres Uniquement`}
              {eventData.member_limit !== null && ` • ${Math.max(0, eventData.member_limit - membersCount)} places restantes`}
            </span>
          </div>
        </div>

        {/* Google Maps Embed */}
        {eventData.location && (
          <div className="mt-4 rounded-xl overflow-hidden border border-gray-200 shadow-inner">
            <iframe 
              width="100%" height="200" frameBorder="0" style={{ border: 0 }} allowFullScreen
              src={`https://www.google.com/maps?q=${encodeURIComponent(eventData.location)}&output=embed`}
            ></iframe>
          </div>
        )}

        {eventData.main_paragraph && (
          <div className="border border-gray-200 rounded-2xl overflow-hidden mt-6">
            <button onClick={() => setExpandedEvent(expandedEvent === 1 ? null : 1)} className="w-full p-4 bg-gray-50 flex items-center justify-between text-sm font-bold text-gray-700 hover:bg-gray-100 transition-colors">
              Lire l'invitation complète {expandedEvent === 1 ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
            {expandedEvent === 1 && <div className="p-4 bg-white text-sm text-gray-700 whitespace-pre-line border-t">{eventData.main_paragraph.replace(/\\n/g, "\n")}</div>}
          </div>
        )}

        <hr className="my-6 border-gray-100" />

        {submitted ? (
          <div className="p-6 bg-green-50 border border-green-200 rounded-2xl text-center space-y-2">
            <CheckCircle className="w-10 h-10 text-green-600 mx-auto" />
            <h3 className="text-lg font-bold text-green-900">Présence confirmée !</h3>
          </div>
        ) : isFormLocked ? (
          <div className="p-6 bg-gray-50 border border-gray-200 rounded-2xl text-center space-y-2">
            <Lock className="w-10 h-10 text-gray-400 mx-auto" />
            <h3 className="text-lg font-bold text-gray-700">{isPastDeadline ? "Inscriptions Fermées" : "Événement Complet"}</h3>
            <p className="text-sm text-gray-500">{isPastDeadline ? "La date limite de confirmation est dépassée." : "Toutes les places ont été réservées."}</p>
          </div>
        ) : (
          <form className="space-y-4" onSubmit={handleConfirm}>
            <select value={selectedMember} onChange={(e) => setSelectedMember(e.target.value)} className="w-full border-2 border-gray-200 p-4 rounded-xl bg-gray-50 focus:border-blue-500 font-medium text-gray-700 outline-none" required>
              <option value="">Sélectionnez votre nom...</option>
              {members.map(m => <option key={m.id} value={m.full_name}>{m.full_name}</option>)}
            </select>

            <div className="grid grid-cols-2 gap-3">
              {eventData.event_parts?.map((part) => {
                const isChecked = selectedParts.includes(part.name);
                return (
                  <label key={part.name} className={`flex flex-col items-center justify-center p-4 border-2 rounded-xl cursor-pointer transition-all ${isChecked ? 'border-blue-600 bg-blue-50' : 'border-gray-100 hover:border-blue-300'}`}>
                    <input type="checkbox" checked={isChecked} onChange={() => togglePart(part.name)} className="w-5 h-5 text-blue-600 mb-2" /> 
                    <span className="font-bold text-gray-700 text-sm text-center">{part.name}</span>
                    <span className="text-xs text-blue-600 font-semibold mt-1">{part.memberPrice} DT</span>
                  </label>
                );
              })}
            </div>

            {eventData.guests_allowed && (
              isGuestsFull ? (
                <div className="p-3 bg-orange-50 border border-orange-200 rounded-xl text-center text-xs font-bold text-orange-700">La limite d'invités pour cet événement a été atteinte.</div>
              ) : (
                <input type="text" placeholder="Nom de votre invité (Optionnel)" value={guestName} onChange={e => setGuestName(e.target.value)} className="w-full border-2 border-gray-200 p-4 rounded-xl bg-gray-50 focus:border-blue-500 outline-none font-medium" />
              )
            )}
            
            <button type="submit" disabled={isSubmitting} className="bg-blue-600 hover:bg-blue-700 text-white font-black text-lg px-4 py-4 rounded-xl w-full shadow-lg transition-all flex justify-center items-center">
              {isSubmitting ? <Loader2 className="w-6 h-6 animate-spin" /> : `Confirmer (${calculateTotal()} DT)`}
            </button>
          </form>
        )}
      </div>
    </main>
  );
}