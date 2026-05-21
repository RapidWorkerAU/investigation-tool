import { createServiceRoleClient } from "@/lib/supabase/server";

export type UserProfileActivityStatus = "success" | "failed" | "info";

type UserProfileActivityArgs = {
  userId: string;
  actorUserId?: string | null;
  action: string;
  status?: UserProfileActivityStatus;
  summary: string;
  metadata?: Record<string, unknown>;
};

type ActivitySupabaseClient = ReturnType<typeof createServiceRoleClient>;

export async function insertUserProfileActivity(
  supabase: ActivitySupabaseClient,
  {
    userId,
    actorUserId = null,
    action,
    status = "success",
    summary,
    metadata = {},
  }: UserProfileActivityArgs,
) {
  const { error } = await supabase.from("user_profile_activity_logs").insert({
    user_id: userId,
    actor_user_id: actorUserId,
    action,
    status,
    summary,
    metadata,
  });

  if (error) {
    console.error("Failed to insert user profile activity", error);
  }
}

export async function insertUserProfileActivityBestEffort(
  args: UserProfileActivityArgs,
) {
  try {
    const supabase = createServiceRoleClient();
    await insertUserProfileActivity(supabase, args);
  } catch (error) {
    console.error("Failed to insert user profile activity", error);
  }
}
