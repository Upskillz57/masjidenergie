import "server-only";

import { demoAccountRequests, demoGetRequest, demoListRequests, demoTeam } from "@/lib/admin/demo";
import { requireAdmin, requireStaff } from "@/lib/auth";
import { createAdminClient, DOCUMENTS_BUCKET, isSupabaseConfigured } from "@/lib/supabase/server";
import {
  isRequestStatus,
  REQUEST_STATUSES,
  type AccountRequestStatus,
  type RequestStatus,
  type Role,
} from "@/lib/workflow";

// Couche d'accès aux données de l'admin : chaque fonction vérifie le rôle avant de lire.

export type RequestRow = {
  id: string;
  number: number;
  created_at: string;
  updated_at: string;
  status: RequestStatus;
  mosque_name: string;
  mosque_address: string | null;
  first_name: string;
  last_name: string;
  phone: string;
  email: string;
  chargers: boolean;
  assigned_to: string | null;
  assignee: { full_name: string | null; email: string } | null;
  request_files: { count: number }[];
};

export type RequestFilters = { status?: string; q?: string; mine?: boolean; chargers?: boolean };

export async function listRequests(filters: RequestFilters) {
  const user = await requireStaff();
  if (!isSupabaseConfigured) return demoListRequests(filters);
  const db = createAdminClient();

  let query = db
    .from("study_requests")
    .select(
      "id, number, created_at, updated_at, status, mosque_name, mosque_address, first_name, last_name, phone, email, chargers, assigned_to, assignee:profiles!study_requests_assigned_to_fkey(full_name, email), request_files(count)",
    )
    .order("created_at", { ascending: false })
    .limit(200);

  if (isRequestStatus(filters.status)) query = query.eq("status", filters.status);
  if (filters.mine) query = query.eq("assigned_to", user.id);
  if (filters.chargers) query = query.eq("chargers", true);
  const q = filters.q?.replace(/[,()%*\\]/g, " ").trim();
  if (q) {
    const like = `%${q}%`;
    query = query.or(
      `mosque_name.ilike.${like},mosque_address.ilike.${like},last_name.ilike.${like},first_name.ilike.${like},email.ilike.${like},phone.ilike.${like}`,
    );
  }

  const [{ data: rows, error }, { data: all }] = await Promise.all([
    query.returns<RequestRow[]>(),
    db.from("study_requests").select("status"),
  ]);
  if (error) throw error;

  const counts = Object.fromEntries(REQUEST_STATUSES.map((s) => [s, 0])) as Record<RequestStatus, number>;
  for (const r of all ?? []) if (isRequestStatus(r.status)) counts[r.status]++;

  return { rows: rows ?? [], counts, total: all?.length ?? 0, user };
}

export type RequestFile = {
  id: string;
  name: string;
  size: number;
  mime: string | null;
  kind: "facture" | "document";
  created_at: string;
  url: string | null;
};

export async function getRequest(id: string) {
  const user = await requireStaff(`/admin/demandes/${id}`);
  if (!/^[0-9a-f-]{36}$/i.test(id)) return null;
  if (!isSupabaseConfigured) return demoGetRequest(id);
  const db = createAdminClient();

  const [req, files, comments, events, staff] = await Promise.all([
    db.from("study_requests").select("*").eq("id", id).maybeSingle(),
    db.from("request_files").select("id, path, name, size, mime, kind, created_at").eq("request_id", id).order("created_at"),
    db
      .from("request_comments")
      .select("id, body, created_at, author_id, author:profiles(full_name, email)")
      .eq("request_id", id)
      .order("created_at"),
    db
      .from("request_events")
      .select("id, type, data, created_at, actor:profiles(full_name, email)")
      .eq("request_id", id)
      .order("created_at", { ascending: false }),
    db.from("profiles").select("id, full_name, email, role").in("role", ["admin", "equipe", "technique"]).order("full_name"),
  ]);
  if (!req.data) return null;

  // Liens de lecture valables 1 h : le bucket reste privé.
  const paths = (files.data ?? []).map((f) => f.path);
  const signed = paths.length
    ? (await db.storage.from(DOCUMENTS_BUCKET).createSignedUrls(paths, 3600)).data ?? []
    : [];
  const urlByPath = new Map(signed.map((s) => [s.path, s.signedUrl]));

  type Person = { full_name: string | null; email: string } | null;
  return {
    user,
    request: req.data as Omit<RequestRow, "assignee" | "request_files"> & {
      mosque_osm: string | null;
      message: string | null;
    },
    files: (files.data ?? []).map((f) => ({ ...f, url: urlByPath.get(f.path) ?? null })) as RequestFile[],
    comments: (comments.data ?? []) as unknown as {
      id: string;
      body: string;
      created_at: string;
      author_id: string | null;
      author: Person;
    }[],
    events: (events.data ?? []) as unknown as {
      id: string;
      type: string;
      data: Record<string, string | number | null>;
      created_at: string;
      actor: Person;
    }[],
    staff: (staff.data ?? []) as { id: string; full_name: string | null; email: string; role: Role }[],
  };
}

export type AccountRequestRow = {
  id: string;
  number: number;
  created_at: string;
  status: AccountRequestStatus;
  mosque_name: string;
  mosque_address: string | null;
  first_name: string;
  last_name: string;
  role_in_mosque: string | null;
  email: string;
  phone: string;
  message: string | null;
  reviewed_at: string | null;
  reviewer: { full_name: string | null; email: string } | null;
};

export async function listAccountRequests(status?: string) {
  await requireStaff("/admin/comptes");
  if (!isSupabaseConfigured) return demoAccountRequests.filter((r) => !status || r.status === status);
  let query = createAdminClient()
    .from("account_requests")
    .select("*, reviewer:profiles!account_requests_reviewed_by_fkey(full_name, email)")
    .order("created_at", { ascending: false })
    .limit(200);
  if (status === "en_attente" || status === "approuvee" || status === "refusee") query = query.eq("status", status);
  const { data, error } = await query.returns<AccountRequestRow[]>();
  if (error) throw error;
  return data ?? [];
}

export async function listTeam() {
  const user = await requireAdmin("/admin/equipe");
  if (!isSupabaseConfigured) return { user, members: demoTeam };
  const { data, error } = await createAdminClient()
    .from("profiles")
    .select("id, full_name, email, role, created_at, mosque:mosques(name)")
    .order("role")
    .order("full_name");
  if (error) throw error;
  return {
    user,
    members: (data ?? []) as unknown as {
      id: string;
      full_name: string | null;
      email: string;
      role: Role;
      created_at: string;
      mosque: { name: string } | null;
    }[],
  };
}

/** Pastilles du menu : demandes nouvelles et comptes à valider. */
export async function getSidebarCounts() {
  await requireStaff();
  if (!isSupabaseConfigured) return { newRequests: 2, pendingAccounts: 1 };
  const db = createAdminClient();
  const [requests, accounts] = await Promise.all([
    db.from("study_requests").select("id", { count: "exact", head: true }).eq("status", "nouvelle"),
    db.from("account_requests").select("id", { count: "exact", head: true }).eq("status", "en_attente"),
  ]);
  return { newRequests: requests.count ?? 0, pendingAccounts: accounts.count ?? 0 };
}
