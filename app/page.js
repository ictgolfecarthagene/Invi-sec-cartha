"use client";
import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { supabase } from "../lib/supabase";
import { Calendar, MapPin, Users, ChevronDown, ChevronUp, Loader2, CheckCircle, Lock, Info, ExternalLink } from "lucide-react";

function EventCard({ eventData, members }) {
  const [expandedEvent, setExpandedEvent] = useState(null);
  
  const [totalMembersCount, setTotalMembersCount] = useState(0);
  const [totalGuestsCount, setTotalGuestsCount] = useState(0);
  const [partCounts, setPartCounts] = useState({}); 

  const [selectedMember, setSelectedMember] = useState("");
  const [selectedParts, setSelectedParts] = useState([]);
  const [guestName, setGuestName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    async function loadRSVPs() {
      const { data: rsvps } = await supabase.from("rsvps").select("*").eq("event_id", eventData.id);
      if (rsvps) {
        // Only count confirmed members for capacity limits
        const confirmedRsvps = rsvps.filter(r => !r.is_waitlist);
        setTotalMembersCount(confirmedRsvps.length);
        setTotalGuestsCount(confirmedRsvps.filter(r => r.guest_name && r.guest_name.trim() !== "").length);

        const counts = {};
        confirmedRsvps.forEach(r => {
           if (Array.isArray(r.selected_parts)) {
             r.selected_parts.forEach(p => {
                if (!counts[p]) counts[p] = { members: 0, guests: 0 };
                counts[p].members += 1;
                if (r.guest_name) counts[p].guests += 1;
             });
           }
        });
        setPartCounts(counts);
      }
      
      if (eventData.event_parts) {
        setSelectedParts(eventData.event_parts.map(p => p.name));
      }
    }
    loadRSVPs();
  }, [eventData]);

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

  const isTotalMembersFull = eventData.total_member_limit !== null && totalMembersCount >= eventData.total_member_limit;
  const isTotalGuestsFull = eventData.total_guest_limit !== null && totalGuestsCount >= eventData.total_guest_limit;

  const handleConfirm = async (e) => {
    e.preventDefault();
    if (!selectedMember) return alert("Veuillez entrer et sélectionner votre nom dans la liste.");
    
    const memberExists = members.find(m => m.full_name === selectedMember);
    if (!memberExists) return alert("Veuillez sélectionner un nom valide dans la liste déroulante.");

    if (selectedParts.length === 0) return alert("Veuillez sélectionner au moins une partie.");

    setIsSubmitting(true);
    // Add to waitlist automatically if full
    const isWaitlist = isTotalMembersFull;

    const { error } = await supabase.from("rsvps").insert([{
      event_id: eventData.id,
      member_name: selectedMember,
      selected_parts: selectedParts,
      guest_name: guestName.trim() || null,
      total_price: calculateTotal(),
      is_waitlist: isWaitlist
    }]);
    setIsSubmitting(false);

    if (error) alert("Erreur: " + error.message);
    else setSubmitted(true);
  };

  const nowTime = new Date().getTime();
  const deadlineTime = new Date(eventData.deadline).getTime();
  const isPastDeadline = nowTime > deadlineTime;

  // Form is ONLY locked if deadline is passed. If member limit is full, they can join waitlist.
  const isFormLocked = isPastDeadline;

  if (isPastDeadline) {
    return (
      <div className="w-full bg-white p-5 rounded-2xl shadow-sm border border-gray-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 opacity-80">
        <div>
          <h2 className="text-xl font-bold text-gray-800">{eventData.event_name}</h2>
          <p className="text-sm text-gray-500 flex items-center gap-1 mt-1"><Calendar className="w-4 h-4"/> {eventData.event_date}</p>
        </div>
        <span className="bg-gray-200 text-gray-600 text-xs font-bold px-4 py-2 rounded-full uppercase flex items-center gap-2">
          <Lock className="w-3 h-3"/> Terminé
        </span>
      </div>
    );
  }

  return (
    <div className="w-full bg-white p-8 rounded-3xl shadow-sm border border-blue-100 space-y-6">
      <div className="flex justify-between items-start mb-4">
        <span className="text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wide bg-red-50 text-red-600">
          Deadline: {eventData.deadline ? new Date(eventData.deadline).toLocaleDateString("fr-FR", { day: 'numeric', month: 'short', hour: '2-digit', minute:'2-digit' }) : 'Bientôt'}
        </span>
        {isTotalMembersFull && !isPastDeadline && (
          <span className="bg-orange-100 text-orange-700 text-xs font-bold px-3 py-1 rounded-full uppercase">Liste d'attente</span>
        )}
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
          </span>
        </div>
      </div>

      {eventData.location && (
        <div className="mt-4 space-y-2">
          <div className="flex justify-end">
            <a 
              href={eventData.location.startsWith('http') ? eventData.location : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(eventData.location)}`} 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1"
            >
              <ExternalLink className="w-3.5 h-3.5" /> Ouvrir dans Google Maps
            </a>
          </div>
          <div className="rounded-2xl overflow-hidden border border-gray-200 shadow-inner">
            <iframe 
              width="100%" 
              height="200" 
              frameBorder="0" 
              style={{ border: 0 }} 
              allowFullScreen
              loading="lazy"
              src={`https://maps.google.com/maps?q=${encodeURIComponent(eventData.location)}&output=embed`}
            ></iframe>
          </div>
        </div>
      )}

      {eventData.event_parts && eventData.event_parts.length > 0 && (
        <div className="mt-4 p-4 bg-blue-50 rounded-xl border border-blue-100">
          <h4 className="font-bold text-blue-900 mb-2 flex items-center gap-2"><Info className="w-4 h-4"/> Programme & Tarifs</h4>
          <ul className="space-y-1 text-sm text-blue-800">
            {eventData.event_parts.map(p => (
              <li key={p.name}>• <b>{p.name}</b> : {p.memberPrice} DT (Membre) {eventData.guests_allowed && p.guestPrice > 0 ? `/ ${p.guestPrice} DT (Invité)` : ''}</li>
            ))}
          </ul>
        </div>
      )}

      {eventData.main_paragraph && (
        <div className="border border-gray-200 rounded-2xl overflow-hidden mt-4">
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
          <h3 className="text-lg font-bold text-green-900">{isTotalMembersFull ? "Ajouté à la liste d'attente !" : "Présence confirmée !"}</h3>
        </div>
      ) : isFormLocked ? (
        <div className="p-6 bg-gray-50 border border-gray-200 rounded-2xl text-center space-y-2">
          <Lock className="w-10 h-10 text-gray-400 mx-auto" />
          <h3 className="text-lg font-bold text-gray-700">Inscriptions Fermées</h3>
          <p className="text-sm text-gray-500">La date limite de confirmation est dépassée.</p>
        </div>
      ) : (
        <form className="space-y-4" onSubmit={handleConfirm}>
          
          <div className="relative">
            <input 
              list={`members-list-${eventData.id}`}
              value={selectedMember} 
              onChange={(e) => setSelectedMember(e.target.value)} 
              placeholder="🔍 Recherchez et sélectionnez votre nom..."
              className="w-full border-2 border-gray-200 p-4 rounded-xl bg-gray-50 focus:border-blue-500 font-medium text-gray-700 outline-none" 
              required 
            />
            <datalist id={`members-list-${eventData.id}`}>
              {members.map(m => <option key={m.id} value={m.full_name} />)}
            </datalist>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {eventData.event_parts?.map((part) => {
              const isChecked = selectedParts.includes(part.name);
              const currentPartMembers = partCounts[part.name]?.members || 0;
              const isPartMemberFull = part.memberLimit && currentPartMembers >= part.memberLimit;
              const isDisabled = isPartMemberFull && !isChecked;

              return (
                <label key={part.name} className={`flex flex-col items-center justify-center p-4 border-2 rounded-xl transition-all relative ${isDisabled ? 'opacity-50 cursor-not-allowed bg-gray-100' : isChecked ? 'border-blue-600 bg-blue-50 cursor-pointer' : 'border-gray-100 hover:border-blue-300 cursor-pointer'}`}>
                  {isDisabled && <Lock className="absolute top-2 right-2 w-3 h-3 text-red-500" />}
                  <input type="checkbox" checked={isChecked} onChange={() => { if (!isDisabled) togglePart(part.name); }} disabled={isDisabled} className="w-5 h-5 text-blue-600 mb-2" /> 
                  <span className="font-bold text-gray-700 text-sm text-center">{part.name}</span>
                  <span className="text-xs text-blue-600 font-semibold mt-1">{part.memberPrice} DT</span>
                  {part.memberLimit && <span className="text-[10px] text-gray-400 mt-1">{Math.max(0, part.memberLimit - currentPartMembers)} places</span>}
                </label>
              );
            })}
          </div>

          {eventData.guests_allowed && (
            isTotalGuestsFull ? (
              <div className="p-3 bg-orange-50 border border-orange-200 rounded-xl text-center text-xs font-bold text-orange-700">La limite globale d'invités a été atteinte.</div>
            ) : (
              <input type="text" placeholder="Nom de votre invité (Optionnel)" value={guestName} onChange={e => setGuestName(e.target.value)} className="w-full border-2 border-gray-200 p-4 rounded-xl bg-gray-50 focus:border-blue-500 outline-none font-medium" />
            )
          )}
          
          <button type="submit" disabled={isSubmitting} className={`${isTotalMembersFull ? 'bg-orange-500 hover:bg-orange-600' : 'bg-blue-600 hover:bg-blue-700'} text-white font-black text-lg px-4 py-4 rounded-xl w-full shadow-lg transition-all flex justify-center items-center`}>
            {isSubmitting ? <Loader2 className="w-6 h-6 animate-spin" /> : (isTotalMembersFull ? `Rejoindre la liste d'attente (${calculateTotal()} DT)` : `Confirmer (${calculateTotal()} DT)`)}
          </button>
        </form>
      )}
    </div>
  );
}

