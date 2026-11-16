import "server-only";

import { DEMO_USER } from "@/lib/admin/demo";
import { requireStaff } from "@/lib/auth";
import { createAdminClient, isSupabaseConfigured } from "@/lib/supabase/server";
import { addDays, todayISO, type Person, type RequestOption, type Task } from "@/lib/tasks";

// Données de l'espace de travail : tâches ouvertes, tâches terminées récemment, équipe et demandes.

const TASK_COLUMNS =
  "id, title, description, status, priority, due_date, due_time, request_id, assigned_to, created_by, completed_at, created_at, updated_at, task_comments(count)";

type TaskRow = Omit<Task, "comments"> & { task_comments: { count: number }[] };
const toTask = ({ task_comments, due_time, ...t }: TaskRow): Task => ({
  ...t,
  due_time: due_time ? due_time.slice(0, 5) : null,
  comments: task_comments?.[0]?.count ?? 0,
});

/** Les tâches terminées restent visibles 60 jours (tableau et calendrier). */
const DONE_WINDOW_DAYS = 60;

export async function listWorkspace() {
  const user = await requireStaff("/admin/travail");
  const today = todayISO();
  if (!isSupabaseConfigured) return { user, today, missingTables: false as const, ...demoWorkspace(today) };
  const db = createAdminClient();
  const since = new Date(Date.now() - DONE_WINDOW_DAYS * 86400000).toISOString();

  const [open, done, staff, requests] = await Promise.all([
    db.from("tasks").select(TASK_COLUMNS).neq("status", "termine").limit(1000),
    db
      .from("tasks")
      .select(TASK_COLUMNS)
      .eq("status", "termine")
      .gte("completed_at", since)
      .order("completed_at", { ascending: false })
      .limit(300),
    db.from("profiles").select("id, full_name, email").in("role", ["admin", "equipe", "technique"]).order("full_name"),
    db.from("study_requests").select("id, number, mosque_name, status").order("created_at", { ascending: false }).limit(500),
  ]);
  if (open.error) {
    // Tables absentes : migration 0005 pas encore exécutée dans Supabase.
    if (open.error.code === "PGRST205" || open.error.code === "42P01")
      return { user, today, missingTables: true as const, tasks: [] as Task[], staff: [] as Person[], requests: [] as RequestOption[] };
    throw open.error;
  }

  return {
    user,
    today,
    missingTables: false as const,
    tasks: [...(open.data ?? []), ...(done.data ?? [])].map((t) => toTask(t as TaskRow)),
    staff: (staff.data ?? []) as Person[],
    requests: (requests.data ?? []) as RequestOption[],
  };
}

/** Tâches d'une demande d'étude (carte « Tâches » de la page de la demande). */
export async function listRequestTasks(requestId: string) {
  await requireStaff();
  if (!isSupabaseConfigured) return demoWorkspace(todayISO()).tasks.filter((t) => t.request_id === requestId);
  const { data } = await createAdminClient()
    .from("tasks")
    .select(TASK_COLUMNS)
    .eq("request_id", requestId)
    .order("created_at")
    .limit(100);
  return (data ?? []).map((t) => toTask(t as TaskRow));
}

/** Pastille du menu : mes tâches ouvertes. */
export async function countMyOpenTasks(userId: string) {
  if (!isSupabaseConfigured) return 3;
  const { count } = await createAdminClient()
    .from("tasks")
    .select("id", { count: "exact", head: true })
    .eq("assigned_to", userId)
    .neq("status", "termine");
  return count ?? 0;
}

// --- Démo (sans Supabase) ------------------------------------------------------

const YACINE = "00000000-0000-4000-8000-000000000002";
const KARIM = "00000000-0000-4000-8000-000000000003";
const req = (n: number) => `00000000-0000-4000-9000-00000000000${n}`;

function demoWorkspace(today: string) {
  const staff: Person[] = [
    { id: DEMO_USER.id, full_name: "Compte démo", email: DEMO_USER.email },
    { id: YACINE, full_name: "Yacine B.", email: "yacine@masjidenergie.fr" },
    { id: KARIM, full_name: "Karim T.", email: "karim@masjidenergie.fr" },
  ];
  const requests: RequestOption[] = [
    { id: req(1), number: 108, mosque_name: "Mosquée de la Fraternité", status: "nouvelle" },
    { id: req(2), number: 107, mosque_name: "Grande Mosquée de Mantes", status: "nouvelle" },
    { id: req(3), number: 106, mosque_name: "Mosquée Al-Ihsan", status: "en_attente" },
    { id: req(4), number: 105, mosque_name: "Mosquée Ennour", status: "en_cours" },
    { id: req(5), number: 104, mosque_name: "Mosquée Assalam", status: "etude_envoyee" },
    { id: req(6), number: 103, mosque_name: "Mosquée At-Tawhid", status: "signee" },
  ];
  const at = (d: number) => `${addDays(today, d)}T09:00:00.000Z`;
  const rows: [string, Task["status"], Task["priority"], number | null, string | null, string | null, number, number][] = [
    ["Appeler le président pour qualifier le projet", "a_faire", "haute", 0, req(1), DEMO_USER.id, 0, -1],
    ["Relancer pour l’autorisation Enedis", "a_faire", "normale", -2, req(3), YACINE, 2, -6],
    ["Vérifier les factures reçues", "a_faire", "normale", 1, req(2), null, 0, -1],
    ["Préparer la visite technique", "a_faire", "normale", 4, req(4), KARIM, 1, -3],
    ["Commander les relevés Linky", "a_faire", "basse", null, req(3), null, 0, -2],
    ["Mettre à jour la plaquette commerciale", "a_faire", "basse", null, null, DEMO_USER.id, 0, -8],
    ["Calepinage et simulation de production", "en_cours", "haute", 2, req(4), KARIM, 3, -5],
    ["Rédiger la proposition financière", "en_cours", "normale", 3, req(5), DEMO_USER.id, 1, -4],
    ["Planifier la pose avec l’installateur", "en_cours", "normale", 8, req(6), YACINE, 0, -3],
    ["Envoyer l’étude à la mosquée", "termine", "normale", -1, req(5), YACINE, 2, -7],
    ["Signature du devis", "termine", "haute", -3, req(6), DEMO_USER.id, 0, -10],
  ];
  const tasks: Task[] = rows.map(([title, status, priority, due, requestId, assignee, comments, created], i) => ({
    id: `00000000-0000-4000-a000-0000000000${i + 10}`,
    title,
    description:
      i === 0 ? "Comprendre la consommation, la surface de toiture disponible et le calendrier de décision du bureau." : null,
    status,
    priority,
    due_date: due === null ? null : addDays(today, due),
    due_time: i === 0 ? "10:30" : i === 3 ? "14:00" : null,
    request_id: requestId,
    assigned_to: assignee,
    created_by: DEMO_USER.id,
    completed_at: status === "termine" ? at(due ?? 0) : null,
    created_at: at(created),
    updated_at: at(created),
    comments,
  }));
  return { tasks, staff, requests };
}
