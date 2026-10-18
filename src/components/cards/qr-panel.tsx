import { setCardPublished } from "@/app/actions/cards";
import { ConfirmButton, SubmitButton } from "@/components/admin/forms";
import { CopyButton } from "@/components/cards/card-actions";
import { cardPath, type BusinessCard } from "@/lib/cards";
import { cardQrSvgs } from "@/lib/cards-data";

const dl =
  "inline-flex h-8 items-center rounded-md border border-line bg-card px-2.5 text-[12.5px] font-semibold text-fg hover:bg-bg-soft";
const dlOnBrand =
  "inline-flex h-8 items-center rounded-md bg-white/15 px-2.5 text-[12.5px] font-semibold text-white hover:bg-white/25";

const qrBox = "rounded-xl bg-white p-2.5 [&_svg]:h-auto [&_svg]:w-full";

/** Mise en ligne, QR « enregistrer le contact » (principal), installation sur le téléphone. */
export async function QrPanel({ card, canPublish = false }: { card: BusinessCard; canPublish?: boolean }) {
  const { contact, link, url } = await cardQrSvgs(card);
  const base = `${cardPath(card.slug)}/qr`;

  return (
    <div className="grid gap-5">
      {!card.published && (
        <div
          role="alert"
          className="flex flex-wrap items-center justify-between gap-3 rounded-xl border-2 border-gold bg-gold/10 px-4 py-3.5"
        >
          <p className="max-w-[560px] text-[14px] text-fg">
            <strong className="font-bold">Cette carte est hors ligne.</strong> Sa page en ligne et l’ajout à l’écran
            d’accueil ne fonctionnent pas tant qu’elle n’est pas remise en ligne.
          </p>
          {canPublish && (
            <form action={setCardPublished}>
              <input type="hidden" name="id" value={card.id} />
              <input type="hidden" name="published" value="on" />
              <SubmitButton pendingLabel="Mise en ligne…">Remettre la carte en ligne</SubmitButton>
            </form>
          )}
        </div>
      )}

      {card.published && canPublish && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-line bg-bg-soft px-4 py-2.5">
          <p className="flex items-center gap-2 text-[14px] text-fg">
            <span className="size-2.5 rounded-full bg-brand-text" />
            <strong className="font-semibold">Carte en ligne</strong>
            <span className="text-muted">· page, QR codes et écran d’accueil actifs</span>
          </p>
          <form action={setCardPublished}>
            <input type="hidden" name="id" value={card.id} />
            <input type="hidden" name="published" value="off" />
            <ConfirmButton
              message="Mettre la carte hors ligne ? Sa page et son QR « carte en ligne » ne fonctionneront plus."
              className="cursor-pointer text-[13px] font-medium text-muted underline underline-offset-2 hover:text-red-600"
            >
              Mettre hors ligne
            </ConfirmButton>
          </form>
        </div>
      )}

      {/* QR principal : contient la fiche contact elle-même, fonctionne même sans internet. */}
      <section className="grid items-center gap-6 rounded-xl bg-brand px-6 py-6 text-white md:grid-cols-[240px_minmax(0,1fr)]">
        <div className={`${qrBox} mx-auto w-[240px]`} dangerouslySetInnerHTML={{ __html: contact }} />
        <div className="grid gap-3">
          <span className="text-[11.5px] font-semibold tracking-[0.2em] text-gold">QR CODE À FAIRE SCANNER</span>
          <h3 className="text-[19px] font-extrabold leading-tight">Le contact s’enregistre dans le téléphone</h3>
          <ol className="grid list-decimal gap-1 pl-5 text-[14px] leading-snug text-on-brand">
            <li>La personne ouvre l’appareil photo de son iPhone ou de son Android et vise ce code.</li>
            <li>
              Elle touche la bannière qui apparaît : <strong className="text-white">« Ajouter aux contacts »</strong> (ou
              « Nouveau contact »).
            </li>
            <li>Nom, organisation, fonction, téléphone et e-mail sont remplis automatiquement.</li>
          </ol>
          <p className="text-[12.5px] text-on-brand/80">
            À imprimer sur vos cartes papier, flyers, kakémonos, ou à montrer sur votre téléphone.
          </p>
          <div className="flex flex-wrap gap-2">
            <a href={`${base}?type=contact&format=png&dl=1`} className={dlOnBrand}>
              Télécharger en PNG
            </a>
            <a href={`${base}?type=contact&format=svg&dl=1`} className={dlOnBrand}>
              SVG pour l’imprimeur
            </a>
          </div>
        </div>
      </section>

      <section className="grid items-center gap-5 rounded-xl border border-line px-5 py-5 md:grid-cols-[150px_minmax(0,1fr)]">
        <div className={`${qrBox} mx-auto w-[150px] border border-line`} dangerouslySetInnerHTML={{ __html: link }} />
        <div className="grid gap-2">
          <h3 className="text-[15px] font-bold text-heading">Carte en ligne et écran d’accueil</h3>
          <p className="text-[13.5px] leading-snug text-muted">
            Ce code-ci ouvre la page de la carte (appeler, e-mail, itinéraire, enregistrer). Pour avoir votre carte comme
            une application : scannez-le avec votre téléphone, puis{" "}
            <strong className="text-fg">Android</strong> : « Ajouter à l’écran d’accueil » en bas de la carte ·{" "}
            <strong className="text-fg">iPhone</strong> (Safari) : Partager → « Sur l’écran d’accueil ».
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <span className="min-w-0 max-w-full truncate rounded-md bg-bg-soft px-2.5 py-1.5 text-[12.5px] font-medium text-fg">
              {url}
            </span>
            <CopyButton value={url} />
            <a href={cardPath(card.slug)} target="_blank" rel="noreferrer" className={dl}>
              Ouvrir
            </a>
            <a href={`${base}?type=lien&format=png&dl=1`} className={dl}>
              QR en PNG
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
