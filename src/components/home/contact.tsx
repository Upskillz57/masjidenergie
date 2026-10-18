import { ArrowRight, Phone, WhatsApp } from "@/components/icons";
import { site, telLink, whatsappLink } from "@/lib/site";

const iconButton =
  "flex h-10 flex-1 items-center justify-center gap-2 rounded-lg px-3 text-[13.5px] font-semibold transition-colors";

export function Contact() {
  return (
    <section id="contact" className="bg-brand text-white">
      <div className="mx-auto grid max-w-[1536px] items-center gap-x-12 gap-y-8 px-[clamp(20px,4.7vw,72px)] py-14 xl:grid-cols-[minmax(0,420px)_minmax(0,1fr)]">
        <div className="grid gap-3">
          <span className="text-[13px] font-semibold tracking-[0.26em] text-gold">CONTACT</span>
          <h2 className="text-[clamp(28px,2.6vw,38px)] font-extrabold leading-[1.08] tracking-[-0.02em]">
            Demandez votre étude gratuite.
          </h2>
          <p className="text-base leading-normal text-on-brand">
            Appelez-nous ou écrivez-nous sur WhatsApp, ou par e-mail à{" "}
            <a href={`mailto:${site.contact.email}`} className="font-semibold text-gold hover:underline">
              {site.contact.email}
            </a>
            .
          </p>
          <a
            href="#etude"
            className="mt-2 flex h-[55px] items-center justify-center gap-5 justify-self-start rounded-[10px] bg-[linear-gradient(180deg,#d6a94e,#b08431)] px-7 text-base font-bold text-brand-deep hover:brightness-105"
          >
            Demander une étude <ArrowRight className="size-[17px]" />
          </a>
        </div>

        <ul className="grid gap-3.5 sm:grid-cols-2">
          {site.team.map((c) => (
            <li key={c.name} className="grid gap-3 rounded-xl border border-white/15 bg-white/[0.06] px-5 py-4">
              <span className="grid gap-0.5">
                <span className="text-[17px] font-bold">{c.name}</span>
                <span className="text-[13.5px] font-medium text-gold">{c.role}</span>
              </span>
              <div className="flex flex-wrap gap-2.5">
                {c.phone && (
                  <a
                    href={telLink(c.phone)}
                    aria-label={`Appeler ${c.name} au ${c.phone}`}
                    className={`${iconButton} bg-white text-brand hover:bg-[#f3efe6]`}
                  >
                    <Phone className="size-[17px] flex-none" />
                    <span className="whitespace-nowrap">{c.phone}</span>
                  </a>
                )}
                {c.whatsapp && (
                  <a
                    href={whatsappLink(c.whatsapp)}
                    target="_blank"
                    rel="noreferrer"
                    aria-label={`Écrire à ${c.name} sur WhatsApp au ${c.whatsapp}`}
                    className={`${iconButton} bg-[#25d366] text-[#073b20] hover:bg-[#2ee072]`}
                  >
                    <WhatsApp className="size-[18px] flex-none" />
                    <span className="whitespace-nowrap">{c.phone === c.whatsapp ? "WhatsApp" : c.whatsapp}</span>
                  </a>
                )}
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
