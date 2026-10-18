"use client";

import { useEffect, useRef, useState } from "react";

type InstallPromptEvent = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: string }> };

const ghost =
  "flex h-12 w-full cursor-pointer items-center justify-center gap-2 rounded-xl border border-line bg-card text-[14.5px] font-semibold text-fg hover:bg-bg-soft";

const isAppleMobile = () =>
  /iPhone|iPad|iPod/i.test(navigator.userAgent) || (navigator.maxTouchPoints > 1 && /Macintosh/.test(navigator.userAgent));

/**
 * Ajout de la carte à l'écran d'accueil : invite native sur Android (Chrome, Edge, Samsung Internet),
 * mode d'emploi pas à pas sur iPhone / iPad où Safari ne propose pas d'invite automatique.
 */
export function InstallButton() {
  const deferred = useRef<InstallPromptEvent | null>(null);
  const [help, setHelp] = useState<"ios" | "android" | null>(null);
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    const onPrompt = (e: Event) => {
      e.preventDefault();
      deferred.current = e as InstallPromptEvent;
    };
    const onInstalled = () => setInstalled(true);
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  async function install() {
    if (deferred.current) {
      await deferred.current.prompt();
      const { outcome } = await deferred.current.userChoice;
      deferred.current = null;
      if (outcome === "accepted") setInstalled(true);
      return;
    }
    setHelp(isAppleMobile() ? "ios" : "android");
  }

  if (installed) {
    return (
      <p className="rounded-xl bg-brand/10 px-4 py-3 text-center text-[14px] font-medium text-brand-text">
        Carte ajoutée à l’écran d’accueil.
      </p>
    );
  }

  return (
    <div className="grid gap-2">
      <button type="button" onClick={install} className={ghost}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.9} strokeLinecap="round" strokeLinejoin="round" className="size-5" aria-hidden>
          <rect x="6" y="2" width="12" height="20" rx="2.5" />
          <path d="M12 7v7M9 11l3 3 3-3M10 18h4" />
        </svg>
        Ajouter à l’écran d’accueil
      </button>
      {help && (
        <div role="status" className="rounded-xl border border-line bg-card px-4 py-3 text-[14px] leading-relaxed text-fg">
          {help === "ios" ? (
            <ol className="list-decimal pl-5">
              <li>
                Touchez le bouton <strong>Partager</strong>{" "}
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="inline size-4 align-[-2px]" aria-hidden>
                  <path d="M12 3v12M8 7l4-4 4 4M5 12v7a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-7" />
                </svg>{" "}
                de Safari.
              </li>
              <li>
                Choisissez <strong>« Sur l’écran d’accueil »</strong>, puis <strong>Ajouter</strong>.
              </li>
            </ol>
          ) : (
            <ol className="list-decimal pl-5">
              <li>
                Ouvrez le menu du navigateur <strong>⋮</strong> (en haut à droite).
              </li>
              <li>
                Choisissez <strong>« Ajouter à l’écran d’accueil »</strong> ou <strong>« Installer l’application »</strong>.
              </li>
            </ol>
          )}
        </div>
      )}
    </div>
  );
}

export function ShareButton({ url, title }: { url: string; title: string }) {
  const [copied, setCopied] = useState(false);
  async function share() {
    if (navigator.share) {
      // Annuler la feuille de partage rejette la promesse : rien à faire dans ce cas.
      await navigator.share({ title, url }).catch(() => {});
      return;
    }
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }
  return (
    <button type="button" onClick={share} className={ghost}>
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.9} strokeLinecap="round" strokeLinejoin="round" className="size-5" aria-hidden>
        <circle cx="18" cy="5" r="3" />
        <circle cx="6" cy="12" r="3" />
        <circle cx="18" cy="19" r="3" />
        <path d="m8.6 13.5 6.8 4M15.4 6.5l-6.8 4" />
      </svg>
      {copied ? "Lien copié" : "Partager la carte"}
    </button>
  );
}

export function CopyButton({ value, label = "Copier le lien" }: { value: string; label?: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      onClick={async () => {
        await navigator.clipboard.writeText(value);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }}
      className="inline-flex h-9 cursor-pointer items-center rounded-lg border border-line bg-card px-3 text-[13px] font-semibold text-fg hover:bg-bg-soft"
    >
      {copied ? "Copié ✓" : label}
    </button>
  );
}
