import "server-only";

import { isFileKind, MAX_FILE_BYTES, MAX_FILES, type DeclaredFile, type FileKind, type SignedUpload } from "@/lib/dossier";
import { createAdminClient, DOCUMENTS_BUCKET } from "@/lib/supabase/server";

type Db = ReturnType<typeof createAdminClient>;

const safeName = (name: string) =>
  name.normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^\w.-]+/g, "_").slice(-80) || "fichier";

/** Lit la liste de fichiers annoncée par le navigateur (les fichiers partent ensuite directement vers le stockage). */
export function parseDeclaredFiles(raw: unknown): DeclaredFile[] | null {
  try {
    const list: unknown = JSON.parse(String(raw ?? "[]"));
    if (!Array.isArray(list)) return null;
    const files = list.map((f) => ({
      kind: f?.kind,
      name: String(f?.name ?? "").slice(0, 200),
      size: Number(f?.size ?? 0),
      type: String(f?.type ?? ""),
    }));
    if (files.some((f) => !isFileKind(f.kind) || !f.name || !(f.size > 0))) return null;
    return files as DeclaredFile[];
  } catch {
    return null;
  }
}

export function declaredFilesError(files: DeclaredFile[]) {
  if (files.some((f) => f.size > MAX_FILE_BYTES)) return "20 Mo maximum par fichier.";
  for (const kind of Object.keys(MAX_FILES) as FileKind[]) {
    if (files.filter((f) => f.kind === kind).length > MAX_FILES[kind]) return `${MAX_FILES[kind]} fichiers maximum par pièce.`;
  }
  return null;
}

/** Autorisations d'envoi direct vers le bucket privé : `demandes/<id>/<pièce>/<uuid>-<nom>`. */
export async function signUploads(db: Db, requestId: string, files: DeclaredFile[]) {
  const uploads: SignedUpload[] = [];
  for (const [index, f] of files.entries()) {
    const path = `demandes/${requestId}/${f.kind}/${crypto.randomUUID()}-${safeName(f.name)}`;
    const { data, error } = await db.storage.from(DOCUMENTS_BUCKET).createSignedUploadUrl(path);
    if (error) console.error("[dossier] autorisation d'envoi impossible", error);
    else uploads.push({ index, path: data.path, token: data.token });
  }
  return uploads;
}

/**
 * Enregistre les fichiers réellement présents dans le stockage : rien ne vient du navigateur,
 * et une relance n'ajoute jamais de doublon.
 */
export async function registerUploads(db: Db, requestId: string, actorId: string | null) {
  const { data: known } = await db.from("request_files").select("path").eq("request_id", requestId);
  const paths = new Set((known ?? []).map((f) => f.path));
  const names: string[] = [];

  for (const kind of ["facture", "enedis", "toiture"] satisfies FileKind[]) {
    const folder = `demandes/${requestId}/${kind}`;
    const { data: stored } = await db.storage.from(DOCUMENTS_BUCKET).list(folder, { limit: 100 });
    for (const f of stored ?? []) {
      const path = `${folder}/${f.name}`;
      if (!f.id || paths.has(path)) continue;
      const name = f.name.slice(37);
      const { error } = await db.from("request_files").insert({
        request_id: requestId,
        path,
        name,
        size: f.metadata?.size ?? 0,
        mime: f.metadata?.mimetype ?? null,
        kind,
        uploaded_by: actorId,
      });
      if (error) console.error("[dossier] enregistrement du fichier impossible", error);
      else names.push(name);
    }
  }
  if (names.length) {
    await db.from("request_events").insert({ request_id: requestId, actor_id: actorId, type: "files", data: { names: names.join(", ") } });
  }
  return names;
}

/** Dernière autorisation Linky signée en ligne pour cette mosquée ou par le compte de ce contact. */
export async function findSignedLinky(db: Db, request: { mosque_id: string | null; email: string }) {
  const { data: people } = await db.from("profiles").select("id").eq("email", request.email.toLowerCase());
  const filters = [
    request.mosque_id && `mosque_id.eq.${request.mosque_id}`,
    people?.length && `submitted_by.in.(${people.map((p) => p.id).join(",")})`,
  ].filter(Boolean);
  if (!filters.length) return null;
  const { data } = await db
    .from("document_submissions")
    .select("id, created_at")
    .eq("form_kind", "linky")
    .or(filters.join(","))
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  return data as { id: string; created_at: string } | null;
}

export type DossierFile = { id: string; name: string; kind: FileKind; created_at: string };

/** Pièces déposées pour une demande, vues par la mosquée. */
export async function getDossierFiles(db: Db, requestId: string) {
  const { data } = await db
    .from("request_files")
    .select("id, name, kind, created_at")
    .eq("request_id", requestId)
    .order("created_at");
  return (data ?? []) as DossierFile[];
}
