import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export async function POST() {
  try {
    // Votre lien Google Sheets exact
    const sheetUrl = "https://docs.google.com/spreadsheets/d/e/2PACX-1vQ_rfHUP8qVHpAAA_5fsOikvZUOXyYIyQrksh9mnzd2xjYkU949qmq4q7EhVDmA1A8S0QQsL7c3Zxaw/pub?gid=629488919&single=true&output=csv";
    const response = await fetch(sheetUrl, { cache: 'no-store' });
    const csvText = await response.text();

    // 1. Diviser le CSV en lignes
    const rows = csvText.split('\n');

    // 2. Commencer à la 3ème ligne (slice(2) ignore la ligne 1 et 2)
    let names = rows.slice(2).map(row => {
      const cols = row.split(','); // Séparer les colonnes
      
      // La colonne B est l'index 1. 
      // (Si le lien Sheets ne renvoie qu'une seule colonne, on sécurise en prenant l'index 0)
      let rawName = cols.length > 1 ? cols[1] : cols[0];
      
      return rawName ? rawName.replace(/["\r]/g, '').trim() : '';
    }).filter(name => name !== ''); // Retirer les lignes vides

    if (names.length === 0) {
      throw new Error("Aucun nom trouvé dans la colonne B à partir de la ligne 3.");
    }

    // 3. Vider l'ancienne liste de Supabase
    const { error: deleteError } = await supabase
      .from('members')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000');

    if (deleteError) throw deleteError;

    // 4. Insérer la nouvelle liste propre
    const insertData = names.map(name => ({ full_name: name }));
    const { error: insertError } = await supabase.from('members').insert(insertData);

    if (insertError) throw insertError;

    return Response.json({ success: true, count: names.length });

  } catch (error) {
    console.error("Sync Error:", error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}