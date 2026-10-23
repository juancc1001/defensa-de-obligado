import { supabase } from '../services/supabase.js';

// While collaborating on Supabase, what's saved there overrides the repo files (game and editors).
// { towers, enemies, ..., maps: { <name>: map } }, only with what has been saved.
async function load() {
  const [data, maps] = await Promise.all([supabase.from('game_data').select(), supabase.from('maps').select()]);
  if (data.error) throw data.error;
  if (maps.error) throw maps.error;
  return {
    ...Object.fromEntries(data.data.map((row) => [row.name, row.data])),
    maps: Object.fromEntries(maps.data.map((row) => [row.name, row.data])),
  };
}

export const remote = supabase ? await load() : {};
