"use client";

import { useState, useTransition } from "react";
import { completeDossierUpload, prepareDossierUpload } from "@/app/actions/dossier";
import { Icon } from "@/components/dashboard/ui";
import { FILE_ACCEPT, type FileKind } from "@/lib/dossier";
import { uploadSigned } from "@/lib/dossier-upload";

export function PieceUpload({ requestId, kind, label }: { requestId: string; kind: FileKind; label: string }) {
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function send(files: File[]) {
    setMessage(null);
    startTransition(async () => {
      try {
        const declared = files.map((f) => ({ kind, name: f.name, size: f.size, type: f.type }));
        const { uploads, error } = await prepareDossierUpload(requestId, JSON.stringify(declared));
        if (error || !uploads) return setMessage(error ?? "L’envoi a échoué.");
        const failed = await uploadSigned(uploads, files);
        await completeDossierUpload(requestId);
        if (failed.length) setMessage(`Non envoyés : ${failed.join(", ")}.`);
      } catch {
        setMessage("L’envoi a échoué. Vérifiez votre connexion et réessayez.");
      }
    });
  }

  return (
    <div className="grid gap-1">
      <label className={`flex items-center gap-3 rounded-lg border border-dashed border-line px-4 py-3 text-[14px] font-medium text-fg ${pending ? "opacity-60" : "cursor-pointer hover:bg-bg-soft"}`}>
        <Icon name="upload" className="size-5 flex-none text-brand-text" />
        {pending ? "Envoi en cours…" : label}
        <input
          type="file"
          multiple
          accept={FILE_ACCEPT}
          disabled={pending}
          className="sr-only"
          onChange={(e) => {
            const files = Array.from(e.target.files ?? []);
            e.target.value = "";
            if (files.length) send(files);
          }}
        />
      </label>
      {message && <p role="alert" className="text-[13px] font-medium text-red-600 dark:text-red-400">{message}</p>}
    </div>
  );
}
