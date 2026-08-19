"use client";
import { useState } from "react";
import { Lock, Settings, ScanText } from "lucide-react";
import { supabase } from "../../lib/supabase";

export default function AdminDashboard() {
  const [password, setPassword] = useState("");
  const [authenticated, setAuthenticated] = useState(false);
  const [rawText, setRawText] = useState("");
  const [parsedData, setParsedData] = useState(null);

  if (!authenticated) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-3xl shadow-2xl max-w-md w-full text-center">
          <div className="bg-blue-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
            <Lock className="w-10 h-10 text-blue-600" />
          </div>
          <h2 className="text-3xl font-black text-gray-900 mb-2">Espace Restreint</h2>
          <p className="text-gray-500 mb-8 font-medium">Secrétariat ICTGC Uniquement</p>
          
          <input 
            type="password" 
            placeholder="Mot de passe..."
            className="w-full border-2 border-gray-200 p-4 rounded-xl mb-4 text-center text-xl font-bold focus:border-blue-500 outline-none transition-all"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <button 
            onClick={() => password === "secretaire2026" && setAuthenticated(true)} 
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-xl transition-all shadow-lg shadow-blue-600/30">
            Déverrouiller
          </button>
        </div>
      </div>
    );
  }

  const handleParse = async () => {
    try {
      const res = await fetch("/api/parse", {
        method: "POST",
        body: JSON.stringify({ text: rawText })
      });
      const data = await res.json();
      setParsedData(data);
    } catch (error) {
      alert("Erreur lors de l'analyse.");
    }
  };

  const saveEvent = async () => {
    if (!parsedData) return;
    
    const { error } = await supabase.from('events').insert([{
      host_clubs: parsedData.hostClubs,
      event_date: parsedData.eventDate,
      maps_link: parsedData.mapsLink,
      raw_message: rawText 
    }]);

    if (error) {
      alert("Erreur de sauvegarde: " + error.message);
    } else {
      alert("Événement publié avec succès !");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-black mb-8 flex items-center gap-3 text-gray-900">
          <Settings className="text-blue-600" /> Administration
        </h1>
        
        <div className="bg-white p-6 md:p-8 rounded-3xl shadow-lg border border-gray-100 mb-8">
          <div className="flex items-center gap-3 mb-6">
            <ScanText className="text-blue-600 w-6 h-6" />
            <h2 className="font-bold text-xl text-gray-800">Scanner d'Invitation Rapide</h2>
          </div>
          <textarea 
            className="w-full h-48 p-5 border-2 border-gray-200 rounded-xl mb-4 bg-gray-50 text-sm font-medium focus:border-blue-500 outline-none resize-none transition-all" 
            placeholder="Collez le long message de l'invitation ici..."
            value={rawText}
            onChange={(e) => setRawText(e.target.value)}
          />
          <button onClick={handleParse} className="bg-gray-900 hover:bg-black text-white px-6 py-4 rounded-xl font-bold w-full transition-all">
            Analyser et Extraire
          </button>

          {parsedData && (
            <div className="mt-6 bg-blue-50 p-6 rounded-2xl border border-blue-100">
              <h3 className="font-black text-blue-900 mb-4">Vérification :</h3>
              <ul className="space-y-2 text-sm font-medium text-blue-800 mb-6">
                <li><strong>Clubs :</strong> {parsedData.hostClubs || "N/A"}</li>
                <li><strong>Date :</strong> {parsedData.eventDate || "N/A"}</li>
                <li><strong>Lieu (Maps) :</strong> {parsedData.mapsLink || "N/A"}</li>
              </ul>
              <button onClick={saveEvent} className="bg-blue-600 text-white w-full py-3 rounded-xl font-bold shadow-lg shadow-blue-600/30">
                Publier pour les membres
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}