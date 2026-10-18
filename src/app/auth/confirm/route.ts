import type { EmailOtpType } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";
import { createAuthClient, isSupabaseConfigured } from "@/lib/supabase/server";

// Lien reçu par e-mail (invitation ou mot de passe oublié) : vérifie le jeton et ouvre la session.
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const next = searchParams.get("next") ?? "/compte/mot-de-passe";
  const target = /^\/(?![/\\])/.test(next) ? next : "/compte/mot-de-passe";

  if (isSupabaseConfigured && tokenHash && (type === "invite" || type === "recovery")) {
    const supabase = await createAuthClient();
    const { error } = await supabase.auth.verifyOtp({ type, token_hash: tokenHash });
    if (!error) return NextResponse.redirect(new URL(target, request.url));
  }
  return NextResponse.redirect(new URL("/connexion?erreur=lien", request.url));
}
