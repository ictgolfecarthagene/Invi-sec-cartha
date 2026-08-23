"use client";
import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { Calendar, MapPin, Users, ChevronDown, ChevronUp, Loader2, CheckCircle } from "lucide-react";

export default function Home() {
  const [eventData, setEventData] = useState(null);
  const [members, setMembers] = useState([]); 
  const [expandedEvent, setExpandedEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [rsvpCount, setRsvpCount] = useState(0);

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
        const { data: events } = await supabase
          .from("manual_events")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(1);

        if (events && events.length > 0) {
          setEventData(events[0]);
          if (events[0].event_parts) {
            setSelectedParts(events[0].event_parts.map(p => p.name));
          }

          // Fetch how many members have already RSVP'd
          const { count } = await supabase
            .from("rsvps")
            .select("*", { count: "exact", head: true })
            .eq("event_id", events[0].id);
            
          setRsvpCount(count || 0);
        }

        const { data: membersList } = await supabase
          .from("members")
          .select("id, full_name")
          .order("full_name", { ascending: true });

        if (membersList) setMembers(membersList);
      } catch (err) {
        console.error("Error loading:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const togglePart = (partName) => {
    setSelectedParts(prev =>
      prev.includes(partName) ? prev.filter(p => p !== partName) : [...prev, partName]
    );
  };

  const calculateTotal = () => {
    if (!eventData || !eventData.event_parts) return 0;
    let total = 0;
    
    eventData.event_parts.forEach(part => {
      if (selectedParts.includes(part.name)) total += Number(part.memberPrice || 0);
    });

    if (guestName.trim() && eventData.guests_allowed) {
      eventData.event_parts.forEach(part => {
        if (selectedParts.includes(part.name)) total += Number(part.guestPrice || 0);
      });
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

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-gray-100">
      <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
    </div>
  );

  if (!eventData) return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-gray-100">
      <p className="text-gray-500 font-medium">Aucun événement actif pour le moment.</p>
    </div>
  );

  const isFull = eventData.member_limit !== null && rsvpCount >= eventData.member_limit;

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 relative to-gray-100 p-4 md:p-8 font-sans">
      <div className="max-w-2xl mx-auto">
        <header className="flex items-center gap-4 mb-10 bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
          <img src="/logo.png" alt="Logo" className="w-16 h-16 rounded-full object-cover shadow-sm border border-gray-100" onError={(e) => { e.target.style.display = 'none'; }} />
          <div>
            <h1 className="text-2xl font-extrabold text-blue-900 tracking-tight">Portail ICTGC</h1>
            <p className="text-sm text-gray-500 font-medium">Réservation aux événements Interact</p>
          </div>
        </header>

        <div className="space-y-6">
          <div className="bg-white rounded-3xl shadow-lg border border-gray-100 overflow-hidden transition-all duration-300 hover:shadow-xl">
            <div className="p-6">
              
              <div className="flex justify-between items-start mb-4">
                <span className="bg-red-100 text-red-700 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wide">
                  Deadline: {eventData.deadline ? new Date(eventData.deadline).toLocaleDateString("fr-FR", { day: 'numeric', month: 'short' }) : 'Bientôt'}
                </span>
                <div className="flex gap-2">
                  {isFull && <span className="bg-orange-100 text-orange-700 text-xs font-bold px-3 py-1 rounded-full uppercase">Complet</span>}
                  <span className="bg-blue-100 text-blue-700 text-xs font-bold px-3 py-1 rounded-full uppercase">Nouveau</span>
                </div>
              </div>
              
              <h2 className="text-2xl font-black text-gray-900 leading-tight">{eventData.event_name}</h2>
              {eventData.host_clubs?.length > 0 && (
                <p className="text-md text-gray-500 mb-6 font-medium">{eventData.host_clubs.join(" & ")}</p>
              )}

              <div className="flex flex-col gap-3 text-sm text-gray-700 mb-6">
                <div className="flex items-center gap-2"><Calendar className="w-5 h-5 text-blue-500" /> {eventData.event_date}</div>
                <div className="flex items-center gap-2"><MapPin className="w-5 h-5 text-red-500" /> {eventData.location}</div>
                <div className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-green-500" /> 
                  <span>
                    {eventData.guests_allowed ? `Invités Autorisés` : `Interactiens Uniquement`}
                    {eventData.member_limit !== null && ` • ${Math.max(0, eventData.member_limit - rsvpCount)} places restantes`}
                  </span>
                </div>
              </div>

              {eventData.main_paragraph && (
                <>
                  <button onClick={() => setExpandedEvent(expandedEvent === 1 ? null : 1)} className="flex items-center justify-between w-full p-3 bg-gray-50 hover:bg-gray-100 rounded-xl text-sm font-semibold text-gray-700 transition-colors">
                    Lire le message complet de l'invitation
                    {expandedEvent === 1 ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                  </button>
                  {expandedEvent === 1 && (
                    <div className="mt-3 p-4 bg-gray-50 rounded-xl text-xs text-gray-600 whitespace-pre-wrap leading-relaxed border border-gray-200">
                      {eventData.main_paragraph.replace(/\\n/g, "\n")}
                    </div>
                  )}
                </>
              )}

              <hr className="my-6 border-gray-100" />

              {submitted ? (
                <div className="p-6 bg-green-50 border border-green-200 rounded-2xl text-center space-y-2">
                  <CheckCircle className="w-10 h-10 text-green-600 mx-auto" />
                  <h3 className="text-lg font-bold text-green-900">Présence confirmée !</h3>
                  <p className="text-sm text-green-700">Votre réservation a été enregistrée.</p>
                </div>
              ) : isFull ? (
                <div className="p-6 bg-orange-50 border border-orange-200 rounded-2xl text-center space-y-2">
                  <Users className="w-10 h-10 text-orange-600 mx-auto" />
                  <h3 className="text-lg font-bold text-orange-900">Événement Complet</h3>
                  <p className="text-sm text-orange-700">La limite de {eventData.member_limit} participants a été atteinte.</p>
                </div>
              ) : (
                <form className="space-y-4" onSubmit={handleConfirm}>
                  <select value={selectedMember} onChange={(e) => setSelectedMember(e.target.value)} className="w-full border-2 border-gray-200 p-3.5 rounded-xl bg-gray-50 focus:border-blue-500 focus:ring-0 font-medium text-gray-700 outline-none transition-all" required>
                    <option value="">Sélectionnez votre nom...</option>
                    {members.map(m => <option key={m.id} value={m.full_name}>{m.full_name}</option>)}
                  </select>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {eventData.event_parts?.map((part) => {
                      const isChecked = selectedParts.includes(part.name);
                      return (
                        <label key={part.name} className="flex flex-col items-center gap-1 p-4 border-2 border-gray-100 rounded-xl cursor-pointer hover:border-blue-500 transition-all has-[:checked]:border-blue-600 has-[:checked]:bg-blue-50 text-center">
                          <input type="checkbox" checked={isChecked} onChange={() => togglePart(part.name)} className="w-5 h-5 text-blue-600 rounded-md mb-2" /> 
                          <span className="font-bold text-gray-700 text-sm">{part.name}</span>
                          <div className="flex flex-col text-[11px] text-gray-500">
                            <span>Interactien: {part.memberPrice} DT</span>
                            {eventData.guests_allowed && <span>Invité: {part.guestPrice} DT</span>}
                          </div>
                        </label>
                      );
                    })}
                  </div>

                  {eventData.guests_allowed && (
                    <input type="text" placeholder="Nom de votre invité (Optionnel)" value={guestName} onChange={e => setGuestName(e.target.value)} className="w-full border-2 border-gray-200 p-3.5 rounded-xl bg-gray-50 focus:border-blue-500 outline-none font-medium" />
                  )}
                  
                  <button type="submit" disabled={isSubmitting} className="bg-blue-600 hover:bg-blue-700 text-white font-black text-lg px-4 py-4 rounded-xl w-full shadow-lg shadow-blue-600/30 transition-all transform hover:-translate-y-1 disabled:transform-none disabled:opacity-70 flex justify-center items-center">
                    {isSubmitting ? <Loader2 className="w-6 h-6 animate-spin" /> : `Confirmer (${calculateTotal()} DT)`}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}