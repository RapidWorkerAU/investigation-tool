import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";

function assertSupabaseServerEnv() {
  if (!supabaseUrl) {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL is not configured.");
  }

  if (!supabaseAnonKey) {
    throw new Error("NEXT_PUBLIC_SUPABASE_ANON_KEY is not configured.");
  }
}

function assertSupabaseServiceRoleEnv() {
  assertSupabaseServerEnv();

  if (!supabaseServiceRoleKey) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY is not configured.");
  }

  if (supabaseServiceRoleKey === supabaseAnonKey) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY is using the anon key value. Set the real service role key.");
  }
}

export const createAnonServerClient = () =>
  (assertSupabaseServerEnv(),
  createClient(supabaseUrl, supabaseAnonKey, {
    auth: { persistSession: false },
  }));

export const createAuthedServerClient = (accessToken: string) =>
  (assertSupabaseServerEnv(),
  createClient(supabaseUrl, supabaseAnonKey, {
    auth: { persistSession: false },
    global: {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    },
  }));

export const createServiceRoleClient = () =>
  (assertSupabaseServiceRoleEnv(),
  createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: { persistSession: false },
  }));
