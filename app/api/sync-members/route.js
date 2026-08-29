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

    let names = csvText.split('\n')
      .map(row => row.replace(/["\r]/g, '').trim())
      .filter(row => row !== '');

    if (names.length === 0) throw new Error("Fichier CSV vide.");
    if (/nom|name|membre|participant/i.test(names[0])) names.shift();

    const { error: deleteError } = await supabase.from('members').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    if (deleteError) throw deleteError;

    const insertData = names.map(name => ({ full_name: name }));
    const { error: insertError } = await supabase.from('members').insert(insertData);
    if (insertError) throw insertError;

    return Response.json({ success: true, count: names.length });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}