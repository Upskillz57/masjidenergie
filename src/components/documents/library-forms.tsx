"use client";

import { useActionState, type ReactNode } from "react";
import { emailDocument, shareDocument, updateDocument, uploadDocument, type DocState } from "@/app/actions/documents";
import { DOC_CATEGORIES, FORM_KINDS, type LibraryDocument } from "@/lib/documents";

const input =
  "h-10 w-full rounded-lg border border-line bg-bg px-3 text-[14px] text-fg outline-none placeholder:text-muted focus:border-brand-text focus:ring-2 focus:ring-brand-text/20";
const label = "grid gap-1.5 text-[13px] font-semibold text-fg";
const button =
  "inline-flex h-10 cursor-pointer items-center justify-center gap-2 rounded-lg bg-brand px-4 text-[14px] font-semibold text-white hover:bg-brand-hover disabled:opacity-60";
const ghost =
  "inline-flex h-9 cursor-pointer items-center gap-1.5 rounded-lg border border-line bg-card px-3 text-[13px] font-semibold text-fg hover:bg-bg-soft";
const fileInput =
  "w-full text-[13.5px] text-muted file:mr-3 file:cursor-pointer file:rounded-md file:border-0 file:bg-brand/10 file:px-3 file:py-1.5 file:text-[13px] file:font-semibold file:text-brand-text";

function Feedback({ state }: { state: DocState }) {
  if (!state) return null;
  return (
    <p role="status" className={`text-[13px] font-medium ${state.ok ? "text-brand-text" : "text-red-600 dark:text-red-400"}`}>
      {state.message}
    </p>
  );
}

function MetaFields({ doc }: { doc?: LibraryDocument }) {
  return (
    <>
      <label className={label}>
        Titre
        <input name="title" defaultValue={doc?.title} maxLength={160} placeholder="Ex. Autorisation d’accès aux données Linky" className={input} />
      </label>
      <label className={label}>
        Catégorie
        <select name="category" defaultValue={doc?.category ?? "general"} className={`${input} cursor-pointer`}>
          {Object.entries(DOC_CATEGORIES).map(([k, v]) => (
            <option key={k} value={k}>
              {v}
            </option>
          ))}
        </select>
      </label>
      <label className={`${label} sm:col-span-2`}>
        Description <span className="font-normal text-muted">(facultatif)</span>
        <input name="description" defaultValue={doc?.description ?? ""} maxLength={600} className={input} />
      </label>
      <label className={label}>
        Formulaire à remplir en ligne
        <select name="form_kind" defaultValue={doc?.form_kind ?? ""} className={`${input} cursor-pointer`}>
          <option value="">Non, simple document</option>
          {Object.entries(FORM_KINDS).map(([k, v]) => (
            <option key={k} value={k}>
              Oui : {v}
            </option>
          ))}
        </select>
      </label>
      <label className="flex cursor-pointer items-center gap-2.5 self-end pb-2.5 text-[14px] text-fg">
        <input type="checkbox" name="visible" defaultChecked={doc?.visible_to_mosques ?? true} className="size-4 accent-brand" />
        Visible dans l’espace des mosquées
      </label>
    </>
  );
}

export function UploadDocumentForm() {
  const [state, action, pending] = useActionState(uploadDocument, null);
  return (
    <form action={action} className="grid gap-3 sm:grid-cols-2">
      <label className={`${label} sm:col-span-2`}>
        Fichier (PDF, Word, image… 4 Mo maximum)
        <input type="file" name="file" required className={fileInput} />
      </label>
      <MetaFields />
      <div className="flex flex-wrap items-center gap-3 sm:col-span-2">
        <button type="submit" disabled={pending} className={button}>
          {pending ? "Envoi…" : "Ajouter à la bibliothèque"}
        </button>
        <Feedback state={state} />
      </div>
    </form>
  );
}

function Disclosure({ summary, children }: { summary: ReactNode; children: ReactNode }) {
  return (
    <details className="group">
      <summary className={`${ghost} list-none [&::-webkit-details-marker]:hidden`}>{summary}</summary>
      <div className="mt-3 rounded-xl border border-line bg-bg-soft p-4">{children}</div>
    </details>
  );
}

export function EditDocument({ doc }: { doc: LibraryDocument }) {
  const [state, action, pending] = useActionState(updateDocument, null);
  return (
    <Disclosure summary="Modifier">
      <form action={action} className="grid gap-3 sm:grid-cols-2">
        <input type="hidden" name="id" value={doc.id} />
        <MetaFields doc={doc} />
        <label className={`${label} sm:col-span-2`}>
          Remplacer le fichier <span className="font-normal text-muted">(facultatif, nouvelle version)</span>
          <input type="file" name="file" className={fileInput} />
        </label>
        <div className="flex flex-wrap items-center gap-3 sm:col-span-2">
          <button type="submit" disabled={pending} className={button}>
            {pending ? "Enregistrement…" : "Enregistrer"}
          </button>
          <Feedback state={state} />
        </div>
      </form>
    </Disclosure>
  );
}

export function ShareDocument({ id, title }: { id: string; title: string }) {
  const [state, action, pending] = useActionState(async (prev: DocState, fd: FormData) => {
    const res = await shareDocument(prev, fd);
    if (res?.url) await navigator.clipboard.writeText(res.url).catch(() => {});
    return res;
  }, null);
  const [mailState, mailAction, mailPending] = useActionState(emailDocument, null);

  return (
    <Disclosure summary="Partager">
      <div className="grid gap-4">
        <form action={action} className="grid gap-2">
          <input type="hidden" name="id" value={id} />
          <p className="text-[13px] text-muted">Lien de téléchargement direct, sans compte, valable 7 jours.</p>
          <div className="flex flex-wrap items-center gap-2">
            <button type="submit" disabled={pending} className={ghost}>
              {pending ? "Création…" : "Créer et copier le lien"}
            </button>
            {state?.url && (
              <>
                <a href={`https://wa.me/?text=${encodeURIComponent(`${title} : ${state.url}`)}`} target="_blank" rel="noreferrer" className={ghost}>
                  Envoyer sur WhatsApp
                </a>
                <input readOnly value={state.url} onFocus={(e) => e.currentTarget.select()} className={`${input} h-9 min-w-[200px] flex-1 text-[12.5px]`} />
              </>
            )}
          </div>
          <Feedback state={state} />
        </form>
        <form action={mailAction} className="grid gap-2 border-t border-line pt-4 sm:grid-cols-[1fr_auto]">
          <input type="hidden" name="id" value={id} />
          <input name="to" type="email" required placeholder="E-mail du destinataire" className={input} />
          <button type="submit" disabled={mailPending} className={button}>
            {mailPending ? "Envoi…" : "Envoyer par e-mail"}
          </button>
          <textarea name="message" rows={2} maxLength={1000} placeholder="Message (facultatif)" className={`${input} h-auto py-2 sm:col-span-2`} />
          <div className="sm:col-span-2">
            <Feedback state={mailState} />
          </div>
        </form>
      </div>
    </Disclosure>
  );
}
