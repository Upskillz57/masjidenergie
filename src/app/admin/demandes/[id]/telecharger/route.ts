import { requireStaff } from "@/lib/auth";
import { createAdminClient, DOCUMENTS_BUCKET, isSupabaseConfigured } from "@/lib/supabase/server";
import { createZip } from "@/lib/zip";

const UUID = /^[0-9a-f-]{36}$/i;

const disposition = (name: string) => {
  const ascii = name.normalize("NFD").replace(/[^\x20-\x7e]/g, "").replace(/["\\]/g, "_") || "fichier";
  return `attachment; filename="${ascii}"; filename*=UTF-8''${encodeURIComponent(name)}`;
};

const slug = (s: string) =>
  s.normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^\w]+/g, "-").replace(/^-|-$/g, "").toLowerCase();

/** Télécharge un document (fichier direct) ou plusieurs (archive ZIP) d'une demande : ?f=id1,id2 (tous si absent). */
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await requireStaff(`/admin/demandes/${id}`);
  if (!UUID.test(id)) return new Response("Demande introuvable", { status: 404 });
  if (!isSupabaseConfigured) return new Response("Mode démo : téléchargement indisponible sans Supabase.", { status: 501 });

  const ids = (new URL(request.url).searchParams.get("f") ?? "").split(",").filter((v) => UUID.test(v));
  const db = createAdminClient();
  let query = db.from("request_files").select("id, path, name, mime").eq("request_id", id).order("created_at");
  if (ids.length) query = query.in("id", ids);
  const [{ data: files }, { data: req }] = await Promise.all([
    query,
    db.from("study_requests").select("number, mosque_name").eq("id", id).maybeSingle(),
  ]);
  if (!req || !files?.length) return new Response("Aucun document", { status: 404 });

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
      headers: { ...headers, "Content-Type": f.mime || "application/octet-stream", "Content-Disposition": disposition(f.name) },
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
