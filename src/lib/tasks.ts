// Tâches de l'espace de travail : types, libellés et règles de tri partagés entre le serveur et le navigateur.

export const TASK_STATUSES = ["a_faire", "en_cours", "termine"] as const;
export type TaskStatus = (typeof TASK_STATUSES)[number];

export const TASK_PRIORITIES = ["haute", "normale", "basse"] as const;
export type TaskPriority = (typeof TASK_PRIORITIES)[number];

export const TASK_STATUS_META: Record<TaskStatus, { label: string; empty: string; dot: string; badge: string }> = {
  a_faire: {
    label: "À faire",
    empty: "Rien en attente.",
    dot: "bg-sky-500",
    badge: "bg-sky-100 text-sky-800 dark:bg-sky-400/15 dark:text-sky-300",
  },
  en_cours: {
    label: "En cours",
    empty: "Glissez ici une tâche que vous commencez.",
    dot: "bg-violet-500",
    badge: "bg-violet-100 text-violet-800 dark:bg-violet-400/15 dark:text-violet-300",
  },
  termine: {
    label: "Terminé",
    empty: "Les tâches terminées apparaîtront ici.",
    dot: "bg-emerald-500",
    badge: "bg-emerald-100 text-emerald-800 dark:bg-emerald-400/15 dark:text-emerald-300",
  },
};

export const PRIORITY_META: Record<TaskPriority, { label: string; bar: string; chip: string }> = {
  haute: {
    label: "Urgente",
    bar: "bg-red-500",
    chip: "bg-red-100 text-red-700 dark:bg-red-400/15 dark:text-red-300",
  },
  normale: { label: "Normale", bar: "bg-transparent", chip: "bg-bg-soft text-muted" },
  basse: { label: "Basse", bar: "bg-zinc-300 dark:bg-zinc-600", chip: "bg-bg-soft text-muted" },
};

export const isTaskStatus = (s: unknown): s is TaskStatus =>
  typeof s === "string" && (TASK_STATUSES as readonly string[]).includes(s);
export const isTaskPriority = (s: unknown): s is TaskPriority =>
  typeof s === "string" && (TASK_PRIORITIES as readonly string[]).includes(s);

export type Person = { id: string; full_name: string | null; email: string };

export type Task = {
  id: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  /** AAAA-MM-JJ */
  due_date: string | null;
  /** HH:MM */
  due_time: string | null;
  request_id: string | null;
  assigned_to: string | null;
  created_by: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
  comments: number;
};

/** Champs modifiables d'une tâche (création ou mise à jour). */
export type TaskPatch = Partial<
  Pick<Task, "title" | "description" | "status" | "priority" | "due_date" | "due_time" | "request_id" | "assigned_to">
>;

/** Demande d'étude proposée pour relier une tâche. */
export type RequestOption = { id: string; number: number; mosque_name: string; status: string };

export type TaskComment = { id: string; body: string; created_at: string; author_id: string | null; author: string };

// --- Dates (jour civil à Paris, au format AAAA-MM-JJ) ---------------------------

const dayFmt = new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Paris", year: "numeric", month: "2-digit", day: "2-digit" });
export const todayISO = () => dayFmt.format(new Date());

export const parseDay = (iso: string) => {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d));
};
export const toDay = (d: Date) => d.toISOString().slice(0, 10);
export const addDays = (iso: string, n: number) => {
  const d = parseDay(iso);
  d.setUTCDate(d.getUTCDate() + n);
  return toDay(d);
};
/** Lundi de la semaine du jour donné. */
export const weekStart = (iso: string) => addDays(iso, -((parseDay(iso).getUTCDay() + 6) % 7));
export const isDay = (s: unknown): s is string => typeof s === "string" && /^\d{4}-\d{2}-\d{2}$/.test(s) && !isNaN(parseDay(s).getTime());

const shortFmt = new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "short", timeZone: "UTC" });
const weekdayFmt = new Intl.DateTimeFormat("fr-FR", { weekday: "long", timeZone: "UTC" });
const longFmt = new Intl.DateTimeFormat("fr-FR", { weekday: "long", day: "numeric", month: "long", timeZone: "UTC" });
export const longDay = (iso: string) => longFmt.format(parseDay(iso)).replace(/^./, (c) => c.toUpperCase());

/** « Aujourd'hui », « Demain », « Hier », « Jeudi » (dans la semaine) ou « 12 nov. ». */
export function dueLabel(due: string, today: string) {
  const diff = Math.round((parseDay(due).getTime() - parseDay(today).getTime()) / 86400000);
  if (diff === 0) return "Aujourd’hui";
  if (diff === 1) return "Demain";
  if (diff === -1) return "Hier";
  if (diff > 1 && diff < 7) return weekdayFmt.format(parseDay(due)).replace(/^./, (c) => c.toUpperCase());
  return shortFmt.format(parseDay(due));
}

export type DueState = "late" | "today" | "soon" | "later" | "none";
export function dueState(t: Pick<Task, "due_date" | "status">, today: string): DueState {
  if (!t.due_date) return "none";
  if (t.status === "termine") return "later";
  if (t.due_date < today) return "late";
  if (t.due_date === today) return "today";
  return t.due_date <= addDays(today, 3) ? "soon" : "later";
}

const priorityRank: Record<TaskPriority, number> = { haute: 0, normale: 1, basse: 2 };

/** Ordre de travail : en retard d'abord, puis urgentes, puis par échéance la plus proche. */
export function compareTasks(a: Task, b: Task, today: string) {
  if (a.status === "termine" && b.status === "termine") return (b.completed_at ?? "").localeCompare(a.completed_at ?? "");
  const lateA = a.due_date !== null && a.due_date < today;
  const lateB = b.due_date !== null && b.due_date < today;
  if (lateA !== lateB) return lateA ? -1 : 1;
  if (a.priority !== b.priority) return priorityRank[a.priority] - priorityRank[b.priority];
  if (a.due_date !== b.due_date) return !a.due_date ? 1 : !b.due_date ? -1 : a.due_date.localeCompare(b.due_date);
  if (a.due_time !== b.due_time) return !a.due_time ? 1 : !b.due_time ? -1 : a.due_time.localeCompare(b.due_time);
  return a.created_at.localeCompare(b.created_at);
}

export const personName = (p: Person | undefined | null) => (p ? p.full_name || p.email : "");
export const initials = (p: Person | undefined | null) =>
  personName(p)
    .split(/[\s@.]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]!.toUpperCase())
    .join("");

const avatarTones = ["bg-emerald-600", "bg-sky-600", "bg-violet-600", "bg-amber-600", "bg-rose-600", "bg-teal-600", "bg-indigo-600"];
export const avatarTone = (id: string) => avatarTones[[...id].reduce((n, c) => n + c.charCodeAt(0), 0) % avatarTones.length];
