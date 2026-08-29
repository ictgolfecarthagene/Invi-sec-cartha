import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export async function POST() {
  try {
    const sheetUrl = "https://docs.google.com/spreadsheets/d/e/2PACX-1vQ_rfHUP8qVHpAAA_5fsOikvZUOXyYIyQrksh9mnzd2xjYkU949qmq4q7EhVDmA1A8S0QQsL7c3Zxaw/pub?gid=629488919&single=true&output=csv";
    const response = await fetch(sheetUrl, { cache: 'no-store' });
    const csvText = await response.text();

    const rows = csvText.split('\n');

    // On ignore les 2 premières lignes (slice(2))
    let names = rows.slice(2).map(row => {
      const cols = row.split(','); // Séparer par virgule
      
      // On cible strictement la Colonne B (index 1)
      let rawName = cols.length > 1 ? cols[1] : null; 
      
      return rawName ? rawName.replace(/["\r]/g, '').trim() : '';
    }).filter(name => name !== ''); // Retirer les lignes vides

    if (names.length === 0) {
      throw new Error("Aucun nom trouvé dans la colonne B à partir de la ligne 3.");
    }

    // Vider l'ancienne liste
    const { error: deleteError } = await supabase
      .from('members')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000');

    if (deleteError) throw deleteError;

    // Insérer la nouvelle liste
    const insertData = names.map(name => ({ full_name: name }));
    const { error: insertError } = await supabase.from('members').insert(insertData);

    if (insertError) throw insertError;

    return Response.json({ success: true, count: names.length });

  } catch (error) {
    console.error("Sync Error:", error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}