"use client";

import { useEffect, useRef, useState, useTransition, type FormEvent } from "react";
import { completeStudyRequest, submitStudyRequest } from "@/app/actions/study-request";
import { ArrowRight } from "@/components/icons";
import { fieldClass, MosquePicker } from "@/components/study/mosque-picker";
import { FILE_ACCEPT, MAX_FILE_BYTES, MAX_FILES, MOTIVATIONS, REQUIRED_BILLS, type FileKind } from "@/lib/dossier";
import { uploadSigned } from "@/lib/dossier-upload";
import { STUDY_HASH, type StudyRequestState } from "@/lib/study";

const label = "grid gap-1.5 text-[13.5px] font-semibold text-fg";
const errorText = "text-[13px] font-medium text-red-600 dark:text-red-400";

type PickedFiles = Record<"facture" | "enedis" | "toiture", File[]>;
const noFiles: PickedFiles = { facture: [], enedis: [], toiture: [] };

function FilePicker({
  title,
  hint,
  action,
  files,
  onChange,
}: {
  title: string;
  hint: string;
  action: string;
  files: File[];
  onChange: (files: File[]) => void;
}) {
  return (
    <fieldset className="grid gap-3">
      <legend className="mb-1 text-[15px] font-bold text-heading">{title}</legend>
      <label className="flex cursor-pointer flex-col items-center gap-1.5 rounded-lg border-2 border-dashed border-line px-4 py-5 text-center hover:border-brand-text/50 hover:bg-bg-soft">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className="size-7 text-brand-text" aria-hidden>
          <path d="M12 16V4M7 9l5-5 5 5M4 16v3a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-3" />
        </svg>
        <span className="text-[14.5px] font-semibold text-fg">{action}</span>
        <span className="text-[13px] text-muted">{hint}</span>
        <input
          type="file"
          multiple
          accept={FILE_ACCEPT}
          className="sr-only"
          onChange={(e) => {
            onChange([...files, ...Array.from(e.target.files ?? [])]);
            e.target.value = "";
          }}
        />
      </label>
      {files.length > 0 && (
        <ul className="grid gap-1.5">
          {files.map((f, i) => (
            <li key={`${f.name}-${i}`} className="flex items-center justify-between gap-3 rounded-md bg-bg-soft px-3 py-2 text-[13.5px]">
              <span className="truncate">{f.name}</span>
              <span className="flex flex-none items-center gap-3 text-muted">
                {(f.size / 1024 / 1024).toFixed(1).replace(".", ",")} Mo
                <button
                  type="button"
                  onClick={() => onChange(files.filter((_, j) => j !== i))}
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
    </fieldset>
  );
}

// S'ouvre dès que l'URL porte #etude : tous les boutons « Demander une étude » pointent vers cette ancre.
export function StudyDialog() {
  const dialog = useRef<HTMLDialogElement>(null);
  const [state, setState] = useState<StudyRequestState | null>(null);
  const [files, setFiles] = useState<PickedFiles>(noFiles);
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
      setFiles(noFiles);
      setFormKey((k) => k + 1);
    }
  }

  function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    const kinds = Object.keys(files) as (keyof PickedFiles)[];
    const picked = kinds.flatMap((kind) => files[kind].map((file) => ({ kind: kind as FileKind, file })));
    data.set("files", JSON.stringify(picked.map(({ kind, file }) => ({ kind, name: file.name, size: file.size, type: file.type }))));
    startTransition(async () => {
      try {
        const result = await submitStudyRequest(data);
        // La demande est enregistrée : les fichiers partent directement vers le stockage.
        if (result.ok && result.requestId && picked.length) {
          const failed = await uploadSigned(result.uploads ?? [], picked.map((p) => p.file));
          await completeStudyRequest(result.requestId);
          if (failed.length) {
            result.message = `Votre demande est bien enregistrée, mais ces fichiers n’ont pas pu être envoyés : ${failed.join(", ")}. Notre équipe vous les redemandera.`;
          }
        }
        setState(result);
      } catch {
        setState({ ok: false, message: "L’envoi a échoué. Vérifiez votre connexion et réessayez." });
      }
    });
  }

  const tooBig =
    files.facture.length > MAX_FILES.facture ||
    files.enedis.length > MAX_FILES.enedis ||
    files.toiture.length > MAX_FILES.toiture ||
    Object.values(files).flat().some((f) => f.size > MAX_FILE_BYTES);
  const filesError = tooBig ? "Trop de fichiers ou fichier trop lourd : 20 Mo maximum par fichier." : state?.errors?.bills;

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
          {state.missing && state.missing.length > 0 && (
            <div className="w-full max-w-[460px] rounded-lg bg-bg-soft px-4 py-3 text-left text-[14px]">
              <p className="mb-1.5 font-semibold text-heading">Pour lancer l’étude, il nous manquera encore :</p>
              <ul className="grid list-disc gap-1 pl-5 text-fg">
                {state.missing.map((m) => (
                  <li key={m}>{m}</li>
                ))}
              </ul>
            </div>
          )}
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
            <legend className="mb-1 text-[15px] font-bold text-heading">Contexte du projet et motivation</legend>
            <div className="grid gap-2 sm:grid-cols-2">
              {Object.entries(MOTIVATIONS).map(([value, text]) => (
                <label key={value} className="flex cursor-pointer items-start gap-2.5 rounded-lg border border-line px-3 py-2.5 text-[14px] text-fg has-checked:border-brand-text has-checked:bg-brand/5">
                  <input type="checkbox" name="motivations" value={value} className="mt-0.5 size-[18px] flex-none accent-brand" />
                  {text}
                </label>
              ))}
            </div>
            <textarea
              name="context"
              rows={3}
              aria-label="Contexte du projet"
              placeholder="Parlez-nous de la mosquée et de votre projet : travaux prévus, échéances, décision du bureau…"
              className={`${fieldClass} h-auto py-2.5`}
            />
            {state?.errors?.motivation && <span className={errorText}>{state.errors.motivation}</span>}
          </fieldset>

          <FilePicker
            title={`Les ${REQUIRED_BILLS} dernières factures d’électricité`}
            action="Ajouter vos factures"
            hint={`Pour connaître le coût exact du kWh sur une année · ${files.facture.length} / ${REQUIRED_BILLS}`}
            files={files.facture}
            onChange={(facture) => setFiles((f) => ({ ...f, facture }))}
          />

          <FilePicker
            title="Autorisation Enedis signée et complétée"
            action="Joindre l’autorisation"
            hint="Pour accéder à la consommation réelle. Pas encore signée ? Nous vous l’enverrons."
            files={files.enedis}
            onChange={(enedis) => setFiles((f) => ({ ...f, enedis }))}
          />

          <FilePicker
            title="Vue aérienne de la toiture (si possible)"
            action="Ajouter une vue aérienne"
            hint="Une image claire de la toiture à exploiter, par exemple une capture satellite"
            files={files.toiture}
            onChange={(toiture) => setFiles((f) => ({ ...f, toiture }))}
          />
          {filesError && <p className={errorText}>{filesError}</p>}

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
