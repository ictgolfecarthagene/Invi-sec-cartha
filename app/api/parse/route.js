import { GoogleGenAI } from "@google/genai";

export async function POST(req) {
  try {
    if (!process.env.GEMINI_API_KEY) {
      return Response.json({ error: "La clé API GEMINI_API_KEY est manquante." }, { status: 500 });
    }

    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    const { text } = await req.json();
    
    const prompt = `
    Analyze this Interact club invitation and extract the details into a strict JSON object. If a value is missing, return null.
    
    JSON Structure:
    {
      "eventName": "String (Name of the event, e.g. Cérémonie de Passation)",
      "hostClubs": ["Array of Strings (Extract the exact names of the clubs hosting from this list: IC Tunis Medina, IC Mirabel Tunis, IC North Africa, IC Pilote Ariana, IC Bloom City, IC Big South Tunis, IC Tunis Cosmopolitan, IC Tunis Doyen, IC Tunis Inner City, IC Tunis El Bey, IC Anastasia, IC Ennaser, IC Tunis Golden Eagles, IC Rey De Carthago, IC Tinast Glory, IC Didon Amilcar, IC Tunis Golfe, IC Opportunity, IC Aquatic North, IC Tunis Moon City, IC Tunis Les Berges Du Lac, IC Tunis Hannibal, IC Amilcar Sidibousaid, IC Sidibousaid, IC Tunis César, IC Carthage La Renaissance, IC Tunis Belvédère, IC Ariana Tines, IC Ariana La Rose, IC Saint Germain, IC Maxula Prates, IC Tunis Golfe Carthagène, IC Megrine, IC Tunis Amilcar, IC Hammam Lif, IC Boumhel El Bassatine, IC Hammamet, IC Nabeul Neapolis, IC Graces El Mourouj, IC Pragma Sousse, IC Sousse, IC Kairouan, IC Ruspina Monastir, IC Monastir, IC Sfax Doyen, IC Sfax Métropole, IC Sfax Flambeau, IC Sfax Sindbad, IC Sfax Tamaris, IC Gabes Oasis, IC Djerba Flamingo)"],
      "eventDate": "String (e.g., 20 Août 2026 à 18h)",
      "location": "String (Name of place or maps link)",
      "deadline": "YYYY-MM-DDTHH:MM (Convert the deadline to an ISO datetime string)",
      "memberLimit": Number (Maximum total number of members allowed to attend. Return null if unlimited or not mentioned),
      "guestsAllowed": Boolean (True if guests/invités are allowed, false if strictly members only),
      "guestLimit": Number (How many guests per member, default 1 if allowed but not specified),
      "mainParagraph": "String (The full invitation message body, exactly as written)",
      "parts": [
        {
          "name": "String (e.g., 'Cérémonie', 'Soirée', or 'Passation complète')",
          "memberPrice": Number (Price for interactiens/members for this part in DT, 0 if free),
          "guestPrice": Number (Price for guests/invités for this part in DT, 0 if free)
        }
      ]
    }
    
    Invitation Text:
    "${text}"
    `;

    const response = await ai.models.generateContent({
      model: "gemini-3.6-flash",
      contents: prompt,
      config: { responseMimeType: "application/json" }
    });

    let rawText = response.text;
    
    if (rawText.startsWith('```json')) {
      rawText = rawText.replace(/```json/g, '').replace(/```/g, '').trim();
    } else if (rawText.startsWith('```')) {
      rawText = rawText.replace(/```/g, '').trim();
    }

    return Response.json(JSON.parse(rawText));

  } catch (error) {
    console.error("Détails de l'erreur IA:", error);
    return Response.json({ error: error.message || "Erreur interne de l'IA" }, { status: 500 });
  }
}