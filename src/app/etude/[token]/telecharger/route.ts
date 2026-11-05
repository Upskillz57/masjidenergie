import { downloadRequestFiles } from "@/lib/request-download";
import { verifyStudyToken } from "@/lib/study-link";
import { isSupabaseConfigured } from "@/lib/supabase/server";

/**
 * Documents de la demande pour le bureau d'études (lien signé) : ?f=id1,id2 (tous si absent), ?voir=1 pour l'ouvrir
 * dans le navigateur. L'étude elle-même n'est pas servie ici.
 */
export async function GET(request: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const requestId = verifyStudyToken(decodeURIComponent(token));
  if (!requestId) return new Response("Ce lien n’est plus valable.", { status: 403 });
  if (!isSupabaseConfigured) return new Response("Mode démo : téléchargement indisponible sans Supabase.", { status: 501 });
  const sp = new URL(request.url).searchParams;
  return downloadRequestFiles(requestId, sp.get("f"), { withStudy: false, inline: sp.get("voir") === "1" });
}
