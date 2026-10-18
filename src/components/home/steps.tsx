import { ChevronRight, stepIconPaths } from "@/components/icons";

const steps = [
  ["1. Audit énergétique", "Analyse de vos besoins et du potentiel solaire"],
  ["2. Étude de faisabilité", "Dimensionnement et projection des économies"],
  ["3. Financement", "Sans crédit, sans emprunt, sans endettement"],
  ["4. Installation par nos partenaires", "Professionnels certifiés"],
  ["5. Suivi et maintenance", "Un accompagnement dans la durée"],
];

export function Steps() {
  return (
    <section id="accompagnement" className="bg-[linear-gradient(180deg,var(--bg),var(--bg-soft))]">
      <div className="mx-auto grid max-w-[1536px] gap-[26px] px-[clamp(20px,8.3vw,128px)] py-[34px]">
        <div className="grid justify-items-center gap-1 text-center">
          <h2 className="text-2xl font-bold tracking-[-0.01em] text-fg">Notre accompagnement</h2>
          <p className="text-[17px] text-muted">Une solution complète pour des projets sereins</p>
        </div>
        <ol className="grid grid-cols-1 gap-y-6 min-[560px]:grid-cols-3 min-[1100px]:grid-cols-5">
          {steps.map(([title, text], i) => (
            <li key={title} className="flex items-start gap-2 pr-3">
              <div className="grid flex-1 gap-3">
                <span className="ml-1 flex size-[60px] items-center justify-center rounded-full border border-line bg-card text-brand-text shadow-[0_4px_16px_#00000014]">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.9} strokeLinecap="round" strokeLinejoin="round" className="size-7" aria-hidden>
                    <path d={stepIconPaths[i]} />
                  </svg>
                </span>
                <div>
                  <h3 className="text-[15px] font-bold leading-[1.25] text-fg">{title}</h3>
                  <p className="mt-1.5 pl-4 text-[13.5px] leading-[1.45] text-muted">{text}</p>
                </div>
              </div>
              {i < steps.length - 1 && (
                <ChevronRight className="mt-[68px] hidden size-4 flex-none text-muted min-[1100px]:block" />
              )}
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
