import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

export function createSupabaseBrowser() {
  if (!url || !anon) throw new Error("Missing Supabase browser env vars.");
  return createClient(url, anon);
}
