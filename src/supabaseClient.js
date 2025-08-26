// src/supabaseClient.js
import { createClient } from '@supabase/supabase-js';

// Gunakan process.env.REACT_APP_ untuk Create React App
const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("Supabase URL:", process.env.REACT_APP_SUPABASE_URL);
  console.error("Supabase Anon Key:", process.env.REACT_APP_SUPABASE_ANON_KEY);
  throw new Error("Supabase URL and Anon Key must be provided in environment variables.");
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);