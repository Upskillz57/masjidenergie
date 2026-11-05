"use client";

import { useRef, useState } from "react";
import { finalizeStudyUpload, prepareStudyUpload } from "@/app/actions/study-upload";
import { buttonClass, Icon, inputClass } from "@/components/dashboard/ui";
import { FILE_ACCEPT } from "@/lib/dossier";
import { uploadSigned } from "@/lib/dossier-upload";

const formatSize = (b: number) =>
  b >= 1024 * 1024 ? `${(b / 1024 / 1024).toFixed(1).replace(".", ",")} Mo` : `${Math.max(1, Math.round(b / 1024))} Ko`;

/**
 * Dépôt de l'étude : documents + message. `staff` : version compacte de la fiche admin
 * (le nom de la personne connectée est utilisé), sinon page publique du bureau d'études.
 */
export function StudyUploadForm({ token, staff = false }: { token: string; staff?: boolean }) {
  const formRef = useRef<HTMLFormElement>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [busy, setBusy] = useState<string | null>(null);
  const [result, setResult] = useState<{ ok: boolean; message: string } | null>(null);

  async function submit(fd: FormData) {
    setResult(null);
    if (!files.length) return setResult({ ok: false, message: "Ajoutez au moins un document de l’étude." });
    setBusy("Préparation…");
    const prep = await prepareStudyUpload(
      token,
      files.map((f) => ({ name: f.name, size: f.size })),
    );
    if (!prep.ok) {
      setBusy(null);
      return setResult({ ok: false, message: prep.message });
    }
    setBusy(`Envoi de ${files.length} document${files.length > 1 ? "s" : ""}…`);
    const failed = await uploadSigned(prep.uploads, files);
    setBusy("Enregistrement…");
    const done = await finalizeStudyUpload(token, {
      name: String(fd.get("name") ?? ""),
      company: String(fd.get("company") ?? ""),
      note: String(fd.get("note") ?? ""),
    });
    setBusy(null);
    setResult(
      failed.length && done.ok
        ? { ok: false, message: `${done.message} Non envoyés : ${failed.join(", ")}. Réessayez pour ceux-ci.` }
        : done,
    );
    if (done.ok) {
      setFiles(failed.length ? files.filter((f) => failed.includes(f.name)) : []);
      if (!failed.length) formRef.current?.reset();
    }
  }

  if (result?.ok && !staff) {
    return (
      <div className="grid justify-items-center gap-4 py-8 text-center">
        <span className="flex size-14 items-center justify-center rounded-full bg-brand text-white">
          <Icon name="check" className="size-7" />
        </span>
        <p role="status" className="max-w-[440px] text-[16px] leading-normal text-fg">
          {result.message}
        </p>
        <button type="button" onClick={() => setResult(null)} className="text-[14px] font-semibold text-brand-text hover:underline">
          Envoyer d’autres documents
        </button>
      </div>
    );
  }

  return (
    <form ref={formRef} action={submit} className="grid gap-4">
      {!staff && (
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="grid gap-1.5 text-[13.5px] font-semibold text-fg">
            Votre nom
            <input name="name" required autoComplete="name" className={inputClass} />
          </label>
          <label className="grid gap-1.5 text-[13.5px] font-semibold text-fg">
            <span>
              Société <span className="font-normal text-muted">(facultatif)</span>
            </span>
            <input name="company" autoComplete="organization" className={inputClass} />
          </label>
        </div>
      )}

      <label className="grid cursor-pointer justify-items-center gap-2 rounded-xl border-2 border-dashed border-line bg-bg-soft px-4 py-6 text-center hover:border-brand-text/50">
        <Icon name="upload" className="size-7 text-brand-text" />
        <span className="text-[14.5px] font-semibold text-heading">
          {files.length ? "Ajouter d’autres documents" : "Choisir les documents de l’étude"}
        </span>
        <span className="text-[12.5px] text-muted">PDF ou images · 20 Mo maximum par document · 10 documents au plus</span>
        <input
          type="file"
          multiple
          accept={FILE_ACCEPT}
          className="sr-only"
          onChange={(e) => {
            const picked = [...(e.currentTarget.files ?? [])];
            setFiles((prev) => [...prev, ...picked].slice(0, 10));
            e.currentTarget.value = "";
          }}
        />
      </label>

      {files.length > 0 && (
        <ul className="grid gap-1.5">
          {files.map((f, i) => (
            <li key={`${f.name}-${i}`} className="flex items-center gap-3 rounded-lg border border-line px-3 py-2 text-[13.5px]">
              <Icon name="file" className="size-4 flex-none text-muted" />
              <span className="min-w-0 flex-1 truncate text-fg">{f.name}</span>
              <span className="flex-none text-[12px] text-muted">{formatSize(f.size)}</span>
              <button
                type="button"
                onClick={() => setFiles(files.filter((_, j) => j !== i))}
                aria-label={`Retirer ${f.name}`}
                className="flex size-7 flex-none cursor-pointer items-center justify-center rounded-md text-muted hover:bg-bg-soft hover:text-red-600"
              >
                <Icon name="close" className="size-4" />
              </button>
            </li>
          ))}
        </ul>
      )}

      <label className="grid gap-1.5 text-[13.5px] font-semibold text-fg">
        <span>
          {staff ? "Note sur l’étude" : "Message pour l’équipe"} <span className="font-normal text-muted">(facultatif)</span>
        </span>
        <textarea
          name="note"
          rows={staff ? 2 : 4}
          maxLength={5000}
          placeholder="Puissance proposée, production estimée, points d’attention…"
          className={`${inputClass} h-auto py-2.5 font-normal`}
        />
      </label>

      {result && (
        <p role="status" className={`text-[13.5px] font-medium ${result.ok ? "text-brand-text" : "text-red-600 dark:text-red-400"}`}>
          {result.message}
        </p>
      )}
      <div className="flex justify-end">
        <button type="submit" disabled={Boolean(busy)} className={buttonClass}>
          <Icon name="upload" className="size-4" />
          {busy ?? (staff ? "Ajouter l’étude" : "Envoyer l’étude")}
        </button>
      </div>
    </form>
  );
}
