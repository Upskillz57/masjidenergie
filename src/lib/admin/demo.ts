import "server-only";

import type { CurrentUser } from "@/lib/auth";
import type { AccountRequestRow, RequestFile, RequestRow } from "@/lib/admin/data";
import type { RequestStatus, Role } from "@/lib/workflow";

// Données fictives affichées uniquement en développement tant que Supabase n'est pas configuré,
// pour pouvoir parcourir l'admin et l'espace mosquée sans base de données.

export const isDemoMode = process.env.NODE_ENV !== "production";

export const DEMO_USER: CurrentUser = {
  id: "00000000-0000-4000-8000-000000000001",
  email: "demo@masjidenergie.fr",
  fullName: "Compte démo",
  role: "admin",
  mosqueId: null,
};

type Person = { id: string; full_name: string | null; email: string; role: Role };

const staff: Person[] = [
  { id: DEMO_USER.id, full_name: "Compte démo", email: DEMO_USER.email, role: "admin" },
  { id: "00000000-0000-4000-8000-000000000002", full_name: "Yacine B.", email: "yacine@masjidenergie.fr", role: "equipe" },
  { id: "00000000-0000-4000-8000-000000000003", full_name: "Karim T.", email: "karim@masjidenergie.fr", role: "technique" },
];

const seed: [string, string, string, string, RequestStatus, boolean, number, number][] = [
  ["Mosquée de la Fraternité", "12 rue des Tilleuls, 93200 Saint-Denis", "Mohamed", "Diallo", "nouvelle", true, 2, 0],
  ["Grande Mosquée de Mantes", "4 avenue de la Paix, 78200 Mantes-la-Jolie", "Samir", "Haddad", "nouvelle", false, 3, 1],
  ["Mosquée Al-Ihsan", "8 rue Victor Hugo, 69100 Villeurbanne", "Fatima", "Benali", "en_attente", false, 0, 2],
  ["Mosquée Ennour", "22 boulevard Jean Jaurès, 59000 Lille", "Abdelkader", "Mansouri", "en_cours", true, 4, 3],
  ["Mosquée Assalam", "3 chemin des Vignes, 44000 Nantes", "Ibrahim", "Keita", "etude_envoyee", false, 2, 5],
  ["Mosquée At-Tawhid", "15 rue de la République, 13002 Marseille", "Youssef", "Amrani", "signee", true, 3, 8],
  ["Mosquée Errahma", "1 place du Marché, 67000 Strasbourg", "Aminata", "Traoré", "installee", false, 2, 12],
  ["Centre culturel Al-Fajr", "7 allée des Roses, 31000 Toulouse", "Hassan", "El Idrissi", "sans_suite", false, 1, 20],
];

const isoDaysAgo = (d: number, h = 10) => new Date(Date.UTC(2026, 9, 17 - d, h, 15)).toISOString();

const requests: (RequestRow & {
  mosque_osm: string | null;
  message: string | null;
  project_motivations: string[];
  project_context: string | null;
  mosque_id: string | null;
})[] = seed.map(
  ([mosque, address, first, last, status, chargers, files, days], i) => {
    const assignee = status === "nouvelle" ? null : staff[(i % 2) + 1];
    return {
      id: `00000000-0000-4000-9000-00000000000${i + 1}`,
      number: 108 - i,
      created_at: isoDaysAgo(days, 9 + i),
      updated_at: isoDaysAgo(Math.max(0, days - 1)),
      status,
      mosque_name: mosque,
      mosque_address: address,
      mosque_osm: null,
      first_name: first,
      last_name: last,
      phone: `06 1${i} 45 67 8${i}`,
      email: `${first.toLowerCase()}.${last.toLowerCase().replace(/\s/g, "")}@exemple.fr`,
      chargers,
      message:
        i % 2 === 0
          ? "Notre salle de prière est chauffée à l’électricité, la facture a beaucoup augmenté cet hiver. Le toit fait environ 300 m²."
          : null,
      project_motivations: i % 2 === 0 ? ["economie", "hausse"] : [],
      project_context: null,
      mosque_id: null,
      assigned_to: assignee?.id ?? null,
      assignee,
      request_files: [{ count: files }],
    };
  },
);

export function demoListRequests(filters: { status?: string; q?: string; mine?: boolean; chargers?: boolean }) {
  const q = filters.q?.toLowerCase().trim();
  const rows = requests.filter(
    (r) =>
      (!filters.status || r.status === filters.status) &&
      (!filters.mine || r.assigned_to === DEMO_USER.id) &&
      (!filters.chargers || r.chargers) &&
      (!q || `${r.mosque_name} ${r.mosque_address} ${r.first_name} ${r.last_name} ${r.email}`.toLowerCase().includes(q)),
  );
  const counts = {} as Record<RequestStatus, number>;
  for (const r of requests) counts[r.status] = (counts[r.status] ?? 0) + 1;
  return { rows, counts, total: requests.length, user: DEMO_USER };
}

