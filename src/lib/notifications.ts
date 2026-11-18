// Catalogue des notifications de l'équipe, partagé entre le serveur et le navigateur.

export const NOTIFY_CATEGORIES = {
  taches: { label: "Tâches", hint: "Tâche confiée, nouveau message, tâche terminée" },
  demandes: {
    label: "Demandes d’étude",
    hint: "Nouvelle demande, assignation, statut, commentaires, documents et études reçus",
  },
  comptes: { label: "Comptes et formulaires", hint: "Demandes de compte, autorisations Linky signées" },
} as const;
export type NotifyCategory = keyof typeof NOTIFY_CATEGORIES;
export const isNotifyCategory = (c: unknown): c is NotifyCategory => typeof c === "string" && c in NOTIFY_CATEGORIES;

export const NOTIFY_KINDS = {
  task_assigned: { category: "taches", icon: "check" },
  task_comment: { category: "taches", icon: "message" },
  task_mention: { category: "taches", icon: "message" },
  task_done: { category: "taches", icon: "check" },
  request_new: { category: "demandes", icon: "inbox" },
  request_assigned: { category: "demandes", icon: "inbox" },
  request_status: { category: "demandes", icon: "clock" },
  request_comment: { category: "demandes", icon: "message" },
  request_mention: { category: "demandes", icon: "message" },
  request_documents: { category: "demandes", icon: "clip" },
  study_received: { category: "demandes", icon: "sun" },
  account_request: { category: "comptes", icon: "userPlus" },
  linky_signed: { category: "comptes", icon: "file" },
} as const satisfies Record<string, { category: NotifyCategory; icon: string }>;
export type NotifyKind = keyof typeof NOTIFY_KINDS;

export type NotificationRow = {
  id: string;
  kind: NotifyKind;
  title: string;
  body: string | null;
  url: string;
  read_at: string | null;
  created_at: string;
  actor: string | null;
};

/** Prénoms cités avec « @ » dans un message (« @yacine », « @Brahim »), sans accents ni casse. */
const fold = (s: string) =>
  s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase();
export function mentionedIds(body: string, people: { id: string; full_name: string | null; email: string }[]) {
  const tags = new Set([...fold(body).matchAll(/@([a-z0-9-]{2,})/g)].map((m) => m[1]));
  if (!tags.size) return [];
  return people
    .filter((p) => {
      const first = fold((p.full_name || p.email).split(/[\s@]/)[0] ?? "");
      return first && tags.has(first);
    })
    .map((p) => p.id);
}
