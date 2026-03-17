import type { SupabaseClient } from "@supabase/supabase-js";

export type EmailRecipient = {
  email: string;
  fullName: string | null;
  firstName: string | null;
};

function extractFirstName(fullName: string | null) {
  const value = fullName?.trim();
  if (!value) return null;
  return value.split(/\s+/)[0] || null;
}

export async function loadEmailRecipientByUserId(
  supabase: SupabaseClient,
  userId: string,
): Promise<EmailRecipient | null> {
  const { data, error } = await supabase
    .from("profiles")
    .select("email,full_name")
    .eq("id", userId)
    .maybeSingle();

  if (error || !data?.email) {
    return null;
  }

  return {
    email: data.email,
    fullName: data.full_name ?? null,
    firstName: extractFirstName(data.full_name ?? null),
  };
}
