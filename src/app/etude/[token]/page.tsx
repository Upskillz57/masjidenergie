import type { Metadata } from "next";
import Link from "next/link";
import { connection } from "next/server";
import { Suspense } from "react";
import { StudyUploadForm } from "@/components/admin/study-upload-form";
import { Card, Icon } from "@/components/dashboard/ui";
import { LogoMark } from "@/components/logo";
import { MOTIVATIONS, isMotivation } from "@/lib/dossier";
import { site } from "@/lib/site";
import { verifyStudyToken } from "@/lib/study-link";
import { createAdminClient, isSupabaseConfigured } from "@/lib/supabase/server";
import { formatDate, isStudyPath } from "@/lib/workflow";

export const metadata: Metadata = { title: "Demande d’étude", robots: { index: false, follow: false } };

type Req = {
  number: number;
  created_at: string;
  mosque_name: string;
  mosque_address: string | null;
  first_name: string;
  last_name: string;
  phone: string;
  email: string;
  chargers: boolean;
  message: string | null;
  project_motivations: string[] | null;
  project_context: string | null;
};

function Shell({ children, number }: { children: React.ReactNode; number?: number }) {
  return (
    <div className="min-h-dvh bg-bg-soft">
      <header className="border-b border-line bg-card">
        <div className="mx-auto flex max-w-[1100px] items-center justify-between gap-4 px-4 py-3 sm:px-6">
          <Link href="/" className="flex items-center gap-2.5">
            <LogoMark variant="color" width={46} className="dark:hidden" />
            <LogoMark variant="gold" width={46} className="hidden dark:block" />
            <span className="font-display text-[19px] text-brand-text">
              <span className="font-bold">Masjid</span> Energie
            </span>
          </Link>
          {number && <span className="text-[12.5px] font-semibold tracking-[0.16em] text-gold">DEMANDE N°{number}</span>}
        </div>
      </header>
      <main className="mx-auto max-w-[1100px] px-4 py-8 sm:px-6 sm:py-10">{children}</main>
    </div>
  );
}

/** Page du bureau d'études (bouton de l'e-mail de partage) : consulter la demande puis déposer l'étude. */
async function StudyRequest({ params }: { params: Promise<{ token: string }> }) {
  const { token: raw } = await params;
  await connection(); // l'expiration du lien se vérifie à chaque visite
  const token = decodeURIComponent(raw);
  const requestId = verifyStudyToken(token);

  let req: Req | null = null;
  let studyCount = 0;
  if (requestId && isSupabaseConfigured) {
    const db = createAdminClient();
    const [r, f] = await Promise.all([
      db.from("study_requests").select("*").eq("id", requestId).maybeSingle<Req>(),
      db.from("request_files").select("path").eq("request_id", requestId),
    ]);
    req = r.data;
    studyCount = (f.data ?? []).filter((x) => isStudyPath(x.path)).length;
  }

  if (!requestId || !req) {
    return (
      <Shell>
        <div className="mx-auto grid max-w-[520px] gap-3 rounded-2xl border border-line bg-card p-8 text-center">
          <h1 className="text-[24px] font-extrabold text-heading">Lien expiré</h1>
          <p className="text-[15px] leading-relaxed text-muted">
            {isSupabaseConfigured
              ? "Ce lien n’est plus valable. Demandez-en un nouveau à l’équipe Masjid Energie"
              : "Mode démo : cette page s’affiche avec Supabase configuré. Contactez l’équipe Masjid Energie"}{" "}
            au {site.contact.phone} ou à{" "}
            <a href={`mailto:${site.contact.email}`} className="font-semibold text-brand-text hover:underline">
              {site.contact.email}
            </a>
            .
          </p>
        </div>
      </Shell>
    );
  }

  const motivations = (req.project_motivations ?? []).filter(isMotivation).map((m) => MOTIVATIONS[m]);
  const mapUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${req.mosque_name} ${req.mosque_address ?? ""}`)}`;

  const rows: [string, React.ReactNode][] = [
    ["Mosquée", req.mosque_name],
    [
      "Adresse",
      <span key="a" className="grid gap-0.5">
        {req.mosque_address || "Non précisée"}
        <a
          href={mapUrl}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1 text-[13px] font-medium text-brand-text hover:underline"
        >
          Voir sur la carte <Icon name="external" className="size-3.5" />
        </a>
      </span>,
    ],
    [
      "Contact",
      <span key="c" className="grid gap-0.5">
        <span>
          {req.first_name} {req.last_name}
        </span>
        <a href={`tel:${req.phone.replace(/\s/g, "")}`} className="text-brand-text hover:underline">
          {req.phone}
        </a>
        <a href={`mailto:${req.email}`} className="break-all text-brand-text hover:underline">
          {req.email}
        </a>
      </span>,
    ],
    ["Bornes de recharge", req.chargers ? "Oui, souhaitées" : "Non"],
  ];
  if (motivations.length) rows.push(["Motivation", motivations.join(", ")]);
  if (req.project_context) rows.push(["Contexte", req.project_context]);
  if (req.message) rows.push(["Message de la mosquée", req.message]);

  return (
    <Shell number={req.number}>
      <div className="mb-7 grid gap-2">
        <span className="text-[12px] font-semibold tracking-[0.22em] text-gold">
          DEMANDE D’ÉTUDE N°{req.number} · REÇUE LE {formatDate(req.created_at).toUpperCase()}
        </span>
        <h1 className="text-[clamp(26px,3vw,36px)] font-extrabold leading-tight tracking-[-0.02em] text-heading">
          Étude pour {req.mosque_name}
        </h1>
        <p className="max-w-[720px] text-[15.5px] leading-relaxed text-muted">
          Les documents de la mosquée sont joints à l’e-mail reçu. Déposez ici votre étude : elle arrivera directement sur la
          demande, chez l’équipe Masjid Energie.
        </p>
      </div>

      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
        <Card title="La mosquée" icon="pin">
          <dl className="grid divide-y divide-line text-[14.5px]">
            {rows.map(([k, v]) => (
              <div key={k} className="grid gap-1 py-3 first:pt-0 last:pb-0">
                <dt className="text-[12px] font-semibold uppercase tracking-[0.08em] text-muted">{k}</dt>
                <dd className="whitespace-pre-line text-fg">{v}</dd>
              </div>
            ))}
          </dl>
        </Card>

        <Card title="Déposer l’étude" icon="upload">
          {studyCount > 0 && (
            <p className="mb-4 rounded-lg bg-bg-soft px-3 py-2 text-[13.5px] text-muted">
              {studyCount} document{studyCount > 1 ? "s" : ""} d’étude déjà reçu{studyCount > 1 ? "s" : ""} pour cette demande.
            </p>
          )}
          <StudyUploadForm token={token} />
        </Card>
      </div>
    </Shell>
  );
}

export default function StudyRequestPage({ params }: { params: Promise<{ token: string }> }) {
  return (
    <Suspense>
      <StudyRequest params={params} />
    </Suspense>
  );
}
