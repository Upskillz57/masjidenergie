"use client";

import Link from "next/link";
import { useCallback, useEffect, useState, useTransition } from "react";
import {
  markAllNotificationsRead,
  removePushSubscription,
  savePushSubscription,
  sendTestNotification,
  updateNotifyPrefs,
} from "@/app/actions/notifications";
import { NOTIFY_CATEGORIES, type NotifyCategory } from "@/lib/notifications";

// Application installable et notifications push sur l'appareil.

const VAPID = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? "";
const SW_SCOPE = "/admin/";

function keyBytes(base64: string) {
  const pad = "=".repeat((4 - (base64.length % 4)) % 4);
  const raw = atob((base64 + pad).replace(/-/g, "+").replace(/_/g, "/"));
  return Uint8Array.from(raw, (c) => c.charCodeAt(0));
}

type InstallEvent = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: string }> };
let deferredInstall: InstallEvent | null = null;

/** Enregistre le service worker sur toutes les pages de l'admin et retient la proposition d'installation. */
export function ServiceWorkerRegister() {
  useEffect(() => {
    if ("serviceWorker" in navigator)
      navigator.serviceWorker.register("/sw.js", { scope: SW_SCOPE, updateViaCache: "none" }).catch(() => {});
    const onPrompt = (e: Event) => {
      e.preventDefault();
      deferredInstall = e as InstallEvent;
      window.dispatchEvent(new Event("me:installable"));
    };
    window.addEventListener("beforeinstallprompt", onPrompt);
    return () => window.removeEventListener("beforeinstallprompt", onPrompt);
  }, []);
  return null;
}

type PushState = {
  ready: boolean;
  supported: boolean;
  ios: boolean;
  standalone: boolean;
  permission: NotificationPermission | "unsupported";
  subscribed: boolean;
  installable: boolean;
};

function usePush() {
  const [state, setState] = useState<PushState>({
    ready: false,
    supported: false,
    ios: false,
    standalone: false,
    permission: "default",
    subscribed: false,
    installable: false,
  });
  const [busy, setBusy] = useState(false);

  const read = useCallback(async () => {
    const supported =
      "serviceWorker" in navigator && "PushManager" in window && "Notification" in window && Boolean(VAPID);
    const ios =
      /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
    const standalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (navigator as { standalone?: boolean }).standalone === true;
    let subscribed = false;
    if (supported) {
      const reg = await navigator.serviceWorker.getRegistration(SW_SCOPE);
      subscribed = Boolean(await reg?.pushManager.getSubscription());
    }
    setState({
      ready: true,
      supported,
      ios,
      standalone,
      permission: supported ? Notification.permission : "unsupported",
      subscribed,
      installable: Boolean(deferredInstall),
    });
  }, []);

  useEffect(() => {
    queueMicrotask(read);
    const onInstallable = () => setState((s) => ({ ...s, installable: true }));
    window.addEventListener("me:installable", onInstallable);
    return () => window.removeEventListener("me:installable", onInstallable);
  }, [read]);

  const enable = async () => {
    setBusy(true);
    try {
      const permission = await Notification.requestPermission();
      if (permission === "granted") {
        const reg =
          (await navigator.serviceWorker.getRegistration(SW_SCOPE)) ??
          (await navigator.serviceWorker.register("/sw.js", { scope: SW_SCOPE, updateViaCache: "none" }));
        await navigator.serviceWorker.ready;
        const sub =
          (await reg.pushManager.getSubscription()) ??
          (await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: keyBytes(VAPID) }));
        await savePushSubscription(JSON.parse(JSON.stringify(sub)), navigator.userAgent);
      }
    } finally {
      setBusy(false);
      await read();
    }
  };

  const disable = async () => {
    setBusy(true);
    try {
      const sub = await (await navigator.serviceWorker.getRegistration(SW_SCOPE))?.pushManager.getSubscription();
      if (sub) {
        await removePushSubscription(sub.endpoint);
        await sub.unsubscribe();
      }
    } finally {
      setBusy(false);
      await read();
    }
  };

  const install = async () => {
    if (!deferredInstall) return;
    await deferredInstall.prompt();
    await deferredInstall.userChoice;
    deferredInstall = null;
    await read();
  };

  return { ...state, busy, enable, disable, install };
}

const btn =
  "inline-flex h-9 cursor-pointer items-center justify-center gap-2 rounded-lg bg-brand px-3.5 text-[13.5px] font-semibold text-white hover:bg-brand-hover disabled:cursor-default disabled:opacity-60";
