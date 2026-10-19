import "server-only";

import { requireStaff, requireUser, type CurrentUser } from "@/lib/auth";
import type { FormKind, LibraryDocument } from "@/lib/documents";
import { createAdminClient, DOCUMENTS_BUCKET, isSupabaseConfigured } from "@/lib/supabase/server";
import { isStaffRole } from "@/lib/workflow";

const COLUMNS = "id, title, description, category, file_name, mime, size, visible_to_mosques, form_kind, updated_at";

export type Submission = {
  id: string;
  form_kind: FormKind;
  created_at: string;
  data: { tradeName?: string; signerFirstName?: string; signerLastName?: string; prm?: string; city?: string };
  mosque: { name: string } | null;
};

/** Bibliothèque : tout pour l'équipe, seulement les documents partagés pour une mosquée. */
export async function listDocuments(user: CurrentUser) {
  if (!isSupabaseConfigured) return [];
  let query = createAdminClient().from("documents").select(COLUMNS).order("category").order("title");
  if (!isStaffRole(user.role)) query = query.eq("visible_to_mosques", true);
  const { data, error } = await query.returns<LibraryDocument[]>();
  if (error) throw error;
  return data ?? [];
}

export async function listSubmissions(user: CurrentUser) {
  if (!isSupabaseConfigured) return [];
  let query = createAdminClient()
    .from("document_submissions")
    .select("id, form_kind, created_at, data, mosque:mosques(name)")
    .order("created_at", { ascending: false })
    .limit(100);
  if (!isStaffRole(user.role)) query = user.mosqueId ? query.eq("mosque_id", user.mosqueId) : query.eq("submitted_by", user.id);
  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []) as unknown as Submission[];
}

export const getAdminDocuments = async () => {
  const user = await requireStaff("/admin/documents");
  return { user, documents: await listDocuments(user), submissions: await listSubmissions(user) };
};

export const getMosqueDocuments = async () => {
  const user = await requireUser("/espace/documents");
  return { user, documents: await listDocuments(user), submissions: await listSubmissions(user) };
};

/** Modèle PDF du formulaire en ligne, lu dans la bibliothèque (l'équipe peut en déposer une nouvelle version). */
export async function getFormTemplate(kind: FormKind) {
  const db = createAdminClient();
  const { data: doc } = await db
    .from("documents")
    .select("id, path")
    .eq("form_kind", kind)
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (!doc) return null;
  const { data: file } = await db.storage.from(DOCUMENTS_BUCKET).download(doc.path);
  return file ? { id: doc.id as string, bytes: new Uint8Array(await file.arrayBuffer()) } : null;
}
