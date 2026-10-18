import { setCardPublished } from "@/app/actions/cards";
import { SubmitButton } from "@/components/admin/forms";
import { CopyButton } from "@/components/cards/card-actions";
import { cardPath, type BusinessCard } from "@/lib/cards";
import { cardQrSvgs } from "@/lib/cards-data";

const dl =
  "inline-flex h-8 items-center rounded-md border border-line bg-card px-2.5 text-[12.5px] font-semibold text-fg hover:bg-bg-soft";

const qrBox = "mx-auto rounded-lg bg-white p-2 [&_svg]:h-auto [&_svg]:w-full";

/** Mise en ligne, installation sur le téléphone et QR codes d'une carte. */
export async function QrPanel({ card, canPublish = false }: { card: BusinessCard; canPublish?: boolean }) {
  const { contact, link, url } = await cardQrSvgs(card);
  const base = `${cardPath(card.slug)}/qr`;
  const blocks = [
    {
      type: "contact",
      svg: contact,
      title: "QR « contact direct »",
      text: "Scanné avec l’appareil photo, il propose aussitôt d’enregistrer le contact (iPhone et Android), même sans internet.",
    },
    {
      type: "lien",
      svg: link,
      title: "QR « carte en ligne »",
      text: "Ouvre la carte numérique : appeler, e-mail, itinéraire, enregistrer le contact, ajouter à l’écran d’accueil.",
    },
  ];

  return (
    <div className="grid gap-5">
      {!card.published && (
        <div
          role="alert"
          className="flex flex-wrap items-center justify-between gap-3 rounded-xl border-2 border-gold bg-gold/10 px-4 py-3.5"
        >
          <p className="max-w-[560px] text-[14px] text-fg">
            <strong className="font-bold">Cette carte est hors ligne.</strong> Sa page, ses QR codes et l’ajout à l’écran
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

      <div className="flex flex-wrap items-center gap-2 rounded-lg bg-bg-soft px-3.5 py-2.5 text-[13.5px]">
        <span className="min-w-0 flex-1 truncate font-medium text-fg">{url}</span>
        <CopyButton value={url} />
        <a href={cardPath(card.slug)} target="_blank" rel="noreferrer" className={dl}>
          Ouvrir
        </a>
      </div>

      <section className="grid items-center gap-5 rounded-xl bg-brand px-5 py-5 text-white sm:grid-cols-[150px_minmax(0,1fr)]">
        <div className={`${qrBox} w-[150px]`} dangerouslySetInnerHTML={{ __html: link }} />
        <div className="grid gap-2">
          <h3 className="text-[16px] font-bold">Installer la carte sur votre téléphone</h3>
          <ol className="grid list-decimal gap-1 pl-5 text-[13.5px] leading-snug text-on-brand">
            <li>Scannez ce code avec l’appareil photo de votre téléphone et ouvrez le lien.</li>
            <li>
              <strong className="text-white">Android</strong> : touchez « Ajouter à l’écran d’accueil » en bas de la carte.
            </li>
            <li>
              <strong className="text-white">iPhone</strong> (dans Safari) : bouton Partager, puis « Sur l’écran d’accueil ».
            </li>
          </ol>
          <p className="text-[12.5px] text-on-brand/80">
            La carte s’ouvre ensuite comme une application, prête à être montrée ou partagée.
          </p>
        </div>
      </section>

      <div className="grid gap-4 sm:grid-cols-2">
        {blocks.map((b) => (
          <div key={b.type} className="grid content-start gap-3 rounded-xl border border-line p-4">
            <div className={`${qrBox} w-[180px]`} dangerouslySetInnerHTML={{ __html: b.svg }} />
            <h3 className="text-[14px] font-bold text-heading">{b.title}</h3>
            <p className="text-[13px] leading-snug text-muted">{b.text}</p>
            <div className="flex flex-wrap gap-2">
              <a href={`${base}?type=${b.type}&format=png&dl=1`} className={dl}>
                PNG (impression)
              </a>
              <a href={`${base}?type=${b.type}&format=svg&dl=1`} className={dl}>
                SVG (imprimeur)
              </a>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
