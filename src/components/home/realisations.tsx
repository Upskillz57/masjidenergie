import { Photo } from "@/components/icons";

// Photos à fournir : remplacer chaque emplacement par un <Image fill className="object-cover" />.
const slots = [1, 2, 3];

export function Realisations() {
  return (
    <section id="realisations" className="bg-bg-soft">
      <div className="mx-auto grid max-w-[1536px] gap-6 px-[clamp(20px,4.7vw,72px)] py-14">
        <div className="grid gap-2.5">
          <span className="text-[13px] font-semibold tracking-[0.26em] text-gold">NOS RÉALISATIONS</span>
          <h2 className="text-[clamp(26px,2.1vw,32px)] font-extrabold tracking-[-0.02em] text-heading">
            Des mosquées déjà engagées
          </h2>
        </div>
        <ul className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,280px),1fr))] gap-3.5">
          {slots.map((n) => (
            <li
              key={n}
              className="flex h-[260px] flex-col items-center justify-center gap-2 rounded-[10px] bg-placeholder text-muted"
            >
              <Photo strokeWidth={1.5} className="size-8 opacity-60" />
              <span className="text-sm">Photo de réalisation à venir</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
