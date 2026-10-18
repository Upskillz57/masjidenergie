// Statuts des demandes d'étude, rôles et libellés partagés entre l'admin, l'espace mosquée et les actions.

export const REQUEST_STATUSES = [
  "nouvelle",
  "en_attente",
  "en_cours",
  "etude_envoyee",
  "signee",
  "installee",
  "sans_suite",
] as const;
export type RequestStatus = (typeof REQUEST_STATUSES)[number];

export const STATUS_META: Record<RequestStatus, { label: string; hint: string; badge: string; dot: string }> = {
  nouvelle: {
    label: "Nouvelle",
    hint: "Reçue, pas encore traitée",
    badge: "bg-sky-100 text-sky-800 dark:bg-sky-400/15 dark:text-sky-300",
    dot: "bg-sky-500",
  },
  en_attente: {
    label: "En attente",
    hint: "En attente d’un retour ou de documents de la mosquée",
    badge: "bg-amber-100 text-amber-800 dark:bg-amber-400/15 dark:text-amber-300",
    dot: "bg-amber-500",
  },
  en_cours: {
    label: "En cours",
    hint: "Étude en cours de réalisation",
    badge: "bg-violet-100 text-violet-800 dark:bg-violet-400/15 dark:text-violet-300",
    dot: "bg-violet-500",
  },
  etude_envoyee: {
    label: "Étude envoyée",
    hint: "Étude et proposition transmises à la mosquée",
    badge: "bg-teal-100 text-teal-800 dark:bg-teal-400/15 dark:text-teal-300",
    dot: "bg-teal-500",
  },
  signee: {
    label: "Signée",
    hint: "Projet accepté, installation à planifier",
    badge: "bg-emerald-100 text-emerald-800 dark:bg-emerald-400/15 dark:text-emerald-300",
    dot: "bg-emerald-500",
  },
  installee: {
    label: "Installée",
    hint: "Centrale en service",
    badge: "bg-brand text-white",
    dot: "bg-brand",
  },
  sans_suite: {
    label: "Sans suite",
    hint: "Projet abandonné ou non éligible",
    badge: "bg-zinc-200 text-zinc-700 dark:bg-zinc-400/15 dark:text-zinc-300",
    dot: "bg-zinc-400",
  },
};

export const isRequestStatus = (s: unknown): s is RequestStatus =>
  typeof s === "string" && (REQUEST_STATUSES as readonly string[]).includes(s);

export const ROLES = ["admin", "equipe", "technique", "mosquee"] as const;
export type Role = (typeof ROLES)[number];
export const STAFF_ROLES = ["admin", "equipe", "technique"] as const satisfies readonly Role[];
export type StaffRole = (typeof STAFF_ROLES)[number];

export const ROLE_LABEL: Record<Role, string> = {
  admin: "Administrateur",
  equipe: "Équipe Masjid Energie",
  technique: "Équipe technique",
  mosquee: "Mosquée",
};

export const isStaffRole = (r: unknown): r is StaffRole =>
  typeof r === "string" && (STAFF_ROLES as readonly string[]).includes(r);

export const ACCOUNT_STATUS_META = {
  en_attente: { label: "En attente", badge: STATUS_META.en_attente.badge },
  approuvee: { label: "Approuvée", badge: STATUS_META.signee.badge },
  refusee: { label: "Refusée", badge: STATUS_META.sans_suite.badge },
} as const;
export type AccountRequestStatus = keyof typeof ACCOUNT_STATUS_META;

const timeZone = "Europe/Paris";
const dateFmt = new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "short", year: "numeric", timeZone });
const dateTimeFmt = new Intl.DateTimeFormat("fr-FR", {
  day: "numeric",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
  timeZone,
});
export const formatDate = (iso: string) => dateFmt.format(new Date(iso));
export const formatDateTime = (iso: string) => dateTimeFmt.format(new Date(iso));
export const formatSize = (bytes: number) =>
  bytes < 1024 * 1024
    ? `${Math.max(1, Math.round(bytes / 1024))} Ko`
    : `${(bytes / 1024 / 1024).toFixed(1).replace(".", ",")} Mo`;
