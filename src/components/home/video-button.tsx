"use client";

import { useEffect, useRef, useState } from "react";
import { Play } from "@/components/icons";

export const VIDEO_HASH = "#video";

const SOURCES = {
  desktop: "/videos/masjid-energie-1080.mp4",
  mobile: "/videos/masjid-energie-720.mp4",
  poster: "/videos/masjid-energie-poster.jpg",
};

/** Bouton rond « lecture » posé au centre de l'image du hero (ordinateur). */
export function VideoPlayOverlay() {
  return (
    <a
      href={VIDEO_HASH}
      aria-label="Voir notre vidéo de présentation"
      className="group absolute left-[72%] top-1/2 z-[2] hidden -translate-x-1/2 -translate-y-1/2 justify-items-center gap-3 nav:grid"
    >
      <span className="relative flex size-[84px] items-center justify-center">
        <span className="absolute inset-0 animate-ping rounded-full bg-white/30 [animation-duration:2.4s]" />
        <span className="relative flex size-[84px] items-center justify-center rounded-full border-[3px] border-white/85 bg-white/90 text-brand shadow-[0_10px_30px_#00000040] transition-transform group-hover:scale-105">
          <Play className="ml-1 size-[26px]" />
        </span>
      </span>
      <span className="whitespace-nowrap rounded-full bg-black/35 px-3 py-1 text-sm font-semibold text-white backdrop-blur-sm">
        Voir la vidéo
      </span>
    </a>
  );
}

/**
 * Lecteur plein écran, ouvert dès que l'URL porte #video (bouton du hero, bouton mobile…).
 * La vidéo n'est montée qu'à l'ouverture : rien n'est téléchargé tant qu'on ne clique pas, et la fermeture coupe le son.
 */
export function VideoDialog() {
  const dialog = useRef<HTMLDialogElement>(null);
  const video = useRef<HTMLVideoElement>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const sync = () => {
      if (location.hash === VIDEO_HASH && !dialog.current?.open) {
        dialog.current?.showModal();
        setOpen(true);
      }
    };
    sync();
    window.addEventListener("hashchange", sync);
    return () => window.removeEventListener("hashchange", sync);
  }, []);

  useEffect(() => {
    // Lecture automatique ; si le navigateur la refuse, les contrôles restent disponibles.
    if (open) video.current?.play().catch(() => {});
  }, [open]);

  function onClose() {
    setOpen(false);
    if (location.hash === VIDEO_HASH) history.replaceState(null, "", location.pathname + location.search);
  }

  return (
    <dialog
      ref={dialog}
      onClose={onClose}
      onClick={(e) => e.target === dialog.current && dialog.current.close()}
      aria-label="Vidéo de présentation Masjid Energie"
      className="m-auto w-[min(1100px,94vw)] overflow-visible bg-transparent p-0 backdrop:bg-black/80 backdrop:backdrop-blur-sm"
    >
      <button
        type="button"
        onClick={() => dialog.current?.close()}
        className="absolute -top-11 right-0 flex h-9 cursor-pointer items-center gap-2 rounded-full bg-white/15 px-4 text-sm font-semibold text-white hover:bg-white/25"
      >
        Fermer <span aria-hidden>✕</span>
      </button>
      {open && (
        <video
          ref={video}
          controls
          playsInline
          preload="metadata"
          poster={SOURCES.poster}
          className="aspect-video max-h-[82dvh] w-full rounded-xl bg-black shadow-[0_30px_80px_#00000080]"
        >
          <source src={SOURCES.mobile} type="video/mp4" media="(max-width: 768px)" />
          <source src={SOURCES.desktop} type="video/mp4" />
        </video>
      )}
    </dialog>
  );
}
