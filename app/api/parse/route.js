import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function POST(req) {
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
    "memberPrice": Number (Price for members in DT),
    "guestPrice": Number (Price for guests in DT),
    "guestsAllowed": Boolean (True if guests/invités are allowed, false if 'Aucun invité' or strictly members only),
    "guestLimit": Number (How many guests per member, default 1 if allowed but not specified),
    "parts": ["Array of Strings (e.g., 'Cérémonie', 'Soirée')"]
  }
  
  Invitation Text:
  "${text}"
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: { responseMimeType: "application/json" }
    });
    return Response.json(JSON.parse(response.text));
  } catch (error) {
    return Response.json({ error: "AI Parsing Failed" }, { status: 500 });
  }
}