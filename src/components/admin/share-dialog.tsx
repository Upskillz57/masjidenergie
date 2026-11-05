"use client";

import { useActionState, useEffect, useMemo, useRef, useState, useTransition, type ReactNode } from "react";
import { getShareData, shareRequestByEmail, type ShareData } from "@/app/actions/share";
import { buttonClass, ghostButtonClass, Icon, inputClass } from "@/components/dashboard/ui";
import { FILE_KIND_LABEL } from "@/lib/dossier";

const MAX_MB = 25;
const formatSize = (b: number) =>
  b >= 1024 * 1024 ? `${(b / 1024 / 1024).toFixed(1).replace(".", ",")} Mo` : `${Math.max(1, Math.round(b / 1024))} Ko`;

function defaultMessage(d: ShareData, count: number) {
  const city = d.address?.match(/\b\d{5}\s+(.+)$/)?.[1];
  return `Assalamou alaykoum,

Vous trouverez ${count ? "ci-joint" : "ci-dessous"} le dossier de la demande d’étude de ${d.mosqueName}${city ? ` (${city})` : ""}${
    count ? ` : ${count} document${count > 1 ? "s" : ""} (factures, autorisations, photos…)` : ""
  }.

Bien à vous,
${d.sender}
Masjid Energie`;
}

type Props = {
  requestId: string;
  /** Documents cochés à l'ouverture ; tous si absent. */
  fileIds?: string[];
  title?: string;
  className?: string;
  children: ReactNode;
  label?: string;
};

/** Bouton qui ouvre la fenêtre « Partager » : e-mail avec les documents choisis en pièces jointes. */
export function ShareButton({ requestId, fileIds, title, className = ghostButtonClass, children, label }: Props) {
  const ref = useRef<HTMLDialogElement>(null);
  const [open, setOpen] = useState(false);
  const [key, setKey] = useState(0);

  return (
    <>
      <button
        type="button"
        aria-label={label}
        title={label}
        className={className}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setKey((k) => k + 1);
          setOpen(true);
          ref.current?.showModal();
        }}
      >
        {children}
      </button>
      <dialog
        ref={ref}
        onClose={() => setOpen(false)}
        onClick={(e) => {
          e.stopPropagation();
          if (e.target === ref.current) ref.current.close();
        }}
        className="m-auto max-h-[calc(100dvh-24px)] w-[min(640px,calc(100vw-24px))] overflow-y-auto rounded-2xl border border-line bg-card p-0 text-left text-fg shadow-2xl backdrop:bg-black/50"
      >
        {open && (
          <SharePanel key={key} requestId={requestId} fileIds={fileIds} title={title} onClose={() => ref.current?.close()} />
        )}
      </dialog>
    </>
  );
}

