"use client";
import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { Calendar, MapPin, Users, ChevronDown, ChevronUp } from "lucide-react";

export default function Home() {
  const [events, setEvents] = useState([]);
  const [members, setMembers] = useState(["Yessine Ben Fraj", "Ahmed", "Sara"]); // Connect to your sheet later
  const [expandedEvent, setExpandedEvent] = useState(null);

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 relative to-gray-100 p-4 md:p-8 font-sans">
      <div className="max-w-2xl mx-auto">
        
        {/* Header */}
        <header className="flex items-center gap-4 mb-10 bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
          <img src="/icon-192x192.png" alt="Logo" className="w-16 h-16 rounded-full shadow-md border-2 border-blue-600" />
          <div>
            <h1 className="text-2xl font-extrabold text-blue-900 tracking-tight">Portail ICTGC</h1>
            <p className="text-sm text-gray-500 font-medium">Réservation aux événements Interact</p>
          </div>
        </header>

        <div className="space-y-6">
          {/* Simulated Event Card - Connect to Supabase map() later */}
          <div className="bg-white rounded-3xl shadow-lg border border-gray-100 overflow-hidden transition-all duration-300 hover:shadow-xl">
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <span className="bg-red-100 text-red-700 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wide">
                  Date Limite: 18 Août
                </span>
                <span className="bg-blue-100 text-blue-700 text-xs font-bold px-3 py-1 rounded-full uppercase">
                  Nouveau
                </span>
              </div>
              
              <h2 className="text-2xl font-black text-gray-900 leading-tight">Cérémonie de Passation</h2>
              <p className="text-md text-gray-500 mb-6 font-medium">Interact Club Hammamet & Pragma Sousse</p>

              <div className="flex flex-col gap-3 text-sm text-gray-700 mb-6">
                <div className="flex items-center gap-2"><Calendar className="w-5 h-5 text-blue-500" /> 20 Août 2026</div>
                <div className="flex items-center gap-2"><MapPin className="w-5 h-5 text-red-500" /> Hammamet Nord</div>
                <div className="flex items-center gap-2"><Users className="w-5 h-5 text-green-500" /> Invités autorisés (20 DT)</div>
              </div>

              {/* Show Full Message Toggle */}
              <button 
                onClick={() => setExpandedEvent(expandedEvent === 1 ? null : 1)}
                className="flex items-center justify-between w-full p-3 bg-gray-50 hover:bg-gray-100 rounded-xl text-sm font-semibold text-gray-700 transition-colors"
              >
                Lire le message complet de l'invitation
                {expandedEvent === 1 ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
              </button>

              {expandedEvent === 1 && (
                <div className="mt-3 p-4 bg-gray-50 rounded-xl text-xs text-gray-600 whitespace-pre-wrap leading-relaxed border border-gray-200">
                  {/* The raw_message from database will go here */}
                  "Chers Interactiens et chères Interactiennes...\n\nVoici le programme complet de notre passation..."
                </div>
              )}

              <hr className="my-6 border-gray-100" />

              {/* RSVP Form */}
              <form className="space-y-4">
                 <select className="w-full border-2 border-gray-200 p-3.5 rounded-xl bg-gray-50 focus:border-blue-500 focus:ring-0 font-medium text-gray-700 outline-none transition-all" required>
                   <option value="">Sélectionnez votre prénom...</option>
                   {members.map(m => <option key={m} value={m}>{m}</option>)}
                 </select>

                 <div className="grid grid-cols-2 gap-3">
                   <label className="flex flex-col items-center gap-2 p-4 border-2 border-gray-100 rounded-xl cursor-pointer hover:border-blue-500 transition-all has-[:checked]:border-blue-600 has-[:checked]:bg-blue-50">
                     <input type="checkbox" className="w-5 h-5 text-blue-600 rounded-md" /> 
                     <span className="font-bold text-gray-700 text-sm">Cérémonie</span>
                   </label>
                   <label className="flex flex-col items-center gap-2 p-4 border-2 border-gray-100 rounded-xl cursor-pointer hover:border-blue-500 transition-all has-[:checked]:border-blue-600 has-[:checked]:bg-blue-50">
                     <input type="checkbox" className="w-5 h-5 text-blue-600 rounded-md" /> 
                     <span className="font-bold text-gray-700 text-sm">Soirée</span>
                   </label>
                 </div>

                 <input type="text" placeholder="Nom de votre invité (+20 DT)" className="w-full border-2 border-gray-200 p-3.5 rounded-xl bg-gray-50 focus:border-blue-500 outline-none font-medium" />
                 
                 <button className="bg-blue-600 hover:bg-blue-700 text-white font-black text-lg px-4 py-4 rounded-xl w-full shadow-lg shadow-blue-600/30 transition-all transform hover:-translate-y-1">
                   Confirmer ma présence
                 </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}