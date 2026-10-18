import { CopyButton } from "@/components/cards/card-actions";
import { cardPath, type BusinessCard } from "@/lib/cards";
import { cardQrSvgs } from "@/lib/cards-data";

const dl =
  "inline-flex h-8 items-center rounded-md border border-line bg-card px-2.5 text-[12.5px] font-semibold text-fg hover:bg-bg-soft";

/** Les deux QR codes d'une carte, prêts à afficher, partager ou imprimer. */
export async function QrPanel({ card }: { card: BusinessCard }) {
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
      text: "Ouvre la carte numérique : boutons appeler, e-mail, itinéraire, enregistrer et installer sur l’écran d’accueil.",
    },
  ];

  return (
    <div className="grid gap-5">
      <div className="flex flex-wrap items-center gap-2 rounded-lg bg-bg-soft px-3.5 py-2.5 text-[13.5px]">
        <span className="min-w-0 flex-1 truncate font-medium text-fg">{url}</span>
        <CopyButton value={url} />
        <a href={cardPath(card.slug)} target="_blank" rel="noreferrer" className={dl}>
          Ouvrir
        </a>
      </div>
      {!card.published && (
        <p className="rounded-lg bg-gold/10 px-3.5 py-2.5 text-[13.5px] text-fg">
          Cette carte est hors ligne : les QR codes ne fonctionneront qu’une fois la carte remise en ligne.
        </p>
      )}
      <div className="grid gap-4 sm:grid-cols-2">
        {blocks.map((b) => (
          <div key={b.type} className="grid content-start gap-3 rounded-xl border border-line p-4">
            <div className="mx-auto w-[180px] rounded-lg bg-white p-2 [&_svg]:h-auto [&_svg]:w-full" dangerouslySetInnerHTML={{ __html: b.svg }} />
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
