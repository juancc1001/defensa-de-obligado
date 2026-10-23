import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL;
const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

// Without these, the editors save to the repo files through the dev server (vite.config.js).
export const supabase = url && key ? createClient(url, key) : null;
