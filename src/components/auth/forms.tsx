"use client";

import Link from "next/link";
import { useActionState, type ReactNode } from "react";
import { submitAccountRequest } from "@/app/actions/account-request";
import { requestPasswordReset, signIn, updatePassword } from "@/app/actions/auth";

const input =
  "h-11 w-full rounded-lg border border-line bg-bg px-3.5 text-[15px] text-fg outline-none placeholder:text-muted focus:border-brand-text focus:ring-2 focus:ring-brand-text/20";
const label = "grid gap-1.5 text-[13.5px] font-semibold text-fg";
const submit =
  "flex h-12 w-full cursor-pointer items-center justify-center rounded-[10px] bg-[linear-gradient(180deg,#126a52,#0b4f3d)] text-[15px] font-semibold text-white hover:bg-brand-hover hover:bg-none disabled:cursor-default disabled:opacity-60";
const errorText = "text-[13px] font-medium text-red-600 dark:text-red-400";

function Message({ state }: { state: { ok?: boolean; message: string } | null }) {
  if (!state) return null;
  return (
    <p
      role={state.ok ? "status" : "alert"}
      className={`rounded-lg px-3.5 py-2.5 text-[14px] font-medium ${
        state.ok ? "bg-brand/10 text-brand-text" : "bg-red-50 text-red-700 dark:bg-red-400/10 dark:text-red-300"
      }`}
    >
      {state.message}
    </p>
  );
}

export function LoginForm({ next, notice }: { next?: string; notice?: ReactNode }) {
  const [state, action, pending] = useActionState(signIn, null);
  return (
    <form action={action} className="grid gap-4">
      {notice}
      {next && <input type="hidden" name="next" value={next} />}
      <label className={label}>
        E-mail
        <input name="email" type="email" autoComplete="email" required className={input} />
      </label>
      <label className={label}>
        <span className="flex justify-between">
          Mot de passe
          <Link href="/mot-de-passe-oublie" className="font-medium text-brand-text hover:underline">
            Mot de passe oublié ?
          </Link>
        </span>
        <input name="password" type="password" autoComplete="current-password" required className={input} />
      </label>
      <Message state={state} />
      <button type="submit" disabled={pending} className={submit}>
        {pending ? "Connexion…" : "Se connecter"}
      </button>
    </form>
  );
}

export function ForgotPasswordForm() {
  const [state, action, pending] = useActionState(requestPasswordReset, null);
  if (state?.ok) return <Message state={state} />;
  return (
    <form action={action} className="grid gap-4">
      <label className={label}>
        E-mail du compte
        <input name="email" type="email" autoComplete="email" required className={input} />
      </label>
      <Message state={state} />
      <button type="submit" disabled={pending} className={submit}>
        {pending ? "Envoi…" : "Recevoir un lien"}
      </button>
    </form>
  );
}

export function NewPasswordForm() {
  const [state, action, pending] = useActionState(updatePassword, null);
  return (
    <form action={action} className="grid gap-4">
      <label className={label}>
        Nouveau mot de passe
        <input name="password" type="password" autoComplete="new-password" minLength={8} required className={input} />
        <span className="text-[12.5px] font-normal text-muted">8 caractères minimum.</span>
      </label>
      <label className={label}>
        Confirmer le mot de passe
        <input name="confirm" type="password" autoComplete="new-password" minLength={8} required className={input} />
      </label>
      <Message state={state} />
      <button type="submit" disabled={pending} className={submit}>
        {pending ? "Enregistrement…" : "Enregistrer et accéder à mon espace"}
      </button>
    </form>
  );
}

export function AccountRequestForm() {
  const [state, action, pending] = useActionState(submitAccountRequest, null);
  if (state?.ok) {
    return (
      <div className="grid justify-items-center gap-4 py-8 text-center">
        <span className="flex size-14 items-center justify-center rounded-full bg-brand text-white">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.6} strokeLinecap="round" strokeLinejoin="round" className="size-7" aria-hidden>
            <path d="m5 12.5 4.5 4.5L19 7" />
          </svg>
        </span>
        <p role="status" className="max-w-[440px] text-[16px] leading-normal text-fg">
          {state.message}
        </p>
      </div>
    );
  }
  const err = state?.errors ?? {};
  return (
    <form action={action} className="grid gap-5" noValidate>
      <fieldset className="grid gap-3">
        <legend className="mb-1 text-[15px] font-bold text-heading">La mosquée</legend>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className={label}>
            Nom de la mosquée
            <input name="mosqueName" required className={input} />
            {err.mosqueName && <span className={errorText}>{err.mosqueName}</span>}
          </label>
          <label className={label}>
            Ville ou adresse
            <input name="mosqueAddress" className={input} />
          </label>
        </div>
      </fieldset>
      <fieldset className="grid gap-3">
        <legend className="mb-1 text-[15px] font-bold text-heading">Le responsable du compte</legend>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className={label}>
            Prénom
            <input name="firstName" autoComplete="given-name" required className={input} />
            {err.firstName && <span className={errorText}>{err.firstName}</span>}
          </label>
          <label className={label}>
            Nom
            <input name="lastName" autoComplete="family-name" required className={input} />
            {err.lastName && <span className={errorText}>{err.lastName}</span>}
          </label>
          <label className={label}>
            E-mail
            <input name="email" type="email" autoComplete="email" required className={input} />
            {err.email && <span className={errorText}>{err.email}</span>}
          </label>
          <label className={label}>
            Téléphone
            <input name="phone" type="tel" autoComplete="tel" required className={input} />
            {err.phone && <span className={errorText}>{err.phone}</span>}
          </label>
          <label className={`${label} sm:col-span-2`}>
            <span>
              Fonction dans la mosquée <span className="font-normal text-muted">(facultatif)</span>
            </span>
            <input name="roleInMosque" placeholder="Président, trésorier, imam, gestionnaire…" className={input} />
          </label>
        </div>
      </fieldset>
      <label className={label}>
        <span>
          Message <span className="font-normal text-muted">(facultatif)</span>
        </span>
        <textarea name="message" rows={3} className={`${input} h-auto py-2.5`} />
      </label>
      <input type="text" name="website" tabIndex={-1} autoComplete="off" aria-hidden className="hidden" />
      {state && !state.ok && <Message state={state} />}
      <button type="submit" disabled={pending} className={submit}>
        {pending ? "Envoi…" : "Demander la création du compte"}
      </button>
    </form>
  );
}
