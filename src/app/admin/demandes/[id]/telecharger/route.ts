import { requireStaff } from "@/lib/auth";
import { downloadRequestFiles } from "@/lib/request-download";
import { isSupabaseConfigured } from "@/lib/supabase/server";

/** Télécharge un document (fichier direct) ou plusieurs (archive ZIP) d'une demande : ?f=id1,id2 (tous si absent). */
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await requireStaff(`/admin/demandes/${id}`);
  if (!/^[0-9a-f-]{36}$/i.test(id)) return new Response("Demande introuvable", { status: 404 });
  if (!isSupabaseConfigured) return new Response("Mode démo : téléchargement indisponible sans Supabase.", { status: 501 });
  return downloadRequestFiles(id, new URL(request.url).searchParams.get("f"));
}
