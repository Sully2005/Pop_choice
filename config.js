import OpenAI from 'https://cdn.jsdelivr.net/npm/openai/+esm';
const api_key = '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';
const SUPABASE_API_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InprbXdtYWhqY2VyZXZ0bmhqeHdvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTEyNDgxOTksImV4cCI6MjA2NjgyNDE5OX0.u0ymMl-bHTlGtMMnqcq0MlnnW6_xt1bhd1UGaZYBoHU'
const SUPABASE_URL = 'https://zkmwmahjcerevtnhjxwo.supabase.co'
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';
export const TMDB_KEY = '1e534f0e2e56d8be449a58f8d246dacb'

/** OpenAI config */
if (!api_key) throw new Error("OpenAI API key is missing or invalid.");
export const AI = new OpenAI({
  apiKey: api_key,
  dangerouslyAllowBrowser: true
});


/** Supabase config */
const privateKey = SUPABASE_API_KEY;
if (!privateKey) throw new Error(`Expected env var SUPABASE_API_KEY`);
const url = SUPABASE_URL;
if (!url) throw new Error(`Expected env var SUPABASE_URL`);
export const supabase = createClient(url, privateKey);