const ghost =
  "inline-flex h-9 cursor-pointer items-center justify-center gap-2 rounded-lg border border-line bg-card px-3.5 text-[13.5px] font-semibold text-fg hover:bg-bg-soft disabled:opacity-60";

function IosSteps() {
  return (
    <ol className="mt-1 grid gap-1 text-[13px] text-muted">
      <li>
        1. Ouvrez ce site dans <strong className="text-fg">Safari</strong>.
      </li>
      <li>
        2. Touchez <strong className="text-fg">Partager</strong>{" "}
        <svg viewBox="0 0 24 24" className="inline size-4 align-[-3px]" fill="none" stroke="currentColor" strokeWidth="1.9" aria-hidden>
          <path d="M12 3v12M7 8l5-5 5 5M5 12v7a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-7" />
        </svg>{" "}
        puis <strong className="text-fg">Sur l’écran d’accueil</strong>.
      </li>
      <li>3. Ouvrez l’application « ME Équipe », connectez-vous, puis activez les notifications ici.</li>
    </ol>
  );
}

/** Réglages de cet appareil : installation de l'application et notifications push. */
export function DeviceSettings() {
  const p = usePush();
  const [testSent, setTestSent] = useState(false);
  if (!p.ready) return <div className="h-24 animate-pulse rounded-lg bg-placeholder" />;

  const needsInstall = p.ios && !p.standalone;
  return (
    <div className="grid gap-5">
      <div className="grid gap-1.5">
        <p className="text-[14px] font-semibold text-heading">Application sur votre téléphone</p>
        {p.standalone ? (
          <p className="text-[13px] text-muted">L’application est installée sur cet appareil.</p>
        ) : p.installable ? (
          <div className="flex flex-wrap items-center gap-3">
            <p className="text-[13px] text-muted">Installez « ME Équipe » pour l’ouvrir comme une application.</p>
            <button type="button" onClick={p.install} className={btn}>
              Installer l’application
            </button>
          </div>
        ) : p.ios ? (
          <IosSteps />
        ) : (
          <p className="text-[13px] text-muted">
            Sur téléphone : ouvrez ce site puis « Ajouter à l’écran d’accueil » (ou « Installer l’application ») dans le
            menu du navigateur.
          </p>
        )}
      </div>

      <div className="grid gap-1.5 border-t border-line pt-5">
        <p className="text-[14px] font-semibold text-heading">Notifications sur cet appareil</p>
        {!p.supported && needsInstall ? (
          <p className="text-[13px] text-muted">
            Sur iPhone, les notifications fonctionnent une fois l’application installée (étapes ci-dessus).
          </p>
        ) : !p.supported ? (
          <p className="text-[13px] text-muted">
            {VAPID
              ? "Ce navigateur ne gère pas les notifications push."
              : "Notifications push non configurées sur le serveur (clés VAPID manquantes)."}
          </p>
        ) : p.permission === "denied" ? (
          <p className="text-[13px] text-amber-700 dark:text-amber-300">
            Les notifications sont bloquées pour ce site. Autorisez-les dans les réglages du navigateur (ou du téléphone),
            puis revenez ici.
          </p>
        ) : p.subscribed ? (
          <div className="flex flex-wrap items-center gap-2.5">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-2.5 py-1 text-[12.5px] font-semibold text-emerald-800 dark:bg-emerald-400/15 dark:text-emerald-300">
              <span className="size-1.5 rounded-full bg-emerald-500" /> Activées
            </span>
            <button
              type="button"
              onClick={async () => {
                await sendTestNotification();
                setTestSent(true);
                setTimeout(() => setTestSent(false), 4000);
              }}
              className={ghost}
            >
              {testSent ? "Envoyée ✓" : "M’envoyer un essai"}
            </button>
            <button
              type="button"
              onClick={p.disable}
              disabled={p.busy}
              className="cursor-pointer text-[13px] font-semibold text-muted hover:text-fg"
            >
              Désactiver sur cet appareil
            </button>
          </div>
        ) : (
          <div className="flex flex-wrap items-center gap-3">
            <p className="text-[13px] text-muted">Soyez prévenu même quand l’application est fermée.</p>
            <button type="button" onClick={p.enable} disabled={p.busy} className={btn}>
              {p.busy ? "Activation…" : "Activer les notifications"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

/** Bandeau discret dans l'espace de travail tant que les notifications ne sont pas activées sur l'appareil. */
export function PushBanner() {
  const p = usePush();
  const [hidden, setHidden] = useState(true);
  useEffect(() => {
    queueMicrotask(() => {
      let off = false;
      try {
        off = localStorage.getItem("me:push-banner") === "off";
      } catch {}
      setHidden(off);
    });
  }, []);
  if (!p.ready || hidden || p.subscribed || p.permission === "denied") return null;
  if (!p.supported && !(p.ios && !p.standalone)) return null;
  const dismiss = () => {
    setHidden(true);
    try {
      localStorage.setItem("me:push-banner", "off");
    } catch {}
  };
  return (
    <div className="mb-5 flex flex-wrap items-center gap-3 rounded-xl border border-gold/40 bg-gold/10 px-4 py-3">
      <svg viewBox="0 0 24 24" className="size-5 flex-none text-gold-dark" fill="none" stroke="currentColor" strokeWidth="1.9" aria-hidden>
        <path d="M6 8a6 6 0 1 1 12 0c0 7 3 9 3 9H3s3-2 3-9M10.3 21a1.9 1.9 0 0 0 3.4 0" />
      </svg>
      <p className="min-w-0 flex-1 text-[13.5px] text-fg">
        {p.supported
          ? "Recevez une notification quand on vous confie une tâche, qu’on vous écrit ou qu’une demande arrive."
          : "Installez l’application sur votre iPhone pour recevoir les notifications."}
      </p>
      {p.supported ? (
        <button type="button" onClick={p.enable} disabled={p.busy} className={btn}>
          {p.busy ? "Activation…" : "Activer"}
        </button>
      ) : (
        <Link href="/admin/notifications#reglages" className={btn}>
          Comment faire
        </Link>
      )}
      <button type="button" onClick={dismiss} aria-label="Masquer" className="cursor-pointer text-muted hover:text-fg">
        <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
          <path d="M6 6l12 12M18 6 6 18" />
        </svg>
      </button>
    </div>
  );
}

/** Préférences : e-mails et catégories. Chaque changement est enregistré aussitôt. */
export function NotifyPrefs({ email, muted }: { email: boolean; muted: NotifyCategory[] }) {
  const [prefs, setPrefs] = useState({ email, muted });
  const [, start] = useTransition();
  const save = (next: typeof prefs) => {
    setPrefs(next);
    start(() => updateNotifyPrefs(next));
  };
  const toggle = (key: string, on: boolean, onChange: () => void, label: string, hint: string) => (
    <label key={key} className="flex cursor-pointer items-start justify-between gap-4 py-3">
      <span className="grid gap-0.5">
        <span className="text-[14px] font-semibold text-heading">{label}</span>
        <span className="text-[12.5px] text-muted">{hint}</span>
      </span>
      <input type="checkbox" checked={on} onChange={onChange} className="peer sr-only" />
      <span
        aria-hidden
        className={`relative mt-0.5 h-6 w-11 flex-none rounded-full transition-colors peer-focus-visible:ring-2 peer-focus-visible:ring-brand-text/40 ${
          on ? "bg-brand" : "bg-line"
        }`}
      >
        <span className={`absolute top-0.5 size-5 rounded-full bg-white shadow transition-[left] ${on ? "left-[22px]" : "left-0.5"}`} />
      </span>
    </label>
  );
  return (
    <div className="divide-y divide-line">
      {(Object.keys(NOTIFY_CATEGORIES) as NotifyCategory[]).map((c) =>
        toggle(
          c,
          !prefs.muted.includes(c),
          () =>
            save({ ...prefs, muted: prefs.muted.includes(c) ? prefs.muted.filter((m) => m !== c) : [...prefs.muted, c] }),
          NOTIFY_CATEGORIES[c].label,
          NOTIFY_CATEGORIES[c].hint,
        ),
      )}
      {toggle(
        "email",
        prefs.email,
        () => save({ ...prefs, email: !prefs.email }),
        "E-mails",
        "Pour ce qui vous concerne directement : tâche ou demande confiée, message, mention.",
      )}
    </div>
  );
}

export function MarkAllReadButton() {
  const [pending, start] = useTransition();
  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => start(() => markAllNotificationsRead())}
      className="cursor-pointer text-[13px] font-semibold text-brand-text hover:underline disabled:opacity-60"
    >
      Tout marquer comme lu
    </button>
  );
}
