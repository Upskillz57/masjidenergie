import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { LoginForm } from "@/components/auth/forms";
import { isSupabaseConfigured } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Connexion" };

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function Notice({ children }: { children: React.ReactNode }) {
  return <div className="rounded-lg border border-gold/40 bg-gold/10 px-4 py-3 text-[14px] text-fg">{children}</div>;
}

async function Login({ searchParams }: { searchParams: SearchParams }) {
  const sp = await searchParams;
  const next = typeof sp.next === "string" ? sp.next : undefined;
  let notice: React.ReactNode = null;
  if (sp.erreur === "lien") notice = <Notice>Ce lien a expiré ou a déjà été utilisé. Connectez-vous ou demandez un nouveau lien.</Notice>;
  if (!isSupabaseConfigured) {
    notice =
      process.env.NODE_ENV !== "production" ? (
        <Notice>
          Mode démo local (Supabase non configuré) :{" "}
          <Link href="/admin" className="font-semibold text-brand-text underline">espace admin</Link> ·{" "}
          <Link href="/espace" className="font-semibold text-brand-text underline">espace mosquée</Link>
        </Notice>
      ) : (
        <Notice>L’espace en ligne ouvre bientôt.</Notice>
      );
  }
  return <LoginForm next={next} notice={notice} />;
}

export default function LoginPage({ searchParams }: { searchParams: SearchParams }) {
  return (
    <>
      <h1 className="mb-2 text-[28px] font-extrabold tracking-[-0.02em] text-heading">Connexion</h1>
      <p className="mb-7 text-[15px] text-muted">Espace mosquée et espace équipe Masjid Energie.</p>
      <Suspense>
        <Login searchParams={searchParams} />
      </Suspense>
      <p className="mt-8 border-t border-line pt-6 text-[14.5px] text-muted">
        Votre mosquée n’a pas encore d’espace ?{" "}
        <Link href="/creer-un-compte" className="font-semibold text-brand-text hover:underline">
          Demander la création d’un compte
        </Link>
      </p>
    </>
  );
}
