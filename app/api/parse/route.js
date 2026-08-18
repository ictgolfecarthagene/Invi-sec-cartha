export async function POST(req) {
  const { text } = await req.json();

  // 1. Extract Clubs (Finds any mention of "Interact Club...")
  const clubRegex = /Interact Club\s+[A-Za-zÀ-ÿ\s]+/gi;
  const foundClubs = [...new Set(text.match(clubRegex) || [])].map(c => c.trim());

  // 2. Extract Dates (Finds patterns like "20 août 2026")
  const dateRegex = /\d{1,2}\s+(janvier|février|mars|avril|mai|juin|juillet|août|septembre|octobre|novembre|décembre)\s+\d{4}/gi;
  const dates = text.match(dateRegex);
  const eventDate = dates ? dates[0] : "Date introuvable";

  // 3. Extract Maps Link
  const mapsRegex = /https:\/\/maps\.app\.goo\.gl\/[a-zA-Z0-9_-]+/g;
  const mapsLink = text.match(mapsRegex) ? text.match(mapsRegex)[0] : "";

  // 4. Smart Rules (Reads context for rules)
  const ceremonyIncluded = /passation|cérémonie/i.test(text);
  const soireeIncluded = /soirée/i.test(text);
  // If the text says "aucun invité extérieur" (no outside guests), it marks guests as false.
  const guestsAllowed = !(/aucun invité extérieur/i.test(text));

  const extractedData = {
    hostClubs: foundClubs.join(" & "),
    eventDate,
    mapsLink,
    ceremonyIncluded,
    soireeIncluded,
    guestsAllowed
  };

  return Response.json(extractedData);
}