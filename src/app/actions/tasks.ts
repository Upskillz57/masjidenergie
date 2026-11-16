"use server";

import { refresh } from "next/cache";
import { requireStaff, type CurrentUser } from "@/lib/auth";
import { emailLayout, escapeHtml, sendEmail } from "@/lib/email";
import { site } from "@/lib/site";
import { createAdminClient, isSupabaseConfigured } from "@/lib/supabase/server";
import { isDay, isTaskPriority, isTaskStatus, type TaskComment, type TaskPatch } from "@/lib/tasks";
import { isStaffRole } from "@/lib/workflow";

// Actions de l'espace de travail. L'interface met à jour l'écran tout de suite ;
// ces actions enregistrent, puis rafraîchissent la page pour toute l'équipe.

export type TaskResult = { ok: true } | { ok: false; message: string };

const isId = (v: unknown): v is string => typeof v === "string" && /^[0-9a-f-]{36}$/i.test(v);
const fail = (message: string): TaskResult => ({ ok: false, message });

type Db = ReturnType<typeof createAdminClient>;

/** Ne garde que les champs connus et valides. */
async function clean(db: Db, patch: TaskPatch) {
  const out: Record<string, string | null> = {};
  if ("title" in patch) {
    const title = String(patch.title ?? "").trim().slice(0, 200);
    if (!title) throw new Error("Le titre est obligatoire.");
    out.title = title;
  }
  if ("description" in patch) out.description = String(patch.description ?? "").trim().slice(0, 5000) || null;
  if ("status" in patch && isTaskStatus(patch.status)) out.status = patch.status;
  if ("priority" in patch && isTaskPriority(patch.priority)) out.priority = patch.priority;
  if ("due_date" in patch) out.due_date = isDay(patch.due_date) ? patch.due_date : null;
  if ("due_time" in patch) out.due_time = /^\d{2}:\d{2}$/.test(String(patch.due_time)) ? String(patch.due_time) : null;
  if ("request_id" in patch) out.request_id = isId(patch.request_id) ? patch.request_id : null;
  if ("assigned_to" in patch) {
    out.assigned_to = null;
    if (isId(patch.assigned_to)) {
      const { data } = await db.from("profiles").select("role").eq("id", patch.assigned_to).maybeSingle();
      if (data && isStaffRole(data.role)) out.assigned_to = patch.assigned_to;
    }
  }
  return out;
}

const logRequest = async (db: Db, requestId: string | null, actorId: string, type: string, title: string) => {
  if (requestId) await db.from("request_events").insert({ request_id: requestId, actor_id: actorId, type, data: { title } });
};

/** Prévient la personne à qui l'on confie une tâche (sauf si elle se l'assigne elle-même). */
async function notifyAssignee(db: Db, user: CurrentUser, taskId: string, assigneeId: string | null) {
  if (!assigneeId || assigneeId === user.id) return;
  const [{ data: person }, { data: task }] = await Promise.all([
    db.from("profiles").select("email, full_name").eq("id", assigneeId).maybeSingle(),
    db.from("tasks").select("title, due_date, request:study_requests(number, mosque_name)").eq("id", taskId).maybeSingle(),
  ]);
  if (!person || !task) return;
  const request = task.request as unknown as { number: number; mosque_name: string } | null;
  const p = (t: string) => `<p style="margin:0 0 14px">${t}</p>`;
  const due = task.due_date
    ? new Intl.DateTimeFormat("fr-FR", { weekday: "long", day: "numeric", month: "long", timeZone: "UTC" }).format(
        new Date(`${task.due_date}T00:00:00Z`),
      )
    : null;
  const by = user.fullName || user.email;
  await sendEmail({
    to: [person.email],
    replyTo: user.email,
    subject: `Nouvelle tâche : ${task.title}`,
    html: emailLayout(
      task.title,
      [
        p(`${escapeHtml(by)} vous a confié une tâche dans l’espace de travail.`),
        p(
          `<strong>${escapeHtml(task.title)}</strong>${request ? `<br>Demande n°${request.number} · ${escapeHtml(request.mosque_name)}` : ""}${due ? `<br>À faire pour le ${due}` : ""}`,
        ),
      ].join(""),
      { label: "Ouvrir la tâche", href: `${site.url}/admin/travail?tache=${taskId}` },
      { eyebrow: "Espace de travail", preheader: `${by} vous a confié une tâche.` },
    ),
  });
}

