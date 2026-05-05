import { createServiceRoleClient } from "@/lib/supabase/server";

type AdminSupabaseClient = ReturnType<typeof createServiceRoleClient>;

export const deleteManagedUser = async (supabase: AdminSupabaseClient, userId: string) => {
  const { data: nodes, error: nodesError } = await supabase
    .schema("ms")
    .from("document_nodes")
    .select("id")
    .eq("owner_user_id", userId);

  if (nodesError) {
    throw new Error(nodesError.message);
  }

  const nodeIds =
    nodes?.map((row) => row.id).filter((value): value is string => typeof value === "string" && value.length > 0) ?? [];

  if (nodeIds.length) {
    const { error: outlineDeleteError } = await supabase
      .schema("ms")
      .from("document_outline_items")
      .delete()
      .in("node_id", nodeIds);

    if (outlineDeleteError) {
      throw new Error(outlineDeleteError.message);
    }
  }

  const [
    { error: canvasElementsError },
    { error: documentNodesError },
    { error: systemMapsError },
    { error: profilesError },
  ] = await Promise.all([
    supabase.schema("ms").from("canvas_elements").delete().eq("created_by_user_id", userId),
    supabase.schema("ms").from("document_nodes").delete().eq("owner_user_id", userId),
    supabase.schema("ms").from("system_maps").delete().eq("owner_id", userId),
    supabase.from("profiles").delete().eq("id", userId),
  ]);

  if (canvasElementsError) {
    throw new Error(canvasElementsError.message);
  }

  if (documentNodesError) {
    throw new Error(documentNodesError.message);
  }

  if (systemMapsError) {
    throw new Error(systemMapsError.message);
  }

  if (profilesError) {
    throw new Error(profilesError.message);
  }

  const { error: deleteUserError } = await supabase.auth.admin.deleteUser(userId);
  if (deleteUserError) {
    throw new Error(deleteUserError.message);
  }
};
