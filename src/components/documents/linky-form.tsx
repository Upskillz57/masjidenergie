"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { submitLinky } from "@/app/actions/documents";
import type { LinkyData } from "@/lib/documents";

const input =
  "h-11 w-full rounded-lg border border-line bg-bg px-3.5 text-[15px] text-fg outline-none placeholder:text-muted focus:border-brand-text focus:ring-2 focus:ring-brand-text/20";
const labelCls = "grid gap-1.5 text-[13.5px] font-semibold text-fg";
const errorText = "text-[12.5px] font-medium text-red-600 dark:text-red-400";
const legend = "mb-1 text-[16px] font-bold text-heading";

/** Zone de signature au doigt ou à la souris ; renvoie l'image PNG dans un champ caché. */
function SignaturePad({ name, error }: { name: string; error?: string }) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const hidden = useRef<HTMLInputElement>(null);
  const drawing = useRef(false);
  const [empty, setEmpty] = useState(true);

  useEffect(() => {
    const c = canvas.current!;
    const ratio = Math.max(window.devicePixelRatio || 1, 2);
    c.width = c.offsetWidth * ratio;
    c.height = c.offsetHeight * ratio;
    const ctx = c.getContext("2d")!;
    ctx.scale(ratio, ratio);
    ctx.lineWidth = 2.4;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.strokeStyle = "#0d2a6b";
  }, []);

  const point = (e: React.PointerEvent) => {
    const r = canvas.current!.getBoundingClientRect();
    return [e.clientX - r.left, e.clientY - r.top] as const;
  };
  const save = () => {
    if (hidden.current) hidden.current.value = canvas.current!.toDataURL("image/png");
  };

  return (
    <div className="grid gap-2">
      <div className="relative">
        <canvas
          ref={canvas}
          aria-label="Zone de signature"
          className="h-[170px] w-full touch-none rounded-xl border-2 border-dashed border-line bg-white"
          onPointerDown={(e) => {
            drawing.current = true;
            canvas.current!.setPointerCapture(e.pointerId);
            const ctx = canvas.current!.getContext("2d")!;
            const [x, y] = point(e);
            ctx.beginPath();
            ctx.moveTo(x, y);
            ctx.lineTo(x + 0.1, y + 0.1);
            ctx.stroke();
            setEmpty(false);
          }}
          onPointerMove={(e) => {
            if (!drawing.current) return;
            const ctx = canvas.current!.getContext("2d")!;
            const [x, y] = point(e);
            ctx.lineTo(x, y);
            ctx.stroke();
          }}
          onPointerUp={() => {
            drawing.current = false;
            save();
          }}
        />
        {empty && (
          <span className="pointer-events-none absolute inset-0 flex items-center justify-center text-[14px] text-zinc-400">
            Signez ici avec le doigt ou la souris
          </span>
        )}
      </div>
      <input ref={hidden} type="hidden" name={name} />
      <div className="flex items-center justify-between">
        {error ? <span className={errorText}>{error}</span> : <span />}
        <button
          type="button"
          onClick={() => {
            const c = canvas.current!;
            c.getContext("2d")!.clearRect(0, 0, c.width, c.height);
            if (hidden.current) hidden.current.value = "";
            setEmpty(true);
          }}
          className="cursor-pointer text-[13px] font-medium text-brand-text underline underline-offset-2"
        >
          Effacer la signature
        </button>
      </div>
    </div>
  );
}

