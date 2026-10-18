import "server-only";

import { createServerClient } from "@supabase/ssr";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const publishableKey =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const secretKey = process.env.SUPABASE_SECRET_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY;

export const isSupabaseConfigured = Boolean(url && publishableKey && secretKey);

export const DOCUMENTS_BUCKET = "documents";

/** Client lié aux cookies du visiteur : sert uniquement à l'authentification (session, connexion). */
export async function createAuthClient() {
  const cookieStore = await cookies();
  return createServerClient(url!, publishableKey!, {
    cookies: {
      getAll: () => cookieStore.getAll(),
      setAll(cookiesToSet) {
        try {
          for (const { name, value, options } of cookiesToSet) cookieStore.set(name, value, options);
        } catch {
          // Appelé depuis un Server Component : le proxy se charge de rafraîchir la session.
        }
      },
    },
  });
}

/**
 * Client avec la clé secrète : contourne la RLS. À n'utiliser qu'après avoir vérifié
 * le rôle de l'utilisateur (voir lib/auth.ts), jamais depuis le navigateur.
 */
export function createAdminClient() {
  return createSupabaseClient(url!, secretKey!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
