import "server-only";

import { requireUser } from "@/lib/auth";
import { createAdminClient, isSupabaseConfigured } from "@/lib/supabase/server";
import type { RequestStatus } from "@/lib/workflow";

// Espace mosquée — PROTOTYPE.
// La consommation et les factures sont des données de démonstration, en attendant le raccordement
// aux compteurs (Enedis / onduleur) et à la facturation. Le suivi de projet, lui, lit les vraies demandes.

export const PRICE_PER_KWH = 0.2516;

export type EnergyMonth = { key: string; label: string; short: string; solar: number; grid: number };

const MONTHS: [string, string, number, number][] = [
  ["2025-11", "Novembre 2025", 5200, 0],
  ["2025-12", "Décembre 2025", 6100, 0],
  ["2026-01", "Janvier 2026", 6400, 0],
  ["2026-02", "Février 2026", 5600, 0],
  ["2026-03", "Mars 2026", 4700, 1500],
  ["2026-04", "Avril 2026", 3900, 2100],
  ["2026-05", "Mai 2026", 3500, 2450],
  ["2026-06", "Juin 2026", 3800, 2700],
  ["2026-07", "Juillet 2026", 4100, 2850],
  ["2026-08", "Août 2026", 3600, 2500],
  ["2026-09", "Septembre 2026", 3700, 2050],
  ["2026-10", "Octobre 2026", 4400, 1450],
];

const shortFmt = new Intl.DateTimeFormat("fr-FR", { month: "short", timeZone: "UTC" });

export const energyMonths: EnergyMonth[] = MONTHS.map(([key, label, consumption, solar]) => ({
  key,
  label,
  short: shortFmt.format(new Date(`${key}-15T00:00:00Z`)).replace(".", ""),
  solar,
  grid: consumption - solar,
}));

export function energyTotals(months = energyMonths) {
  const consumption = months.reduce((n, m) => n + m.solar + m.grid, 0);
  const solar = months.reduce((n, m) => n + m.solar, 0);
  return {
    consumption,
    solar,
    grid: consumption - solar,
    savings: solar * PRICE_PER_KWH,
    selfShare: consumption ? solar / consumption : 0,
    co2Kg: solar * 0.052,
  };
}

export type Invoice = {
  id: string;
  month: string;
  period: string;
  kwh: number;
  amount: number;
  savings: number;
  status: "payee" | "a_payer";
};

export const invoices: Invoice[] = [...energyMonths].reverse().map((m, i) => {
  const [y, mo] = m.key.split("-").map(Number);
  const end = new Date(Date.UTC(y, mo, 0)).getUTCDate();
  return {
    id: `F-${m.key.replace("-", "")}`,
    month: m.label,
    period: `01/${String(mo).padStart(2, "0")} → ${end}/${String(mo).padStart(2, "0")}/${y}`,
    kwh: m.grid,
    amount: Math.round((m.grid * PRICE_PER_KWH + 38.4) * 100) / 100,
    savings: Math.round(m.solar * PRICE_PER_KWH * 100) / 100,
    status: i === 0 ? "a_payer" : "payee",
  };
});

export type MyRequest = { id: string; number: number; created_at: string; status: RequestStatus; mosque_name: string };

/** Demandes d'étude de la mosquée connectée (par mosquée rattachée, sinon par e-mail). */
export async function getMyRequests() {
  const user = await requireUser("/espace/projet");
  if (!isSupabaseConfigured) {
    const requests: MyRequest[] = [
      { id: "demo", number: 104, created_at: "2026-02-03T10:00:00Z", status: "installee", mosque_name: "Votre mosquée" },
    ];
    return { user, requests };
  }
  const db = createAdminClient();
  let query = db
    .from("study_requests")
    .select("id, number, created_at, status, mosque_name")
    .order("created_at", { ascending: false });
  query = user.mosqueId
    ? query.or(`mosque_id.eq.${user.mosqueId},email.ilike.${user.email}`)
    : query.ilike("email", user.email);
  const { data } = await query.returns<MyRequest[]>();
  return { user, requests: data ?? [] };
}

export const kwh = (n: number) => `${new Intl.NumberFormat("fr-FR").format(Math.round(n))} kWh`;
export const euros = (n: number, digits = 0) =>
  new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: digits,
    minimumFractionDigits: digits,
  }).format(n);
