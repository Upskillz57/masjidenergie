"use server";

import { refresh } from "next/cache";
import { inviteUser } from "@/lib/admin/invite";
import { requireAdmin, requireStaff } from "@/lib/auth";
import { createAdminClient, DOCUMENTS_BUCKET, isSupabaseConfigured } from "@/lib/supabase/server";
import { isRequestStatus, isStaffRole, ROLES, type Role } from "@/lib/workflow";

export type ActionState = { ok?: boolean; message: string } | null;

const id = (fd: FormData, key = "id") => {
  const v = String(fd.get(key) ?? "");
  if (!/^[0-9a-f-]{36}$/i.test(v)) throw new Error("Identifiant invalide");
  return v;
};

// Mode démo (développement sans Supabase) : les actions ne modifient rien.
const demoMessage: ActionState = { message: "Mode démo : configurez Supabase pour enregistrer les modifications." };

const logEvent = (requestId: string, actorId: string, type: string, data: Record<string, unknown> = {}) =>
  createAdminClient().from("request_events").insert({ request_id: requestId, actor_id: actorId, type, data });

// --- Demandes d'étude --------------------------------------------------------

export async function updateRequestStatus(formData: FormData) {
  const user = await requireStaff();
  if (!isSupabaseConfigured) return;
  const requestId = id(formData);
  const status = formData.get("status");
  if (!isRequestStatus(status)) return;

  const db = createAdminClient();
  const { data: before } = await db.from("study_requests").select("status").eq("id", requestId).single();
  if (!before || before.status === status) return;
  await db.from("study_requests").update({ status }).eq("id", requestId);
  await logEvent(requestId, user.id, "status", { from: before.status, to: status });
  refresh();
}

export async function assignRequest(formData: FormData) {
  const user = await requireStaff();
  if (!isSupabaseConfigured) return;
  const requestId = id(formData);
  const raw = String(formData.get("assignee") ?? "");
  const db = createAdminClient();

  let assignee: { id: string; full_name: string | null; email: string } | null = null;
  if (raw) {
    const { data } = await db.from("profiles").select("id, full_name, email, role").eq("id", raw).maybeSingle();
    if (!data || !isStaffRole(data.role)) return;
    assignee = data;
  }
  await db.from("study_requests").update({ assigned_to: assignee?.id ?? null }).eq("id", requestId);
  await logEvent(requestId, user.id, "assign", { to: assignee ? assignee.full_name || assignee.email : null });
  refresh();
}

export async function addComment(formData: FormData) {
  const user = await requireStaff();
  if (!isSupabaseConfigured) return;
  const requestId = id(formData);
  const body = String(formData.get("body") ?? "").trim().slice(0, 5000);
  if (!body) return;
  await createAdminClient().from("request_comments").insert({ request_id: requestId, author_id: user.id, body });
  refresh();
}

export async function deleteComment(formData: FormData) {
  const user = await requireStaff();
  if (!isSupabaseConfigured) return;
  const commentId = id(formData);
  const db = createAdminClient();
  const { data } = await db.from("request_comments").select("author_id").eq("id", commentId).maybeSingle();
  if (!data || (data.author_id !== user.id && user.role !== "admin")) return;
  await db.from("request_comments").delete().eq("id", commentId);
  refresh();
}

const safeName = (name: string) =>
  name.normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^\w.-]+/g, "_").slice(-80) || "fichier";

export async function uploadRequestFiles(formData: FormData) {
  const user = await requireStaff();
  if (!isSupabaseConfigured) return;
  const requestId = id(formData);
  const kind = formData.get("kind") === "facture" ? "facture" : "document";
  const files = formData.getAll("files").filter((f): f is File => f instanceof File && f.size > 0);
  const db = createAdminClient();

  const names: string[] = [];
  for (const f of files.slice(0, 10)) {
    const path = `demandes/${requestId}/${crypto.randomUUID()}-${safeName(f.name)}`;
    const up = await db.storage.from(DOCUMENTS_BUCKET).upload(path, f, { contentType: f.type || undefined });
    if (up.error) continue;
    await db.from("request_files").insert({
      request_id: requestId,
      path,
      name: f.name,
      size: f.size,
      mime: f.type || null,
      kind,
      uploaded_by: user.id,
    });
    names.push(f.name);
  }
  if (names.length) await logEvent(requestId, user.id, "files", { names: names.join(", ") });
  refresh();
}