const demoBill = (label: string, amount: string) =>
  `data:image/svg+xml;utf8,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 400"><rect width="300" height="400" fill="#fff"/><rect width="300" height="56" fill="#0e5c47"/><text x="20" y="35" font-family="Arial" font-size="18" fill="#fff">Facture d'électricité</text><text x="20" y="100" font-family="Arial" font-size="14" fill="#55605c">${label}</text>${[130, 160, 190, 220, 250].map((y) => `<rect x="20" y="${y}" width="${180 + (y % 60)}" height="10" rx="3" fill="#ece9e2"/>`).join("")}<text x="20" y="320" font-family="Arial" font-size="14" fill="#55605c">Total TTC</text><text x="20" y="352" font-family="Arial" font-size="28" font-weight="bold" fill="#13343b">${amount}</text></svg>`,
  )}`;

const months = ["Janvier", "Février", "Mars", "Avril"];
const amounts = ["1 284,60 €", "1 097,15 €", "942,80 €", "811,30 €"];

export function demoGetRequest(id: string) {
  const request = requests.find((r) => r.id === id);
  if (!request) return null;
  const count = request.request_files[0].count;
  const files: RequestFile[] = Array.from({ length: count }, (_, i) => {
    const pdf = i === count - 1 && count > 2;
    return {
      id: `${id.slice(0, -1)}${i}`,
      name: pdf ? "releve-annuel-2025.pdf" : `facture-${months[i].toLowerCase()}-2026.jpg`,
      size: 380_000 + i * 120_000,
      mime: pdf ? "application/pdf" : "image/svg+xml",
      kind: "facture",
      created_at: request.created_at,
      url: pdf ? null : demoBill(`${months[i]} 2026`, amounts[i]),
    };
  });
  return {
    user: DEMO_USER,
    request,
    files,
    linky: null,
    comments:
      request.status === "nouvelle"
        ? []
        : [
            {
              id: "c1",
              body: "Appel fait avec le trésorier. Toiture terrasse accessible, pas d’ombrage. Il nous envoie les 12 derniers mois.",
              created_at: isoDaysAgo(1, 14),
              author_id: staff[1].id,
              author: staff[1],
            },
            {
              id: "c2",
              body: "Vu sur image satellite : environ 280 m² exploitables, orientation sud-ouest. Visite technique possible jeudi.",
              created_at: isoDaysAgo(0, 9),
              author_id: staff[2].id,
              author: staff[2],
            },
          ],
    events: [
      ...(request.status === "nouvelle"
        ? []
        : [
            {
              id: "e3",
              type: "status",
              data: { from: "nouvelle", to: request.status },
              created_at: isoDaysAgo(0, 9),
              actor: staff[1],
            },
            { id: "e2", type: "assign", data: { to: staff[2].full_name }, created_at: isoDaysAgo(1, 13), actor: staff[1] },
          ]),
      { id: "e1", type: "created", data: { bills: count }, created_at: request.created_at, actor: null },
    ],
    staff,
  };
}

export const demoAccountRequests: AccountRequestRow[] = [
  {
    id: "00000000-0000-4000-a000-000000000001",
    number: 12,
    created_at: isoDaysAgo(0, 8),
    status: "en_attente",
    mosque_name: "Mosquée de la Fraternité",
    mosque_address: "93200 Saint-Denis",
    first_name: "Mohamed",
    last_name: "Diallo",
    role_in_mosque: "Trésorier",
    email: "mohamed.diallo@exemple.fr",
    phone: "06 10 45 67 80",
    message: "Nous avons déjà envoyé une demande d’étude la semaine dernière.",
    reviewed_at: null,
    reviewer: null,
  },
  {
    id: "00000000-0000-4000-a000-000000000002",
    number: 11,
    created_at: isoDaysAgo(3, 16),
    status: "approuvee",
    mosque_name: "Mosquée Errahma",
    mosque_address: "67000 Strasbourg",
    first_name: "Aminata",
    last_name: "Traoré",
    role_in_mosque: "Présidente de l’association",
    email: "aminata.traore@exemple.fr",
    phone: "06 16 45 67 86",
    message: null,
    reviewed_at: isoDaysAgo(2, 10),
    reviewer: staff[1],
  },
];

export const demoTeam: (Person & { created_at: string; mosque: { name: string } | null })[] = [
  ...staff.map((s, i) => ({ ...s, created_at: isoDaysAgo(60 - i * 10), mosque: null })),
  {
    id: "00000000-0000-4000-8000-000000000004",
    full_name: "Aminata Traoré",
    email: "aminata.traore@exemple.fr",
    role: "mosquee",
    created_at: isoDaysAgo(2),
    mosque: { name: "Mosquée Errahma" },
  },
];
