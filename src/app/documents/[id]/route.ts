import { NextResponse, type NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { createAdminClient, DOCUMENTS_BUCKET, isSupabaseConfigured } from "@/lib/supabase/server";
import { isStaffRole } from "@/lib/workflow";

// Téléchargement d'un document de la bibliothèque : réservé aux comptes connectés,
// les mosquées ne voient que les documents partagés. Redirige vers un lien signé de 5 minutes.
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user) return NextResponse.redirect(new URL(`/connexion?next=/documents/${id}`, request.url));
  if (!isSupabaseConfigured || !/^[0-9a-f-]{36}$/i.test(id)) return new Response("Document introuvable", { status: 404 });

  const db = createAdminClient();
  const { data: doc } = await db.from("documents").select("path, file_name, visible_to_mosques").eq("id", id).maybeSingle();
  if (!doc || (!doc.visible_to_mosques && !isStaffRole(user.role))) return new Response("Document introuvable", { status: 404 });

  const view = request.nextUrl.searchParams.get("voir") === "1";
  const { data } = await db.storage
    .from(DOCUMENTS_BUCKET)
    .createSignedUrl(doc.path, 300, view ? undefined : { download: doc.file_name });
  return data ? NextResponse.redirect(data.signedUrl) : new Response("Document indisponible", { status: 404 });
}