export function LinkyForm({ defaults }: { defaults: Partial<LinkyData> }) {
  const [state, action, pending] = useActionState(submitLinky, null);
  const err = state?.errors ?? {};

  if (state?.ok && state.submissionId) {
    const href = `/documents/formulaires/${state.submissionId}`;
    return (
      <div className="grid justify-items-center gap-4 rounded-2xl border border-line bg-card px-6 py-12 text-center">
        <span className="flex size-14 items-center justify-center rounded-full bg-brand text-white">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.6} strokeLinecap="round" strokeLinejoin="round" className="size-7" aria-hidden>
            <path d="m5 12.5 4.5 4.5L19 7" />
          </svg>
        </span>
        <p role="status" className="max-w-[460px] text-[16px] text-fg">
          {state.message}
        </p>
        <div className="flex flex-wrap justify-center gap-3">
          <a href={`${href}?voir=1`} target="_blank" rel="noreferrer" className="inline-flex h-11 items-center rounded-lg bg-brand px-5 text-[14.5px] font-semibold text-white hover:bg-brand-hover">
            Voir le document signé
          </a>
          <a href={href} className="inline-flex h-11 items-center rounded-lg border border-line bg-card px-5 text-[14.5px] font-semibold text-fg hover:bg-bg-soft">
            Télécharger le PDF
          </a>
        </div>
      </div>
    );
  }

  const field = (key: keyof LinkyData, text: string, props: React.InputHTMLAttributes<HTMLInputElement> = {}, help?: string) => (
    <label className={labelCls}>
      {text}
      <input name={key} defaultValue={defaults[key] ?? ""} className={input} {...props} />
      {help && <span className="text-[12.5px] font-normal text-muted">{help}</span>}
      {err[key] && <span className={errorText}>{err[key]}</span>}
    </label>
  );

  return (
    <form action={action} className="grid gap-8" noValidate>
      <fieldset className="grid gap-3 sm:grid-cols-2">
        <legend className={legend}>1. L’association</legend>
        {field("denomination", "Dénomination de l’association *", { placeholder: "Association cultuelle …" })}
        {field("legalForm", "Forme juridique", { placeholder: "Association loi 1901" })}
        {field("tradeName", "Nom de la mosquée *")}
        {field("siret", "N° SIRET *", { inputMode: "numeric", maxLength: 17, placeholder: "14 chiffres" }, "Sur l’avis de situation INSEE ou annuaire-entreprises.data.gouv.fr.")}
        {field("naf", "Code NAF", { maxLength: 6, placeholder: "9491Z" }, "9491Z : activités des organisations religieuses.")}
        {field("address", "Adresse du siège *")}
        {field("postalCode", "Code postal *", { inputMode: "numeric", maxLength: 5 })}
        {field("city", "Commune *")}
      </fieldset>

      <fieldset className="grid gap-3 sm:grid-cols-2">
        <legend className={legend}>2. Le signataire</legend>
        <div className="flex items-center gap-5 sm:col-span-2">
          {(["M", "Mme"] as const).map((c) => (
            <label key={c} className="flex cursor-pointer items-center gap-2 text-[15px] text-fg">
              <input type="radio" name="signerCivility" value={c} defaultChecked={(defaults.signerCivility ?? "M") === c} className="size-4 accent-brand" />
              {c === "M" ? "M." : "Mme"}
            </label>
          ))}
        </div>
        {field("signerLastName", "Nom *", { autoComplete: "family-name" })}
        {field("signerFirstName", "Prénom *", { autoComplete: "given-name" })}
        {field("contractHolder", "Titulaire du contrat d’électricité", {}, "Laissez vide si c’est l’association elle-même.")}
        {field("phone", "Téléphone", { type: "tel", autoComplete: "tel" })}
        {field("email", "E-mail", { type: "email", autoComplete: "email" })}
      </fieldset>

      <fieldset className="grid gap-3 sm:grid-cols-2">
        <legend className={legend}>3. Le compteur</legend>
        {field(
          "prm",
          "Numéro PRM du compteur",
          { inputMode: "numeric", maxLength: 17, placeholder: "14 chiffres" },
          "Sur la facture d’électricité (« PRM » ou « Point de livraison »), ou sur l’écran du compteur Linky.",
        )}
        {field("siteAddress", "Adresse du compteur", {}, "Si vous n’avez pas le PRM, ou si le compteur n’est pas au siège.")}
      </fieldset>

      <fieldset className="grid gap-3">
        <legend className={legend}>4. Signature</legend>
        <div className="sm:max-w-[360px]">{field("place", "Fait à *", { placeholder: "Ville" })}</div>
        <SignaturePad name="signature" error={err.signature} />
        <label className="flex cursor-pointer items-start gap-3 rounded-lg bg-bg-soft px-4 py-3 text-[14px] leading-relaxed text-fg">
          <input type="checkbox" name="consent" className="mt-1 size-4 flex-none accent-brand" />
          <span>
            Je déclare être dûment habilité(e) à signer pour l’association, et j’autorise SunLib et Masjid Energie à demander et
            recevoir auprès d’Enedis l’historique des mesures, des relevés d’index, de la courbe de charge et les données techniques
            et contractuelles du site, pour la durée de l’étude (12 mois au plus). Autorisation révocable à tout moment.
          </span>
        </label>
        {err.consent && <span className={errorText}>{err.consent}</span>}
      </fieldset>

      {state && !state.ok && (
        <p role="alert" className="rounded-lg bg-red-50 px-4 py-3 text-[14px] font-medium text-red-700 dark:bg-red-400/10 dark:text-red-300">
          {state.message}
        </p>
      )}
      <button
        type="submit"
        disabled={pending}
        className="h-12 cursor-pointer justify-self-start rounded-[10px] bg-[linear-gradient(180deg,#126a52,#0b4f3d)] px-8 text-[15.5px] font-semibold text-white hover:bg-brand-hover hover:bg-none disabled:opacity-60"
      >
        {pending ? "Génération du document signé…" : "Signer et envoyer l’autorisation"}
      </button>
    </form>
  );
}
