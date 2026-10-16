"use client";

import { useRef, useState } from "react";
import { Play } from "@/components/icons";

export function VideoButton({ url }: { url: string }) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [open, setOpen] = useState(false);

  function show() {
    setOpen(true);
    dialogRef.current?.showModal();
  }

  return (
    <>
      <div className="absolute left-[61.5%] top-[340px] z-[2] hidden justify-items-center gap-2.5 nav:grid">
        <button
          type="button"
          onClick={show}
          aria-label="Voir notre vidéo"
          className="flex size-[66px] cursor-pointer items-center justify-center rounded-full border-[3px] border-white/80 bg-white/90 text-[#1d2a26] shadow-[0_8px_24px_#00000033] hover:bg-white"
        >
          <Play className="size-[18px]" />
        </button>
        <span className="whitespace-nowrap text-sm font-semibold text-white [text-shadow:0_1px_6px_#00000080]">
          Voir notre vidéo
        </span>
      </div>

      <dialog
        ref={dialogRef}
        onClose={() => setOpen(false)}
        onClick={(e) => e.target === dialogRef.current && dialogRef.current.close()}
        className="m-auto w-[min(960px,92vw)] overflow-visible bg-transparent p-0 backdrop:bg-black/70"
      >
        <button
          type="button"
          onClick={() => dialogRef.current?.close()}
          className="absolute -top-10 right-0 cursor-pointer text-sm font-semibold text-white"
        >
          Fermer ✕
        </button>
        {/* L'iframe n'est montée que pendant l'ouverture : la fermeture coupe la lecture. */}
        {open && (
          <iframe
            src={url}
            title="Vidéo de présentation Masjid Energie"
            allow="autoplay; fullscreen; picture-in-picture"
            allowFullScreen
            className="aspect-video w-full rounded-xl bg-black"
          />
        )}
      </dialog>
    </>
  );
}