export async function createTask(id: string, patch: TaskPatch): Promise<TaskResult> {
  const user = await requireStaff();
  if (!isSupabaseConfigured) return { ok: true };
  if (!isId(id)) return fail("Identifiant invalide.");
  const db = createAdminClient();
  let row: Record<string, string | null>;
  try {
    row = await clean(db, { status: "a_faire", ...patch });
  } catch (e) {
    return fail((e as Error).message);
  }
  if (!row.title) return fail("Le titre est obligatoire.");
  const done = row.status === "termine";
  const { error } = await db.from("tasks").insert({
    ...row,
    id,
    created_by: user.id,
    completed_at: done ? new Date().toISOString() : null,
    completed_by: done ? user.id : null,
  });
  if (error) return fail("Impossible d’enregistrer la tâche.");
  await logRequest(db, row.request_id ?? null, user.id, "task_added", row.title);
  await notifyAssignee(db, user, id, row.assigned_to ?? null);
  refresh();
  return { ok: true };
}

export async function updateTask(id: string, patch: TaskPatch): Promise<TaskResult> {
  const user = await requireStaff();
  if (!isSupabaseConfigured) return { ok: true };
  if (!isId(id)) return fail("Identifiant invalide.");
  const db = createAdminClient();
  const { data: before } = await db
    .from("tasks")
    .select("status, assigned_to, request_id, title")
    .eq("id", id)
    .maybeSingle();
  if (!before) return fail("Cette tâche a été supprimée.");

  let row: Record<string, string | null>;
  try {
    row = await clean(db, patch);
  } catch (e) {
    return fail((e as Error).message);
  }
  if (!Object.keys(row).length) return { ok: true };
  if (row.status && row.status !== before.status) {
    const done = row.status === "termine";
    row.completed_at = done ? new Date().toISOString() : null;
    row.completed_by = done ? user.id : null;
  }
  const { error } = await db.from("tasks").update(row).eq("id", id);
  if (error) return fail("Impossible d’enregistrer la modification.");

  if (row.status === "termine" && before.status !== "termine")
    await logRequest(db, row.request_id ?? before.request_id, user.id, "task_done", row.title ?? before.title);
  if ("assigned_to" in row && row.assigned_to !== before.assigned_to) await notifyAssignee(db, user, id, row.assigned_to);
  refresh();
  return { ok: true };
}

export async function deleteTask(id: string): Promise<TaskResult> {
  await requireStaff();
  if (!isSupabaseConfigured) return { ok: true };
  if (!isId(id)) return fail("Identifiant invalide.");
  await createAdminClient().from("tasks").delete().eq("id", id);
  refresh();
  return { ok: true };
}

// --- Commentaires ----------------------------------------------------------------

export async function listTaskComments(taskId: string): Promise<TaskComment[]> {
  await requireStaff();
  if (!isSupabaseConfigured || !isId(taskId)) return [];
  const { data } = await createAdminClient()
    .from("task_comments")
    .select("id, body, created_at, author_id, author:profiles(full_name, email)")
    .eq("task_id", taskId)
    .order("created_at");
  return (data ?? []).map((c) => {
    const a = c.author as unknown as { full_name: string | null; email: string } | null;
    return {
      id: c.id,
      body: c.body,
      created_at: c.created_at,
      author_id: c.author_id,
      author: a ? a.full_name || a.email : "Ancien membre",
    };
  });
}

export async function addTaskComment(taskId: string, body: string): Promise<TaskComment | null> {
  const user = await requireStaff();
  const text = body.trim().slice(0, 5000);
  if (!text || !isId(taskId)) return null;
  const comment = { body: text, author_id: user.id, author: user.fullName || user.email };
  if (!isSupabaseConfigured) return { ...comment, id: crypto.randomUUID(), created_at: new Date().toISOString() };
  const { data, error } = await createAdminClient()
    .from("task_comments")
    .insert({ task_id: taskId, author_id: user.id, body: text })
    .select("id, created_at")
    .single();
  if (error) return null;
  refresh();
  return { ...comment, ...data };
}

export async function deleteTaskComment(commentId: string): Promise<TaskResult> {
  const user = await requireStaff();
  if (!isSupabaseConfigured) return { ok: true };
  if (!isId(commentId)) return fail("Identifiant invalide.");
  const db = createAdminClient();
  const { data } = await db.from("task_comments").select("author_id").eq("id", commentId).maybeSingle();
  if (!data || (data.author_id !== user.id && user.role !== "admin"))
    return fail("Vous ne pouvez pas supprimer ce commentaire.");
  await db.from("task_comments").delete().eq("id", commentId);
  refresh();
  return { ok: true };
}
