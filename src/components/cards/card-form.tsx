"use client";

import { useActionState, useState } from "react";
import { saveCard, saveMosqueCard } from "@/app/actions/cards";
import { CardFace } from "@/components/cards/card-face";
import { BRAND_META, CARD_BRANDS, slugify, type CardBrand, type CardFields } from "@/lib/cards";

const input =
  "h-10 w-full rounded-lg border border-line bg-bg px-3 text-[14px] text-fg outline-none placeholder:text-muted focus:border-brand-text focus:ring-2 focus:ring-brand-text/20";
const label = "grid gap-1.5 text-[13px] font-semibold text-fg";
const errorText = "text-[12.5px] font-medium text-red-600 dark:text-red-400";

type Initial = CardFields & { id?: string; slug?: string };

export function CardForm({ initial, mode }: { initial: Initial; mode: "staff" | "mosque" }) {
  const [state, action, pending] = useActionState(mode === "staff" ? saveCard : saveMosqueCard, null);
  const [card, setCard] = useState<CardFields>(initial);
  const [slug, setSlug] = useState(initial.slug ?? "");
  const err = state?.errors ?? {};

  const set = (key: keyof CardFields) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setCard((c) => ({ ...c, [key]: e.target.value }));

  function pickBrand(brand: CardBrand) {
    setCard((c) => {
      const keepOrg = c.organization && c.organization !== BRAND_META[c.brand].organization;
      const keepSite = c.website && c.website !== BRAND_META[c.brand].website;
      return {
        ...c,
        brand,
        organization: keepOrg ? c.organization : BRAND_META[brand].organization,
        website: keepSite ? c.website : BRAND_META[brand].website || null,
      };
    });
  }

  const field = (key: keyof CardFields, text: string, props: React.InputHTMLAttributes<HTMLInputElement> = {}) => (
    <label className={label}>
      {text}
      <input name={key} value={(card[key] as string | null) ?? ""} onChange={set(key)} className={input} {...props} />
    </label>
  );

  return (
    <form action={action} className="grid items-start gap-8 xl:grid-cols-[minmax(0,1fr)_420px]">
      {initial.id && <input type="hidden" name="id" value={initial.id} />}
      <input type="hidden" name="brand" value={card.brand} />

      <div className="grid gap-6">
        {mode === "staff" && (
          <fieldset className="grid gap-2">
            <legend className="mb-1 text-[14px] font-bold text-heading">Modèle de carte</legend>
            <div className="grid gap-2 sm:grid-cols-3">
              {CARD_BRANDS.filter((b) => b !== "ygb" || initial.brand === "ygb").map((b) => (
                <button
                  key={b}
                  type="button"
                  onClick={() => pickBrand(b)}
                  aria-pressed={card.brand === b}
                  className={`flex cursor-pointer items-center gap-3 rounded-xl border-2 px-3 py-2.5 text-left text-[14px] font-semibold ${
                    card.brand === b
                      ? "border-brand-text bg-brand/5 text-heading"
                      : "border-line bg-card text-fg hover:border-brand-text/40"
                  }`}
                >
                  <span className={`size-7 flex-none rounded-md ${BRAND_META[b].theme}`} />
                  {b === "mosquee" ? "Mosquée" : BRAND_META[b].label}
                </button>
              ))}
            </div>
          </fieldset>
        )}

        <fieldset className="grid gap-3 sm:grid-cols-2">
          <legend className="mb-1 text-[14px] font-bold text-heading">Identité</legend>
          <div className="grid gap-1.5">
            {field("full_name", card.brand === "mosquee" ? "Nom affiché (mosquée)" : "Prénom et nom", {
              required: true,
              maxLength: 100,
            })}
            {err.full_name && <span className={errorText}>{err.full_name}</span>}
          </div>
          {field("job_title", card.brand === "mosquee" ? "Sous-titre (facultatif)" : "Fonction", {
            placeholder: card.brand === "mosquee" ? "Association cultuelle, centre culturel…" : "Chargé de projets solaires…",
            maxLength: 100,
          })}
          <div className="grid gap-1.5 sm:col-span-2">
            {field("organization", "Organisation", { required: true, maxLength: 100 })}
            {err.organization && <span className={errorText}>{err.organization}</span>}
          </div>
        </fieldset>

        <fieldset className="grid gap-3 sm:grid-cols-2">
          <legend className="mb-1 text-[14px] font-bold text-heading">Coordonnées</legend>
          {field("mobile", "Mobile", { type: "tel", autoComplete: "tel", maxLength: 30 })}
          {field("phone", "Téléphone fixe", { type: "tel", maxLength: 30 })}
          <div className="grid gap-1.5">
            {field("email", "E-mail", { type: "email", maxLength: 120 })}
            {err.email && <span className={errorText}>{err.email}</span>}
          </div>
          <div className="grid gap-1.5">
            {field("website", "Site internet", { placeholder: "masjidenergie.fr", maxLength: 200 })}
            {err.website && <span className={errorText}>{err.website}</span>}
          </div>
          <div className="sm:col-span-2">{field("address", "Adresse", { maxLength: 200 })}</div>
          {err.contact && <span className={`${errorText} sm:col-span-2`}>{err.contact}</span>}
          <label className={`${label} sm:col-span-2`}>
            Phrase d’accroche (facultatif)
            <textarea
              name="note"
              rows={2}
              maxLength={300}
              value={card.note ?? ""}
              onChange={set("note")}
              className={`${input} h-auto py-2`}
            />
          </label>
        </fieldset>

        {mode === "staff" && (
          <fieldset className="grid gap-3 sm:max-w-[420px]">
            <legend className="mb-1 text-[14px] font-bold text-heading">Adresse de la carte</legend>
            <label className={label}>
              Adresse de la carte
              <span className="flex items-center rounded-lg border border-line bg-bg text-[14px] focus-within:border-brand-text focus-within:ring-2 focus-within:ring-brand-text/20">
                <span className="pl-3 text-muted">/carte/</span>
                <input
                  name="slug"
                  value={slug}
                  onChange={(e) => setSlug(slugify(e.target.value))}
                  placeholder={slugify(card.full_name) || "prenom-nom"}
                  maxLength={60}
                  className="h-10 min-w-0 flex-1 bg-transparent pr-3 text-fg outline-none"
                />
              </span>
            </label>
          </fieldset>
        )}

        {state && (
          <p
            role={state.ok ? "status" : "alert"}
            className={`rounded-lg px-3.5 py-2.5 text-[14px] font-medium ${
              state.ok ? "bg-brand/10 text-brand-text" : "bg-red-50 text-red-700 dark:bg-red-400/10 dark:text-red-300"
            }`}
          >
            {state.message}
          </p>
        )}
        <button
          type="submit"
          disabled={pending}
          className="h-11 cursor-pointer justify-self-start rounded-lg bg-brand px-6 text-[14.5px] font-semibold text-white hover:bg-brand-hover disabled:opacity-60"
        >
          {pending ? "Enregistrement…" : initial.id ? "Enregistrer la carte" : "Créer la carte"}
        </button>
      </div>

      <div className="grid gap-3 xl:sticky xl:top-6">
        <span className="text-[12px] font-semibold uppercase tracking-[0.1em] text-muted">Aperçu</span>
        <CardFace card={card} compact />
      </div>
    </form>
  );
}
