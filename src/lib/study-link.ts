import "server-only";

import { createHmac, timingSafeEqual } from "node:crypto";
import { site } from "@/lib/site";

// Lien de dépôt de l'étude envoyé au bureau d'études : signé, sans compte ni table en base.
// Format : <id de la demande>.<expiration en base 36>.<signature>

const VALID_DAYS = 90;
const secret = () => process.env.STUDY_LINK_SECRET || process.env.SUPABASE_SECRET_KEY || "dev-only-secret";
const sign = (payload: string) => createHmac("sha256", secret()).update(`etude:${payload}`).digest("base64url").slice(0, 32);

export function createStudyToken(requestId: string) {
  const exp = (Math.floor(Date.now() / 1000) + VALID_DAYS * 86400).toString(36);
  const payload = `${requestId}.${exp}`;
  return `${payload}.${sign(payload)}`;
}

export const studyUploadUrl = (requestId: string) => `${site.publicUrl}/etude/${createStudyToken(requestId)}`;

/** Renvoie l'identifiant de la demande si le lien est authentique et encore valable. */
export function verifyStudyToken(token: string): string | null {
  const [id, exp, sig] = token.split(".");
  if (!id || !exp || !sig || !/^[0-9a-f-]{36}$/i.test(id)) return null;
  const expected = Buffer.from(sign(`${id}.${exp}`));
  const given = Buffer.from(sig);
  if (expected.length !== given.length || !timingSafeEqual(expected, given)) return null;
  if (parseInt(exp, 36) * 1000 < Date.now()) return null;
  return id;
}
