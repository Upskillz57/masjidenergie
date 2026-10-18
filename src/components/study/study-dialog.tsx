"use client";

import { useEffect, useRef, useState, useTransition, type FormEvent } from "react";
import { submitStudyRequest } from "@/app/actions/study-request";
import { ArrowRight } from "@/components/icons";
import { fieldClass, MosquePicker } from "@/components/study/mosque-picker";
import { BILL_ACCEPT, MAX_BILLS, MAX_BILLS_BYTES, STUDY_HASH, type StudyRequestState } from "@/lib/study";

const label = "grid gap-1.5 text-[13.5px] font-semibold text-fg";
const errorText = "text-[13px] font-medium text-red-600 dark:text-red-400";

// S'ouvre dès que l'URL porte #etude : tous les boutons « Demander une étude » pointent vers cette ancre.
export function StudyDialog() {
  const dialog = useRef<HTMLDialogElement>(null);
  const [state, setState] = useState<StudyRequestState | null>(null);
  const [bills, setBills] = useState<File[]>([]);
  const [formKey, setFormKey] = useState(0);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    const sync = () => {
      if (location.hash === STUDY_HASH && !dialog.current?.open) dialog.current?.showModal();
    };
    sync();
    window.addEventListener("hashchange", sync);
    return () => window.removeEventListener("hashchange", sync);
  }, []);

  function onClose() {
    if (location.hash === STUDY_HASH) history.replaceState(null, "", location.pathname + location.search);
    if (state?.ok) {
      setState(null);
      setBills([]);
      setFormKey((k) => k + 1);
    }
  }

  function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    for (const f of bills) data.append("bills", f);
    startTransition(async () => {
      try {
        setState(await submitStudyRequest(data));
      } catch {
        setState({ ok: false, message: "L’envoi a échoué. Vérifiez la taille des factures et réessayez." });
      }
    });
  }

  const totalBytes = bills.reduce((n, f) => n + f.size, 0);
  const tooBig = bills.length > MAX_BILLS || totalBytes > MAX_BILLS_BYTES;
  const billsError =
    bills.length > MAX_BILLS
      ? `${MAX_BILLS} fichiers maximum.`
      : totalBytes > MAX_BILLS_BYTES
        ? "4 Mo maximum au total : retirez un fichier ou envoyez une version plus légère."
        : state?.errors?.bills;

  return (
    <dialog
      ref={dialog}
      onClose={onClose}
      aria-labelledby="etude-titre"
      className="m-auto max-h-[92dvh] w-[min(680px,calc(100vw-24px))] overflow-y-auto rounded-2xl bg-card p-0 text-fg shadow-[0_24px_60px_#00000055] backdrop:bg-[#06201a]/70 backdrop:backdrop-blur-[2px]"
    >
      <div className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-line bg-card px-6 py-5">
        <div className="grid gap-1">
          <span className="text-[12px] font-semibold tracking-[0.22em] text-gold">ÉTUDE GRATUITE</span>
          <h2 id="etude-titre" className="text-[22px] font-extrabold leading-tight tracking-[-0.01em] text-heading">
            Demander une étude
          </h2>
        </div>
        <button
          type="button"
          onClick={() => dialog.current?.close()}
          aria-label="Fermer"
          className="flex size-10 flex-none cursor-pointer items-center justify-center rounded-full text-muted hover:bg-bg-soft hover:text-fg"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" className="size-5" aria-hidden>
            <path d="M6 6l12 12M18 6 6 18" />
          </svg>
        </button>
      </div>

      {state?.ok ? (
        <div className="grid justify-items-center gap-4 px-6 py-12 text-center">
          <span className="flex size-14 items-center justify-center rounded-full bg-brand text-white">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.6} strokeLinecap="round" strokeLinejoin="round" className="size-7" aria-hidden>
              <path d="m5 12.5 4.5 4.5L19 7" />
            </svg>
          </span>
          <p className="max-w-[420px] text-[16px] leading-normal" role="status">
            {state.message}
          </p>
          <button
            type="button"
            onClick={() => dialog.current?.close()}
            className="h-11 cursor-pointer rounded-lg bg-brand px-6 text-sm font-semibold text-white hover:bg-brand-hover"
          >
            Fermer
          </button>
        </div>
      ) : (
        <form key={formKey} onSubmit={onSubmit} noValidate className="grid gap-6 px-6 py-6">
          <MosquePicker error={state?.errors?.mosque} />

          <fieldset className="grid gap-3">
            <legend className="mb-1 text-[15px] font-bold text-heading">Personne à contacter</legend>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className={label}>
                Prénom
                <input name="firstName" autoComplete="given-name" required className={fieldClass} />
                {state?.errors?.firstName && <span className={errorText}>{state.errors.firstName}</span>}
              </label>
              <label className={label}>
                Nom
                <input name="lastName" autoComplete="family-name" required className={fieldClass} />
                {state?.errors?.lastName && <span className={errorText}>{state.errors.lastName}</span>}
              </label>
              <label className={label}>
                Téléphone
                <input name="phone" type="tel" autoComplete="tel" required className={fieldClass} />
                {state?.errors?.phone && <span className={errorText}>{state.errors.phone}</span>}
              </label>
              <label className={label}>
                E-mail
                <input name="email" type="email" autoComplete="email" required className={fieldClass} />
                {state?.errors?.email && <span className={errorText}>{state.errors.email}</span>}
              </label>
            </div>
          </fieldset>

          <fieldset className="grid gap-3">
            <legend className="mb-1 text-[15px] font-bold text-heading">Dernières factures d’électricité</legend>
            <label className="flex cursor-pointer flex-col items-center gap-1.5 rounded-lg border-2 border-dashed border-line px-4 py-5 text-center hover:border-brand-text/50 hover:bg-bg-soft">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className="size-7 text-brand-text" aria-hidden>
                <path d="M12 16V4M7 9l5-5 5 5M4 16v3a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-3" />
              </svg>
              <span className="text-[14.5px] font-semibold text-fg">Ajouter vos factures</span>
              <span className="text-[13px] text-muted">PDF, JPG ou PNG · {MAX_BILLS} fichiers et 4 Mo maximum</span>
              <input
                type="file"
                multiple
                accept={BILL_ACCEPT}
                className="sr-only"
                onChange={(e) => {
                  const picked = Array.from(e.target.files ?? []);
                  setBills((b) => [...b, ...picked]);
                  e.target.value = "";
                }}
              />
            </label>
            {bills.length > 0 && (
              <ul className="grid gap-1.5">
                {bills.map((f, i) => (
                  <li key={`${f.name}-${i}`} className="flex items-center justify-between gap-3 rounded-md bg-bg-soft px-3 py-2 text-[13.5px]">
                    <span className="truncate">{f.name}</span>
                    <span className="flex flex-none items-center gap-3 text-muted">
                      {(f.size / 1024 / 1024).toFixed(1).replace(".", ",")} Mo
                      <button
                        type="button"
                        onClick={() => setBills((b) => b.filter((_, j) => j !== i))}
                        aria-label={`Retirer ${f.name}`}
                        className="cursor-pointer font-semibold text-red-600 hover:underline dark:text-red-400"
                      >
                        Retirer
                      </button>
                    </span>
                  </li>
                ))}
              </ul>
            )}
            {billsError && <p className={errorText}>{billsError}</p>}
          </fieldset>

          <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-line px-4 py-3.5 has-checked:border-brand-text has-checked:bg-brand/5">
            <input type="checkbox" name="chargers" value="oui" className="mt-0.5 size-[18px] flex-none accent-brand" />
            <span className="grid gap-0.5">
              <span className="text-[14.5px] font-semibold text-fg">Je souhaite des bornes de recharge</span>
              <span className="text-[13px] text-muted">Pour véhicules électriques, sur le parking de la mosquée.</span>
            </span>
          </label>

          <label className={label}>
            <span>
              Message <span className="font-normal text-muted">(facultatif)</span>
            </span>
            <textarea name="message" rows={3} className={`${fieldClass} h-auto py-2.5`} />
          </label>

          {/* Champ piège anti-spam, invisible pour les visiteurs. */}
          <input type="text" name="website" tabIndex={-1} autoComplete="off" aria-hidden className="hidden" />

          {state && !state.ok && (
            <p role="alert" className={errorText}>
              {state.message}
            </p>
          )}

          <button
            type="submit"
            disabled={pending || tooBig}
            className="flex h-[52px] cursor-pointer items-center justify-center gap-4 rounded-[10px] bg-[linear-gradient(180deg,#126a52,#0b4f3d)] px-7 text-base font-semibold text-white hover:bg-brand-hover hover:bg-none disabled:cursor-default disabled:opacity-60"
          >
            {pending ? "Envoi en cours…" : "Envoyer ma demande"}
            {!pending && <ArrowRight className="size-[17px]" />}
          </button>
          <p className="-mt-3 text-center text-[12.5px] text-muted">
            Étude gratuite · Sans crédit, sans emprunt, sans endettement
          </p>
        </form>
      )}
    </dialog>
  );
}
