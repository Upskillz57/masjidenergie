import { redirect } from "next/navigation";
import { requireStaff } from "@/lib/auth";
import { createAdminClient, isSupabaseConfigured } from "@/lib/supabase/server";

// Ouvrir une notification (depuis la liste ou une notification push) : marquée comme lue, puis redirection.
export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireStaff("/admin/notifications");
  if (!isSupabaseConfigured || !/^[0-9a-f-]{36}$/i.test(id)) redirect("/admin/notifications");
  const db = createAdminClient();
  const { data } = await db.from("notifications").select("url").eq("id", id).eq("user_id", user.id).maybeSingle();
  if (!data) redirect("/admin/notifications");
  await db.from("notifications").update({ read_at: new Date().toISOString() }).eq("id", id).is("read_at", null);
  // Seules les adresses internes sont suivies.
  redirect(data.url.startsWith("/") && !data.url.startsWith("//") ? data.url : "/admin/notifications");
}
