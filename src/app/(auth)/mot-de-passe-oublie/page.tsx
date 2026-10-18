import type { Metadata } from "next";
import Link from "next/link";
import { ForgotPasswordForm } from "@/components/auth/forms";

export const metadata: Metadata = { title: "Mot de passe oublié" };

export default function ForgotPasswordPage() {
  return (
    <>
      <h1 className="mb-2 text-[28px] font-extrabold tracking-[-0.02em] text-heading">Mot de passe oublié</h1>
      <p className="mb-7 text-[15px] text-muted">Indiquez votre e-mail : nous vous envoyons un lien pour en choisir un nouveau.</p>
      <ForgotPasswordForm />
      <Link href="/connexion" className="mt-6 inline-block text-[14.5px] font-semibold text-brand-text hover:underline">
        ← Retour à la connexion
      </Link>
    </>
  );
}
