import type { ReactNode } from "react";

export function Verse({
  children,
  reference,
  align = "center",
  className = "",
}: {
  children: ReactNode;
  reference: string;
  align?: "center" | "start";
  className?: string;
}) {
  const centered = align === "center";
  return (
    <figure className={`grid gap-2 ${centered ? "justify-items-center text-center" : ""} ${className}`}>
      {centered && (
        <span aria-hidden className="flex items-center gap-2">
          <span className="h-px w-10 bg-gold/60" />
          <span className="size-1.5 rotate-45 bg-gold" />
          <span className="h-px w-10 bg-gold/60" />
        </span>
      )}
      <blockquote className="max-w-[720px] text-[clamp(15px,1.15vw,17px)] italic leading-[1.5] text-fg">
        « {children} »
      </blockquote>
      <figcaption className="text-[12.5px] font-semibold tracking-[0.12em] text-gold-dark">
        Coran {reference}
      </figcaption>
    </figure>
  );
}
