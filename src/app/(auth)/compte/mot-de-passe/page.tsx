import type { Metadata } from "next";
import { Suspense } from "react";
import { NewPasswordForm } from "@/components/auth/forms";
import { requireUser } from "@/lib/auth";

export const metadata: Metadata = { title: "Choisir un mot de passe" };

async function Greeting() {
  const user = await requireUser("/compte/mot-de-passe");
  return (
    <p className="mb-7 text-[15px] text-muted">
      Assalamou alaykoum {user.fullName}, choisissez le mot de passe de votre compte ({user.email}).
    </p>
  );
}

export default function NewPasswordPage() {
  return (
    <>
      <h1 className="mb-2 text-[28px] font-extrabold tracking-[-0.02em] text-heading">Choisir un mot de passe</h1>
      <Suspense fallback={<div className="mb-7 h-12" />}>
        <Greeting />
      </Suspense>
      <NewPasswordForm />
    </>
  );
}
