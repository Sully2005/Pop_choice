import OpenAI from 'https://cdn.jsdelivr.net/npm/openai/+esm';
const api_key = ''
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';
export const TMDB_KEY = ''

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
