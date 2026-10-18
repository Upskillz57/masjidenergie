import type { Metadata } from "next";
import Link from "next/link";
import { AccountRequestForm } from "@/components/auth/forms";

export const metadata: Metadata = {
  title: "Créer un compte mosquée",
  description: "Demandez l’ouverture de l’espace en ligne de votre mosquée : consommation, factures et suivi de votre projet solaire.",
};

const perks = [
  ["Votre consommation", "Suivez mois par mois l’électricité consommée et produite par vos panneaux."],
  ["Vos factures", "Retrouvez toutes vos factures et vos économies au même endroit."],
  ["Votre projet", "Suivez chaque étape : étude, installation, mise en service."],
];

export default function CreateAccountPage() {
  return (
    <section className="bg-bg-soft pt-[110px]">
      <div className="mx-auto grid max-w-[1180px] gap-10 px-[clamp(20px,4.7vw,72px)] pb-16 lg:grid-cols-[minmax(0,1fr)_minmax(0,560px)]">
        <div className="grid content-start gap-5">
          <span className="text-[13px] font-semibold tracking-[0.26em] text-gold">ESPACE MOSQUÉE</span>
          <h1 className="text-[clamp(30px,3vw,42px)] font-extrabold leading-[1.08] tracking-[-0.02em] text-heading">
            Créez l’espace en ligne de votre mosquée
          </h1>
          <p className="text-[16px] leading-relaxed text-muted">
            Remplissez ce formulaire : notre équipe vérifie la demande puis vous envoie par e-mail un lien pour activer votre
            compte.
          </p>
          <ul className="mt-2 grid gap-4">
            {perks.map(([title, text]) => (
              <li key={title} className="flex gap-3.5">
                <span className="mt-1 flex size-6 flex-none items-center justify-center rounded-full bg-brand text-white">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" className="size-3.5" aria-hidden>
                    <path d="m5 12.5 4.5 4.5L19 7" />
                  </svg>
                </span>
                <span className="grid gap-0.5">
                  <span className="text-[15.5px] font-bold text-heading">{title}</span>
                  <span className="text-[14.5px] text-muted">{text}</span>
                </span>
              </li>
            ))}
          </ul>
          <p className="mt-2 text-[14.5px] text-muted">
            Déjà un compte ?{" "}
            <Link href="/connexion" className="font-semibold text-brand-text hover:underline">
              Se connecter
            </Link>
          </p>
        </div>
        <div className="rounded-2xl border border-line bg-card p-[clamp(20px,3vw,32px)] shadow-[0_16px_40px_#0000000f]">
          <AccountRequestForm />
        </div>
      </div>
    </section>
  );
}
