"use client";

import { useState } from "react";
import { deleteRequestFile } from "@/app/actions/admin";
import { ConfirmButton } from "@/components/admin/forms";
import { ShareButton, type ShareMode } from "@/components/admin/share-dialog";
import { ghostButtonClass, Icon } from "@/components/dashboard/ui";
import type { RequestFile } from "@/lib/admin/data";
import { FILE_KIND_LABEL } from "@/lib/dossier";

const formatSize = (b: number) =>
  b >= 1024 * 1024 ? `${(b / 1024 / 1024).toFixed(1).replace(".", ",")} Mo` : `${Math.max(1, Math.round(b / 1024))} Ko`;

const iconButton =
  "flex size-8 flex-none cursor-pointer items-center justify-center rounded-md text-muted hover:bg-bg-soft hover:text-brand-text";
const deleteIconClass =
  "flex size-8 flex-none cursor-pointer items-center justify-center rounded-md text-muted hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-400/10";

/** Factures et documents d'une demande : sélection multiple, téléchargement groupé (ZIP) et partage. */
export function RequestFiles({
  requestId,
  files,
  mode = "request",
}: {
  requestId: string;
  files: RequestFile[];
  /** `study` : documents de l'étude, partagés avec la mosquée. */
  mode?: ShareMode;
}) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const download = (ids: string[]) => `/admin/demandes/${requestId}/telecharger${ids.length ? `?f=${ids.join(",")}` : ""}`;

  if (files.length === 0) return <p className="mb-4 text-[14px] text-muted">Aucun fichier envoyé avec la demande.</p>;

  const all = selected.size === files.length;
  const ids = files.filter((f) => selected.has(f.id)).map((f) => f.id);
  const toggle = (id: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const images = files.filter((f) => f.mime?.startsWith("image/") && f.url);
  const others = files.filter((f) => !images.includes(f));

  const actions = (f: RequestFile) => (
    <>
      <a href={download([f.id])} className={iconButton} title="Télécharger" aria-label={`Télécharger ${f.name}`}>
        <Icon name="download" className="size-4" />
      </a>
      <ShareButton
        requestId={requestId}
        fileIds={[f.id]}
        mode={mode}
        title={`Partager « ${f.name} »`}
        label={`Partager ${f.name}`}
        className={iconButton}
      >
        <Icon name="share" className="size-4" />
      </ShareButton>
      <form action={deleteRequestFile}>
        <input type="hidden" name="id" value={f.id} />
        <ConfirmButton message={`Supprimer « ${f.name} » ?`} label={`Supprimer ${f.name}`} className={deleteIconClass}>
          <Icon name="trash" className="size-4" />
        </ConfirmButton>
      </form>
    </>
  );

  const checkbox = (f: RequestFile) => (
    <input
      type="checkbox"
      checked={selected.has(f.id)}
      onChange={() => toggle(f.id)}
      aria-label={`Sélectionner ${f.name}`}
      className="size-4 flex-none cursor-pointer accent-brand"
    />
  );

  return (
    <>
      <div className="mb-4 flex flex-wrap items-center gap-3 rounded-lg bg-bg-soft px-3 py-2">
        <label className="flex cursor-pointer items-center gap-2 text-[13.5px] font-medium text-fg">
          <input
            type="checkbox"
            checked={all}
            ref={(el) => {
              if (el) el.indeterminate = selected.size > 0 && !all;
            }}
            onChange={() => setSelected(all ? new Set() : new Set(files.map((f) => f.id)))}
            className="size-4 cursor-pointer accent-brand"
          />
          {selected.size ? `${selected.size} sélectionné${selected.size > 1 ? "s" : ""}` : "Tout sélectionner"}
        </label>
        <div className="ml-auto flex flex-wrap gap-2">
          <a href={download(ids)} className={`${ghostButtonClass} h-8 px-3 text-[13px]`}>
            <Icon name="download" className="size-4" />
            {ids.length ? `Télécharger (${ids.length})` : "Tout télécharger"}
          </a>
          <ShareButton
            requestId={requestId}
            fileIds={ids.length ? ids : undefined}
            mode={mode}
            className={`${ghostButtonClass} h-8 px-3 text-[13px]`}
          >
            <Icon name="share" className="size-4" />
            {ids.length ? `Partager (${ids.length})` : "Partager"}
          </ShareButton>
        </div>
      </div>

      {images.length > 0 && (
        <ul className="mb-4 grid grid-cols-[repeat(auto-fill,minmax(160px,1fr))] gap-3">
          {images.map((f) => (
            <li
              key={f.id}
              className={`group relative overflow-hidden rounded-lg border bg-bg-soft ${
                selected.has(f.id) ? "border-brand-text ring-2 ring-brand-text/30" : "border-line"
              }`}
            >
              <span className="absolute left-2 top-2 z-[1] flex size-7 items-center justify-center rounded-md bg-card/90 shadow-sm">
                {checkbox(f)}
              </span>
              <a href={f.url!} target="_blank" rel="noreferrer" className="block overflow-hidden" title="Ouvrir en grand">
                {/* eslint-disable-next-line @next/next/no-img-element -- lien signé temporaire du stockage privé */}
                <img
                  src={f.url!}
                  alt={f.name}
                  className="aspect-[3/4] w-full object-cover object-top transition-transform group-hover:scale-[1.03]"
                />
              </a>
              <div className="grid gap-1 border-t border-line bg-card px-2.5 py-2">
                <span className="grid min-w-0 text-[12px] leading-tight">
                  <span className="truncate font-medium text-fg">{f.name}</span>
                  <span className="text-muted">
                    {FILE_KIND_LABEL[f.kind]} · {formatSize(f.size)}
                  </span>
                </span>
                <span className="-mx-1 flex justify-end">{actions(f)}</span>
              </div>
            </li>
          ))}
        </ul>
      )}

      {others.length > 0 && (
        <ul className="mb-4 grid gap-2">
          {others.map((f) => (
            <li
              key={f.id}
              className={`flex items-center gap-3 rounded-lg border px-3 py-2.5 ${
                selected.has(f.id) ? "border-brand-text bg-brand/5" : "border-line"
              }`}
            >
              {checkbox(f)}
              <span className="flex size-9 flex-none items-center justify-center rounded-md bg-red-50 text-[11px] font-bold text-red-700 dark:bg-red-400/10 dark:text-red-300">
                {f.mime === "application/pdf" ? "PDF" : "DOC"}
              </span>
              <span className="grid min-w-0 flex-1 text-[13.5px] leading-tight">
                {f.url ? (
                  <a
                    href={f.url}
                    target="_blank"
                    rel="noreferrer"
                    className="truncate font-medium text-fg hover:text-brand-text hover:underline"
                  >
                    {f.name}
                  </a>
                ) : (
                  <span className="truncate font-medium text-fg">{f.name}</span>
                )}
                <span className="text-muted">
                  {FILE_KIND_LABEL[f.kind]} · {formatSize(f.size)}
                </span>
              </span>
              <span className="flex flex-none items-center">{actions(f)}</span>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
