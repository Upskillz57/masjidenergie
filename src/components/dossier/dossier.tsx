import { saveProjectContext } from "@/app/actions/dossier";
import { SubmitButton } from "@/components/admin/forms";
import { Icon, inputClass } from "@/components/dashboard/ui";
import { MOTIVATIONS, type DossierPiece } from "@/lib/dossier";

export function DossierChecklist({ pieces }: { pieces: DossierPiece[] }) {
  return (
    <ul className="grid gap-3">
      {pieces.map((p) => (
        <li key={p.key} className="flex items-start gap-3">
          <span
            className={`flex size-6 flex-none items-center justify-center rounded-full ${
              p.done ? "bg-brand-text text-white dark:text-brand-deep" : "border-2 border-line text-muted"
            }`}
          >
            {p.done && <Icon name="check" className="size-3.5" />}
          </span>
          <span className="grid gap-0.5">
            <span className="text-[14.5px] font-semibold text-heading">
              {p.label}
              {p.detail && <span className="ml-2 font-normal text-muted">{p.detail}</span>}
              {p.optional && <span className="ml-2 font-normal text-muted">si possible</span>}
            </span>
            <span className="text-[13px] text-muted">{p.why}</span>
          </span>
        </li>
      ))}
    </ul>
  );
}

export function ProjectContextForm({
  requestId,
  motivations,
  context,
}: {
  requestId: string;
  motivations: string[];
  context: string | null;
}) {
  return (
    <form action={saveProjectContext} className="grid gap-3">
      <input type="hidden" name="id" value={requestId} />
      <span className="text-[13px] font-semibold text-fg">Contexte du projet et motivation</span>
      <div className="grid gap-2 sm:grid-cols-2">
        {Object.entries(MOTIVATIONS).map(([value, text]) => (
          <label key={value} className="flex cursor-pointer items-start gap-2.5 rounded-lg border border-line px-3 py-2.5 text-[13.5px] text-fg has-checked:border-brand-text has-checked:bg-brand/5">
            <input type="checkbox" name="motivations" value={value} defaultChecked={motivations.includes(value)} className="mt-0.5 size-4 flex-none accent-brand" />
            {text}
          </label>
        ))}
      </div>
      <textarea
        name="context"
        rows={3}
        maxLength={2000}
        defaultValue={context ?? ""}
        aria-label="Contexte du projet"
        placeholder="Travaux prévus, échéances, décision du bureau…"
        className={`${inputClass} h-auto py-2.5`}
      />
      <div className="flex justify-end">
        <SubmitButton pendingLabel="Enregistrement…">Enregistrer</SubmitButton>
      </div>
    </form>
  );
}
