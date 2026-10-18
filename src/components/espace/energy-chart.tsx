import type { EnergyMonth } from "@/lib/espace/data";

const nf = new Intl.NumberFormat("fr-FR");
const compact = (n: number) => (n >= 1000 ? `${nf.format(n / 1000)}k` : nf.format(n));

/** Colonnes empilées réseau + solaire par mois, avec infobulle au survol / au focus et tableau équivalent. */
export function EnergyChart({ months, height = 240 }: { months: EnergyMonth[]; height?: number }) {
  const top = Math.max(...months.map((m) => m.solar + m.grid));
  const step = top > 6000 ? 2000 : 1000;
  const max = Math.ceil(top / step) * step;
  const ticks = Array.from({ length: max / step + 1 }, (_, i) => i * step);

  return (
    <figure className="grid gap-4">
      <div className="flex flex-wrap items-center gap-x-5 gap-y-1 text-[13px] text-muted">
        <span className="flex items-center gap-2">
          <span className="size-3 rounded-[3px] bg-chart-solar" /> Énergie solaire autoconsommée
        </span>
        <span className="flex items-center gap-2">
          <span className="size-3 rounded-[3px] bg-chart-grid" /> Électricité achetée au réseau
        </span>
      </div>

      <div className="relative" style={{ height }}>
        {ticks.map((t) => (
          <div
            key={t}
            className="absolute inset-x-0 flex items-center gap-2"
            style={{ bottom: `${(t / max) * 100}%`, transform: "translateY(50%)" }}
          >
            <span className="w-9 text-right text-[11.5px] tabular-nums text-muted">{compact(t)}</span>
            <span className="h-px flex-1 bg-line" />
          </div>
        ))}

        <ul className="absolute inset-y-0 left-11 right-0 flex items-end">
          {months.map((m) => {
            const total = m.solar + m.grid;
            return (
              <li
                key={m.key}
                tabIndex={0}
                aria-label={`${m.label} : ${nf.format(total)} kWh, dont ${nf.format(m.solar)} kWh solaires`}
                className="group relative flex h-full flex-1 cursor-default flex-col items-center justify-end outline-none"
              >
                <span className="absolute inset-x-0.5 inset-y-0 rounded-md group-hover:bg-brand/5 group-focus-visible:bg-brand/5 group-focus-visible:ring-2 group-focus-visible:ring-brand-text/40" />
                <span
                  className="relative flex w-[min(24px,60%)] flex-col justify-end gap-[2px]"
                  style={{ height: `${(total / max) * 100}%` }}
                >
                  {m.solar > 0 && (
                    <span className="rounded-t-[4px] bg-chart-solar" style={{ height: `${(m.solar / total) * 100}%` }} />
                  )}
                  <span
                    className={`bg-chart-grid ${m.solar > 0 ? "" : "rounded-t-[4px]"}`}
                    style={{ height: `${(m.grid / total) * 100}%` }}
                  />
                </span>
                <span
                  role="tooltip"
                  className="pointer-events-none absolute z-10 hidden w-max min-w-[180px] rounded-lg border border-line bg-card px-3 py-2.5 text-left text-[12.5px] shadow-[0_10px_30px_#00000026] group-hover:block group-focus-visible:block"
                  style={{ bottom: `calc(${(total / max) * 100}% + 10px)` }}
                >
                  <span className="mb-1 block font-semibold text-heading">{m.label}</span>
                  <span className="flex items-center justify-between gap-4 text-fg">
                    <span className="flex items-center gap-1.5">
                      <span className="size-2.5 rounded-[2px] bg-chart-solar" /> Solaire
                    </span>
                    <span className="tabular-nums">{nf.format(m.solar)} kWh</span>
                  </span>
                  <span className="flex items-center justify-between gap-4 text-fg">
                    <span className="flex items-center gap-1.5">
                      <span className="size-2.5 rounded-[2px] bg-chart-grid" /> Réseau
                    </span>
                    <span className="tabular-nums">{nf.format(m.grid)} kWh</span>
                  </span>
                  <span className="mt-1 flex justify-between gap-4 border-t border-line pt-1 font-semibold text-heading">
                    Total <span className="tabular-nums">{nf.format(total)} kWh</span>
                  </span>
                </span>
              </li>
            );
          })}
        </ul>
      </div>
      <ul className="-mt-2 ml-11 flex text-center text-[11.5px] capitalize text-muted" aria-hidden>
        {months.map((m) => (
          <li key={m.key} className="flex-1">
            {m.short}
          </li>
        ))}
      </ul>

      <details className="text-[13.5px]">
        <summary className="cursor-pointer font-medium text-brand-text">Voir les valeurs en tableau</summary>
        <div className="mt-3 overflow-x-auto">
          <table className="w-full min-w-[420px] text-left">
            <thead className="text-[12px] uppercase tracking-[0.06em] text-muted">
              <tr>
                <th className="py-1.5 pr-4 font-semibold">Mois</th>
                <th className="py-1.5 pr-4 text-right font-semibold">Solaire</th>
                <th className="py-1.5 pr-4 text-right font-semibold">Réseau</th>
                <th className="py-1.5 text-right font-semibold">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line tabular-nums text-fg">
              {months.map((m) => (
                <tr key={m.key}>
                  <td className="py-1.5 pr-4">{m.label}</td>
                  <td className="py-1.5 pr-4 text-right">{nf.format(m.solar)} kWh</td>
                  <td className="py-1.5 pr-4 text-right">{nf.format(m.grid)} kWh</td>
                  <td className="py-1.5 text-right font-semibold">{nf.format(m.solar + m.grid)} kWh</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
      <figcaption className="sr-only">Consommation d’électricité mensuelle, en kWh, répartie entre solaire et réseau.</figcaption>
    </figure>
  );
}