export async function deleteRequestFile(formData: FormData) {
  const user = await requireStaff();
  if (!isSupabaseConfigured) return;
  const fileId = id(formData);
  const db = createAdminClient();
  const { data } = await db.from("request_files").select("path, name, request_id").eq("id", fileId).maybeSingle();
  if (!data) return;
  await db.storage.from(DOCUMENTS_BUCKET).remove([data.path]);
  await db.from("request_files").delete().eq("id", fileId);
  await logEvent(data.request_id, user.id, "file_deleted", { name: data.name });
  refresh();
}

// --- Demandes de création de compte -------------------------------------------

export async function approveAccountRequest(_: ActionState, formData: FormData): Promise<ActionState> {
  const user = await requireStaff();
  if (!isSupabaseConfigured) return demoMessage;
  const accountId = id(formData);
  const db = createAdminClient();
  const { data: req } = await db.from("account_requests").select("*").eq("id", accountId).maybeSingle();
  if (!req || req.status !== "en_attente") return { message: "Cette demande a déjà été traitée." };

  const { data: mosque, error } = await db
    .from("mosques")
    .insert({ name: req.mosque_name, address: req.mosque_address })
    .select("id")
    .single();
  if (error) return { message: "Impossible de créer la mosquée." };

  const invited = await inviteUser({
    email: req.email,
    fullName: `${req.first_name} ${req.last_name}`,
    role: "mosquee",
    mosqueId: mosque.id,
  });
  if (!invited.ok) {
    await db.from("mosques").delete().eq("id", mosque.id);
    return { message: invited.message };
  }

  await db
    .from("account_requests")
    .update({ status: "approuvee", reviewed_by: user.id, reviewed_at: new Date().toISOString(), mosque_id: mosque.id })
    .eq("id", accountId);
  // Rattache les demandes d'étude déjà envoyées avec cette adresse.
  await db.from("study_requests").update({ mosque_id: mosque.id }).ilike("email", req.email).is("mosque_id", null);
  refresh();
  return { ok: true, message: `Compte créé : une invitation a été envoyée à ${req.email}.` };
}

export async function rejectAccountRequest(formData: FormData) {
  const user = await requireStaff();
  if (!isSupabaseConfigured) return;
  await createAdminClient()
    .from("account_requests")
    .update({ status: "refusee", reviewed_by: user.id, reviewed_at: new Date().toISOString() })
    .eq("id", id(formData))
    .eq("status", "en_attente");
  refresh();
}

// --- Équipe (administrateurs uniquement) --------------------------------------

export async function inviteTeamMember(_: ActionState, formData: FormData): Promise<ActionState> {
  await requireAdmin();
  if (!isSupabaseConfigured) return demoMessage;
  const email = String(formData.get("email") ?? "").trim();
  const fullName = String(formData.get("fullName") ?? "").trim();
  const role = formData.get("role");
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { message: "Adresse e-mail invalide." };
  if (!fullName) return { message: "Indiquez le nom de la personne." };
  if (!isStaffRole(role)) return { message: "Choisissez un rôle." };

  const res = await inviteUser({ email, fullName, role });
  if (!res.ok) return { message: res.message };
  refresh();
  return { ok: true, message: `Invitation envoyée à ${email}.` };
}

export async function changeMemberRole(formData: FormData) {
  const user = await requireAdmin();
  if (!isSupabaseConfigured) return;
  const memberId = id(formData);
  const role = formData.get("role");
  if (memberId === user.id || !ROLES.includes(role as Role)) return;
  await createAdminClient().from("profiles").update({ role }).eq("id", memberId);
  refresh();
}

export async function removeMember(formData: FormData) {
  const user = await requireAdmin();
  if (!isSupabaseConfigured) return;
  const memberId = id(formData);
  if (memberId === user.id) return;
  await createAdminClient().auth.admin.deleteUser(memberId);
  refresh();
}