function SharePanel({
  requestId,
  fileIds,
  title,
  onClose,
}: {
  requestId: string;
  fileIds?: string[];
  title?: string;
  onClose: () => void;
}) {
  const [data, setData] = useState<ShareData | null | undefined>(undefined);
  const [loading, startLoading] = useTransition();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [state, action, sending] = useActionState(shareRequestByEmail, null);
  const [message, setMessage] = useState("");

  useEffect(() => {
    startLoading(async () => {
      const d = await getShareData(requestId);
      setData(d);
      if (!d) return;
      const initial = new Set(fileIds ?? d.files.map((f) => f.id));
      setSelected(initial);
      setMessage(defaultMessage(d, initial.size));
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- chargé une fois à l'ouverture
  }, []);

  const total = useMemo(
    () => (data?.files ?? []).filter((f) => selected.has(f.id)).reduce((s, f) => s + f.size, 0),
    [data, selected],
  );

  const select = (next: Set<string>) => setSelected(next);
  const toggle = (id: string) => {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    select(next);
  };

  const heading = title ?? (data ? `Partager la demande n°${data.number}` : "Partager la demande");
  const tooBig = total > MAX_MB * 1024 * 1024;

  return (
    <div className="grid gap-5 p-5 sm:p-6">
      <header className="flex items-start justify-between gap-4">
        <div className="grid min-w-0 gap-1">
          <h2 className="break-words text-[19px] font-extrabold leading-tight text-heading">{heading}</h2>
          {data && <p className="text-[13.5px] text-muted">{data.mosqueName}</p>}
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Fermer"
          className="flex size-9 flex-none cursor-pointer items-center justify-center rounded-lg text-muted hover:bg-bg-soft hover:text-fg"
        >
          <Icon name="close" className="size-5" />
        </button>
      </header>

      {data === undefined || loading ? (
        <div className="grid gap-3" aria-busy="true">
          <div className="h-10 animate-pulse rounded-lg bg-bg-soft" />
          <div className="h-40 animate-pulse rounded-lg bg-bg-soft" />
        </div>
      ) : data === null ? (
        <p className="text-[14px] text-red-600">Demande introuvable.</p>
      ) : (
        <>
          {data.files.length > 0 && (
            <fieldset className="grid gap-2">
              <legend className="mb-2 flex w-full items-center justify-between gap-3 text-[13px] font-semibold text-fg">
                <span>
                  Documents en pièces jointes ({selected.size}/{data.files.length})
                  {selected.size > 0 && <span className="font-normal text-muted"> · {formatSize(total)}</span>}
                </span>
                <span className="flex gap-3 font-medium">
                  <button
                    type="button"
                    onClick={() => select(new Set(data.files.map((f) => f.id)))}
                    className="cursor-pointer text-brand-text hover:underline"
                  >
                    Tout
                  </button>
                  <button type="button" onClick={() => select(new Set())} className="cursor-pointer text-brand-text hover:underline">
                    Aucun
                  </button>
                </span>
              </legend>
              <ul className="grid max-h-44 gap-1 overflow-y-auto rounded-lg border border-line p-1.5">
                {data.files.map((f) => (
                  <li key={f.id}>
                    <label className="flex cursor-pointer items-center gap-3 rounded-md px-2 py-1.5 text-[13.5px] hover:bg-bg-soft">
                      <input
                        type="checkbox"
                        checked={selected.has(f.id)}
                        onChange={() => toggle(f.id)}
                        className="size-4 flex-none accent-brand"
                      />
                      <span className="min-w-0 flex-1 truncate text-fg">{f.name}</span>
                      <span className="hidden flex-none text-[12px] text-muted sm:inline">
                        {FILE_KIND_LABEL[f.kind]} · {formatSize(f.size)}
                      </span>
                    </label>
                  </li>
                ))}
              </ul>
            </fieldset>
          )}

          <form action={action} className="grid gap-3">
              <input type="hidden" name="id" value={data.id} />
              {[...selected].map((id) => (
                <input key={id} type="hidden" name="files" value={id} />
              ))}
              <label className="grid gap-1.5 text-[13px] font-semibold text-fg">
                Destinataire(s)
                <input
                  name="to"
                  type="text"
                  inputMode="email"
                  required
                  autoFocus
                  placeholder="prenom@exemple.fr, autre@exemple.fr"
                  className={inputClass}
                />
              </label>
              <label className="grid gap-1.5 text-[13px] font-semibold text-fg">
                Objet
                <input
                  name="subject"
                  required
                  defaultValue={`Demande d’étude n°${data.number} : ${data.mosqueName}`}
                  className={inputClass}
                />
              </label>
              <label className="grid gap-1.5 text-[13px] font-semibold text-fg">
                Message
                <textarea
                  name="message"
                  rows={8}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className={`${inputClass} h-auto py-2.5 font-normal leading-relaxed`}
                />
              </label>
              <p className="text-[12.5px] leading-relaxed text-muted">
                L’e-mail reprend la mise en page Masjid Energie : votre message, le récapitulatif de la demande et la liste des
                pièces jointes. Les réponses vous arriveront directement.
              </p>
              {tooBig && (
                <p className="text-[13px] font-medium text-red-600 dark:text-red-400">
                  {formatSize(total)} de pièces jointes : {MAX_MB} Mo au maximum. Décochez des documents.
                </p>
              )}
              {state && (
                <p
                  role="status"
                  className={`text-[13px] font-medium ${state.ok ? "text-brand-text" : "text-red-600 dark:text-red-400"}`}
                >
                  {state.message}
                </p>
              )}
              <div className="flex flex-wrap justify-end gap-2">
                <button type="button" onClick={onClose} className={ghostButtonClass}>
                  {state?.ok ? "Fermer" : "Annuler"}
                </button>
                <button type="submit" disabled={sending || tooBig} className={buttonClass}>
                  <Icon name="mail" className="size-4" />
                  {sending ? "Envoi…" : `Envoyer${selected.size ? ` avec ${selected.size} PJ` : ""}`}
                </button>
              </div>
            </form>
        </>
      )}
    </div>
  );
}
