import type { ReactNode } from "react";
import { Verse } from "@/components/verse";
import { Heart, Leaf, People, Sprout } from "@/components/icons";

const benefits: { icon: ReactNode; title: string; text: string }[] = [
  {
    icon: <Leaf strokeWidth={1.6} className="size-[30px]" />,
    title: "Réduisez vos coûts",
    text: "Une économie immédiate dès l’installation, sans crédit ni endettement.",
  },
  {
    icon: <Sprout strokeWidth={1.6} className="size-[30px]" />,
    title: "Valorisez vos bâtiments",
    text: "Une solution qui augmente la valeur de votre patrimoine.",
  },
  {
    icon: <People strokeWidth={1.6} className="h-[30px] w-9" />,
    title: "Agissez pour la planète",
    text: "Une énergie propre pour les générations futures.",
  },
  {
    icon: <Heart strokeWidth={1.6} className="size-[30px]" />,
    title: "Un engagement positif",
    text: "Montrez l’exemple au sein de votre communauté.",
  },
];

export function Why() {
  return (
    <section id="pourquoi" className="bg-bg">
      <div className="mx-auto grid max-w-[1536px] items-center gap-7 px-[clamp(20px,4.7vw,72px)] pb-10 pt-4 xl:grid-cols-[minmax(320px,460px)_1fr]">
        <div className="grid gap-3">
          <span className="text-[13px] font-semibold tracking-[0.26em] text-gold">
            POURQUOI MASJID ENERGIE ?
          </span>
          <h2 className="text-[clamp(26px,2.1vw,32px)] font-extrabold leading-[1.05] tracking-[-0.02em] text-heading">
            <span className="text-brand-text">Des mosquées</span> plus autonomes,
            <br />
            plus durables, plus sereines
          </h2>
          <Verse reference="14:33-34" align="start" className="mt-2 border-l-2 border-gold pl-4">
            Et Il a assujetti pour vous le soleil et la lune, évoluant tous deux régulièrement ; et Il
            a assujetti pour vous la nuit et le jour. Et Il vous a accordé de tout ce que vous Lui
            avez demandé.
          </Verse>
        </div>
        <ul className="grid gap-3.5 sm:grid-cols-2 2xl:grid-cols-4">
          {benefits.map((b, i) =>
            i === 0 ? (
              <li
                key={b.title}
                className="flex items-start gap-3.5 rounded-lg bg-brand px-5 py-[22px] text-white shadow-[0_8px_20px_#0e5c4730]"
              >
                <span className="flex-none text-accent">{b.icon}</span>
                <div>
                  <h3 className="text-sm font-semibold">{b.title}</h3>
                  <p className="mt-2.5 text-xs leading-[1.45] text-on-brand">{b.text}</p>
                </div>
              </li>
            ) : (
              <li
                key={b.title}
                className="flex items-start gap-3 rounded-lg border border-line bg-card px-4 py-[22px] shadow-[0_4px_14px_#0000000a]"
              >
                <span className="flex-none text-brand-text">{b.icon}</span>
                <div>
                  <h3 className="text-sm font-semibold text-heading">{b.title}</h3>
                  <p className="mt-2.5 text-xs leading-[1.45] text-muted">{b.text}</p>
                </div>
              </li>
            ),
          )}
        </ul>
      </div>
    </section>
  );
}
