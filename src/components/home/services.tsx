import type { ReactNode } from "react";
import { ArrowRight, PlugZap, Thermometer } from "@/components/icons";

const services: { icon: ReactNode; title: string; text: string }[] = [
  {
    icon: <PlugZap strokeWidth={1.6} className="size-[38px]" />,
    title: "Bornes de recharge",
    text: "Fidèles et riverains rechargent leur véhicule sur le parking de la mosquée : chaque recharge payante peut lui rapporter un revenu.",
  },
  {
    icon: <Thermometer strokeWidth={1.6} className="size-[38px]" />,
    title: "Pompes à chaleur",
    text: "Un chauffage performant qui allège la facture : l’argent qui n’est plus dépensé reste disponible pour la vie de la mosquée.",
  },
];

export function Services() {
  return (
    <section id="services" className="scroll-mt-[90px] bg-[linear-gradient(180deg,#0a3c2c,#083024)] text-white">
      <div className="mx-auto grid max-w-[1536px] gap-8 px-[clamp(20px,4.7vw,72px)] py-14">
        <div className="grid max-w-[900px] gap-3">
          <span className="text-[13px] font-semibold tracking-[0.26em] text-gold">NOUS INSTALLONS AUSSI</span>
          <h2 className="text-[clamp(30px,3.4vw,50px)] font-extrabold leading-[1.05] tracking-[-0.02em]">
            Pompes à chaleur et bornes de recharge&nbsp;:{" "}
            <span className="text-gold">une source de revenus</span> pour les mosquées
          </h2>
        </div>
        <ul className="grid gap-4 md:grid-cols-2">
          {services.map((s) => (
            <li key={s.title} className="flex items-start gap-5 rounded-xl bg-white/[0.07] p-6 ring-1 ring-white/15">
              <span className="flex-none text-gold">{s.icon}</span>
              <div>
                <h3 className="text-[clamp(20px,1.7vw,25px)] font-bold leading-[1.2]">{s.title}</h3>
                <p className="mt-2 text-[15.5px] leading-[1.5] text-on-brand">{s.text}</p>
              </div>
            </li>
          ))}
        </ul>
        <a
          href="#etude"
          className="flex h-[55px] items-center gap-5 justify-self-start rounded-[10px] bg-[linear-gradient(180deg,#d6a94e,#b08431)] px-7 text-base font-semibold text-brand-deep shadow-[0_10px_24px_#00000040] hover:brightness-105"
        >
          Demander une étude gratuite <ArrowRight className="size-[17px]" />
        </a>
      </div>
    </section>
  );
}
