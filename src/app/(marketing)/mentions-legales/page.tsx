import type { Metadata } from "next";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "Mentions légales",
};

// Les champs entre crochets sont à compléter avec les informations légales de YGB Développement.
export default function MentionsLegalesPage() {
  return (
    <div className="bg-bg-soft pt-[90px]">
      <article className="mx-auto max-w-3xl px-5 py-14 text-[15.5px] leading-relaxed text-muted [&_h2]:mb-2 [&_h2]:mt-10 [&_h2]:text-xl [&_h2]:font-bold [&_h2]:text-heading">
        <h1 className="text-[clamp(28px,3vw,40px)] font-extrabold tracking-[-0.02em] text-heading">
          Mentions légales
        </h1>

        <h2>Éditeur du site</h2>
        <p>
          {site.company} — [forme juridique] au capital de [montant] €<br />
          Siège social : [adresse]
          <br />
          SIRET : [numéro] · RCS [ville]
          <br />
          TVA intracommunautaire : [numéro]
          <br />
          Contact : <a href={`mailto:${site.contact.email}`} className="text-brand-text underline">{site.contact.email}</a> ·{" "}
          <a href={site.contact.phoneHref} className="text-brand-text underline">{site.contact.phone}</a>
        </p>

        <h2>Directeur de la publication</h2>
        <p>[Nom du directeur de la publication]</p>

        <h2>Hébergement</h2>
        <p>
          Vercel Inc. — 440 N Barranca Ave #4133, Covina, CA 91723, États-Unis — vercel.com
        </p>

        <h2>Propriété intellectuelle</h2>
        <p>
          L’ensemble des contenus de ce site (textes, logos, visuels) est la propriété de {site.company},
          sauf mention contraire. Toute reproduction sans autorisation est interdite.
        </p>

        <h2>Crédits</h2>
        <p>
          Photo d’accueil :{" "}
          <a href="https://unsplash.com/@skinnyjon" className="text-brand-text underline" rel="noopener noreferrer" target="_blank">
            Jonathan Takle
          </a>{" "}
          sur Unsplash.
        </p>

        <h2>Données personnelles</h2>
        <p>
          Les informations transmises par téléphone ou par e-mail sont utilisées uniquement pour répondre
          à votre demande. Conformément au RGPD, vous pouvez exercer vos droits d’accès, de rectification
          et de suppression en écrivant à {site.contact.email}.
        </p>
      </article>
    </div>
  );
}
