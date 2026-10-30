import { DOCUMENTS_BUCKET_NAME } from "@/lib/study";
import type { SignedUpload } from "@/lib/dossier";

/** Envoi direct navigateur → stockage, sans passer par la limite de taille des actions serveur. Renvoie les fichiers en échec. */
export async function uploadSigned(uploads: SignedUpload[], files: File[]) {
  const { createClient } = await import("@supabase/supabase-js");
  const client = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    (process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)!,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
  const sent = new Set<number>();
  for (const u of uploads) {
    const { error } = await client.storage.from(DOCUMENTS_BUCKET_NAME).uploadToSignedUrl(u.path, u.token, files[u.index]);
    if (!error) sent.add(u.index);
  }
  return files.filter((_, i) => !sent.has(i)).map((f) => f.name);
}
