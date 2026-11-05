import "server-only";

import { createAdminClient, DOCUMENTS_BUCKET } from "@/lib/supabase/server";
import { isStudyPath } from "@/lib/workflow";
import { createZip } from "@/lib/zip";

const UUID = /^[0-9a-f-]{36}$/i;

const disposition = (name: string, inline = false) => {
  const ascii = name.normalize("NFD").replace(/[^\x20-\x7e]/g, "").replace(/["\\]/g, "_") || "fichier";
  return `${inline ? "inline" : "attachment"}; filename="${ascii}"; filename*=UTF-8''${encodeURIComponent(name)}`;
};

const slug = (s: string) =>
  s.normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^\w]+/g, "-").replace(/^-|-$/g, "").toLowerCase();

/**
 * Documents d'une demande : un fichier seul tel quel, plusieurs dans une archive ZIP.
 * `rawIds` : identifiants séparés par des virgules (tous si vide). `withStudy: false` écarte l'étude.
 */
export async function downloadRequestFiles(
  requestId: string,
  rawIds: string | null,
  { withStudy = true, inline = false }: { withStudy?: boolean; inline?: boolean } = {},
) {
  const ids = (rawIds ?? "").split(",").filter((v) => UUID.test(v));
  const db = createAdminClient();
  let query = db.from("request_files").select("id, path, name, mime").eq("request_id", requestId).order("created_at");
  if (ids.length) query = query.in("id", ids);
  const [{ data: rows }, { data: req }] = await Promise.all([
    query,
    db.from("study_requests").select("number, mosque_name").eq("id", requestId).maybeSingle(),
  ]);
  const files = (rows ?? []).filter((f) => withStudy || !isStudyPath(f.path));
  if (!req || !files.length) return new Response("Aucun document", { status: 404 });

  const downloaded = await Promise.all(
    files.map(async (f) => {
      const { data } = await db.storage.from(DOCUMENTS_BUCKET).download(f.path);
      return data ? { ...f, data: new Uint8Array(await data.arrayBuffer()) } : null;
    }),
  );
  const ok = downloaded.filter((f) => f !== null);
  if (!ok.length) return new Response("Documents indisponibles", { status: 502 });

  const headers = { "Cache-Control": "private, no-store" };
  if (ok.length === 1) {
    const [f] = ok;
    return new Response(Buffer.from(f.data), {
      headers: {
        ...headers,
        "Content-Type": f.mime || "application/octet-stream",
        "Content-Disposition": disposition(f.name, inline),
      },
    });
  }
  const zip = createZip(ok.map((f) => ({ name: f.name, data: f.data })));
  return new Response(Buffer.from(zip), {
    headers: {
      ...headers,
      "Content-Type": "application/zip",
      "Content-Disposition": disposition(`demande-${req.number}-${slug(req.mosque_name)}.zip`),
    },
  });
}
