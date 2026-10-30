"use server";

import { refresh } from "next/cache";
import { requireUser, type CurrentUser } from "@/lib/auth";
import { isMotivation, type SignedUpload } from "@/lib/dossier";
import { declaredFilesError, parseDeclaredFiles, registerUploads, signUploads } from "@/lib/dossier-data";
import { createAdminClient, isSupabaseConfigured } from "@/lib/supabase/server";
import { isStaffRole } from "@/lib/workflow";

const isId = (v: unknown): v is string => typeof v === "string" && /^[0-9a-f-]{36}$/i.test(v);

/** L'équipe, ou la mosquée à qui appartient la demande (mêmes règles que le suivi de projet). */
async function canEdit(user: CurrentUser, requestId: unknown) {
  if (!isSupabaseConfigured || !isId(requestId)) return false;
  if (isStaffRole(user.role)) return true;
  const { data } = await createAdminClient().from("study_requests").select("mosque_id, email").eq("id", requestId).maybeSingle();
  return Boolean(data && ((user.mosqueId && data.mosque_id === user.mosqueId) || data.email.toLowerCase() === user.email.toLowerCase()));
}

export async function prepareDossierUpload(
  requestId: string,
  rawFiles: string,
): Promise<{ uploads?: SignedUpload[]; error?: string }> {
  const user = await requireUser("/espace/projet");
  if (!(await canEdit(user, requestId))) return { error: "Demande introuvable." };
  const files = parseDeclaredFiles(rawFiles);
  const error = files ? declaredFilesError(files) : "Fichiers invalides.";
  if (error || !files) return { error: error ?? "Fichiers invalides." };
  return { uploads: await signUploads(createAdminClient(), requestId, files) };
}

export async function completeDossierUpload(requestId: string) {
  const user = await requireUser("/espace/projet");
  if (!(await canEdit(user, requestId))) return;
  await registerUploads(createAdminClient(), requestId, user.id);
  refresh();
}

export async function saveProjectContext(fd: FormData) {
  const user = await requireUser("/espace/projet");
  const requestId = fd.get("id");
  if (!(await canEdit(user, requestId))) return;
  const db = createAdminClient();
  await db
    .from("study_requests")
    .update({
      project_motivations: fd.getAll("motivations").filter(isMotivation),
      project_context: String(fd.get("context") ?? "").trim().slice(0, 2000) || null,
    })
    .eq("id", requestId as string);
  await db.from("request_events").insert({ request_id: requestId, actor_id: user.id, type: "context" });
  refresh();
}
