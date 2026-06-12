import { createClient } from "@supabase/supabase-js";

export const getSupabaseClient = () => {
  const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
  const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
  return createClient(supabaseUrl, supabaseAnonKey);
};