function EventsLoader() {
  const [events, setEvents] = useState([]);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const searchParams = useSearchParams();
  const eventId = searchParams.get('id');

  useEffect(() => {
    async function init() {
      setLoading(true);
      try {
        const { data: membersList } = await supabase.from("members").select("id, full_name").order("full_name", { ascending: true });
        if (membersList) setMembers(membersList);

        let query = supabase.from("manual_events").select("*").order("created_at", { ascending: false });
        if (eventId) query = query.eq('id', eventId);
        else query = query.limit(10);
        
        const { data: evts } = await query;
        if (evts) setEvents(evts);

      } catch (e) {
        console.error("Load Error:", e);
      } finally {
        setLoading(false);
      }
    }
    init();
  }, [eventId]);

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-gray-50"><Loader2 className="w-8 h-8 text-blue-600 animate-spin" /></div>;
  if (events.length === 0) return <div className="min-h-screen flex items-center justify-center bg-gray-50"><p className="text-gray-500 font-medium">Aucun événement actif.</p></div>;

  return (
    <div className="max-w-xl w-full space-y-6">
      {events.map(evt => <EventCard key={evt.id} eventData={evt} members={members} />)}
    </div>
  );
}

export default function Home() {
  return (
    <main className="min-h-screen bg-slate-50 py-10 px-4 font-sans flex flex-col items-center">
      <div className="max-w-xl w-full bg-white p-6 rounded-3xl shadow-sm border border-gray-200 mb-6 flex items-center gap-4">
        <img src="/logo.png" alt="Logo" className="w-16 h-16 rounded-full object-cover border border-gray-100" onError={(e) => { e.target.style.display = 'none'; }} />
        <div>
          <h1 className="text-2xl font-black text-blue-900 tracking-tight">Portail ICTGC</h1>
          <p className="text-sm text-gray-500 font-medium">Réservation aux événements</p>
        </div>
      </div>

      <Suspense fallback={<div className="p-8"><Loader2 className="w-8 h-8 text-blue-600 animate-spin" /></div>}>
        <EventsLoader />
      </Suspense>
    </main>
  );
}