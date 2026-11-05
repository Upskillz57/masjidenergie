import type { Metadata } from "next";
import { connection } from "next/server";
import { Suspense } from "react";
import { StudyUploadForm } from "@/components/admin/study-upload-form";
import { site } from "@/lib/site";
import { verifyStudyToken } from "@/lib/study-link";
import { createAdminClient, isSupabaseConfigured } from "@/lib/supabase/server";
import { isStudyPath } from "@/lib/workflow";

export const metadata: Metadata = { title: "Déposer l’étude" };

const city = (address: string | null) => address?.match(/\b\d{5}\s+(.+)$/)?.[1] ?? address ?? "";

/** Page du bureau d'études : lien signé reçu dans l'e-mail de partage, pour renvoyer l'étude sur la demande. */
async function StudyDrop({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  await connection(); // l'expiration du lien se vérifie à chaque visite
  const requestId = verifyStudyToken(decodeURIComponent(token));

  let req: { number: number; mosque_name: string; mosque_address: string | null } | null = null;
  let studyFiles = 0;
  if (requestId && isSupabaseConfigured) {
    const db = createAdminClient();
    const [r, f] = await Promise.all([
      db.from("study_requests").select("number, mosque_name, mosque_address").eq("id", requestId).maybeSingle(),
      db.from("request_files").select("path").eq("request_id", requestId),
    ]);
    req = r.data;
    studyFiles = (f.data ?? []).filter((x) => isStudyPath(x.path)).length;
  }

  if (!requestId || (isSupabaseConfigured && !req)) {
    return (
      <>
        <h1 className="mb-2 text-[28px] font-extrabold tracking-[-0.02em] text-heading">Lien expiré</h1>
        <p className="text-[15px] leading-relaxed text-muted">
          Ce lien de dépôt n’est plus valable. Demandez-en un nouveau à l’équipe Masjid Energie au {site.contact.phone} ou à{" "}
          <a href={`mailto:${site.contact.email}`} className="font-semibold text-brand-text hover:underline">
            {site.contact.email}
          </a>
          .
        </p>
      </>
    );
  }

  return (
    <>
      <span className="mb-2 block text-[12px] font-semibold tracking-[0.22em] text-gold">
        {req ? `DEMANDE D’ÉTUDE N°${req.number}` : "DEMANDE D’ÉTUDE"}
      </span>
      <h1 className="mb-2 text-[28px] font-extrabold leading-tight tracking-[-0.02em] text-heading">
        {req ? `Étude pour ${req.mosque_name}` : "Déposer l’étude"}
      </h1>
      <p className="mb-7 text-[15px] leading-relaxed text-muted">
        {req && city(req.mosque_address) ? `${city(req.mosque_address)} · ` : ""}
        Déposez ici l’étude réalisée (rapport, simulation, devis…). Les documents arrivent directement sur la demande de la
        mosquée, dans l’espace de l’équipe Masjid Energie.
        {studyFiles > 0 && ` ${studyFiles} document${studyFiles > 1 ? "s" : ""} déjà reçu${studyFiles > 1 ? "s" : ""}.`}
      </p>
      <StudyUploadForm token={decodeURIComponent(token)} />
    </>
  );
}

export default function StudyDropPage({ params }: { params: Promise<{ token: string }> }) {
  return (
    <Suspense>
      <StudyDrop params={params} />
    </Suspense>
  );
}
