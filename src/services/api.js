import { supabase } from './supabase.js';
import { maps } from '../data/maps.js';

// Where the editors save: Supabase if configured, otherwise the repo files through the dev server.

export async function listMaps() {
  if (supabase) return Object.keys(maps);
  return (await fetch('/api/maps')).json();
}

export async function loadMap(name) {
  if (supabase) return structuredClone(maps[name]);
  return (await fetch(`/api/maps/${name}`)).json();
}

export async function saveMap(name, map) {
  if (supabase) {
    const { error } = await supabase.from('maps').upsert({ name, data: map });
    if (error) throw error;
    maps[name] = structuredClone(map);
    return;
  }
  const res = await fetch(`/api/maps/${name}`, { method: 'POST', body: JSON.stringify(map) });
  if (!res.ok) throw new Error(await res.text());
}

// data = { towers, enemies, items, terrain, sprites }
export async function saveData(data) {
  if (supabase) {
    const rows = Object.entries(data).map(([name, value]) => ({ name, data: value }));
    const { error } = await supabase.from('game_data').upsert(rows);
    if (error) throw error;
    return;
  }
  const res = await fetch('/api/data', { method: 'POST', body: JSON.stringify(data) });
  if (!res.ok) throw new Error(await res.text());
}

// Returns the path to register in sprites.
export async function uploadSprite(key, file) {
  if (supabase) {
    const { error } = await supabase.storage.from('sprites').upload(`${key}.png`, file, { upsert: true });
    if (error) throw error;
    return supabase.storage.from('sprites').getPublicUrl(`${key}.png`).data.publicUrl;
  }
  const res = await fetch(`/api/sprites/${key}`, { method: 'POST', body: file });
  if (!res.ok) throw new Error(await res.text());
  return `assets/sprites/${key}.png`;
}
