import { NextResponse, type NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { createAdminClient, DOCUMENTS_BUCKET, isSupabaseConfigured } from "@/lib/supabase/server";
import { isStaffRole } from "@/lib/workflow";

// PDF d'un formulaire rempli en ligne : l'équipe, ou la mosquée qui l'a rempli.
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user) return NextResponse.redirect(new URL(`/connexion?next=/documents/formulaires/${id}`, request.url));
  if (!isSupabaseConfigured || !/^[0-9a-f-]{36}$/i.test(id)) return new Response("Formulaire introuvable", { status: 404 });

  const db = createAdminClient();
  const { data: sub } = await db
    .from("document_submissions")
    .select("pdf_path, mosque_id, submitted_by, data")
    .eq("id", id)
    .maybeSingle();
  const allowed =
    sub && (isStaffRole(user.role) || (user.mosqueId && sub.mosque_id === user.mosqueId) || sub.submitted_by === user.id);
  if (!allowed) return new Response("Formulaire introuvable", { status: 404 });

  const name = `autorisation-linky-${String((sub.data as { tradeName?: string }).tradeName ?? "mosquee")
    .normalize("NFD").replace(/[^\w]+/g, "-").toLowerCase()}.pdf`;
  const view = request.nextUrl.searchParams.get("voir") === "1";
  const { data } = await db.storage.from(DOCUMENTS_BUCKET).createSignedUrl(sub.pdf_path, 300, view ? undefined : { download: name });
  return data ? NextResponse.redirect(data.signedUrl) : new Response("Formulaire indisponible", { status: 404 });
}
