import Link from "next/link";
import { Card, Icon, PageHeader, Stat } from "@/components/dashboard/ui";
import { EnergyChart } from "@/components/espace/energy-chart";
import { requireUser } from "@/lib/auth";
import { energyMonths, energyTotals, euros, invoices, kwh } from "@/lib/espace/data";

export default async function EspaceDashboard() {
  const user = await requireUser("/espace");
  const t = energyTotals();
  const lastMonth = energyMonths.at(-1)!;

  return (
    <>
      <PageHeader
        eyebrow="TABLEAU DE BORD"
        title={`Assalamou alaykoum, ${user.fullName.split(" ")[0]}`}
        description="Votre consommation d’électricité, votre production solaire et vos économies sur les 12 derniers mois."
      />

      <div className="mb-6 grid gap-3.5 sm:grid-cols-2 xl:grid-cols-4">
        <Stat label="Économies réalisées" value={euros(t.savings)} sub="grâce au solaire, sur 12 mois" icon="euro" tone="gold" />
        <Stat label="Production solaire" value={kwh(t.solar)} sub={`${Math.round(t.selfShare * 100)} % de votre consommation`} icon="sun" tone="brand" />
        <Stat label="Consommation totale" value={kwh(t.consumption)} sub="sur 12 mois" icon="bolt" />
        <Stat label="CO₂ évité" value={`${new Intl.NumberFormat("fr-FR").format(Math.round(t.co2Kg))} kg`} sub="depuis la mise en service" icon="leaf" />
      </div>

      <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <Card
          title="Consommation mensuelle"
          icon="bolt"
          actions={
            <Link href="/espace/consommation" className="text-[13.5px] font-medium text-brand-text hover:underline">
              Détail →
            </Link>
          }
        >
          <EnergyChart months={energyMonths} />
        </Card>

        <div className="grid gap-6">
          <Card title={`Ce mois-ci · ${lastMonth.label}`} icon="gauge">
            <dl className="grid gap-3 text-[14px]">
              {[
                ["Consommation", kwh(lastMonth.solar + lastMonth.grid)],
                ["Dont solaire", kwh(lastMonth.solar)],
                ["Acheté au réseau", kwh(lastMonth.grid)],
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between gap-4">
                  <dt className="text-muted">{k}</dt>
                  <dd className="font-semibold tabular-nums text-heading">{v}</dd>
                </div>
              ))}
            </dl>
          </Card>

          <Card
            title="Dernières factures"
            icon="file"
            actions={
              <Link href="/espace/factures" className="text-[13.5px] font-medium text-brand-text hover:underline">
                Tout voir →
              </Link>
            }
          >
            <ul className="grid gap-3">
              {invoices.slice(0, 3).map((f) => (
                <li key={f.id} className="flex items-center justify-between gap-3 text-[14px]">
                  <span className="grid leading-tight">
                    <span className="font-medium text-fg">{f.month}</span>
                    <span className="text-[12.5px] text-muted">{kwh(f.kwh)} achetés au réseau</span>
                  </span>
                  <span className="grid justify-items-end leading-tight">
                    <span className="font-semibold tabular-nums text-heading">{euros(f.amount, 2)}</span>
                    <span className={`text-[12px] font-semibold ${f.status === "payee" ? "text-brand-text" : "text-gold-dark"}`}>
                      {f.status === "payee" ? "Payée" : "À payer"}
                    </span>
                  </span>
                </li>
              ))}
            </ul>
          </Card>

          <Link
            href="/espace/projet"
            className="flex items-center gap-3 rounded-xl bg-brand px-5 py-4 text-white shadow-[0_8px_20px_#0e5c4730] hover:bg-brand-hover"
          >
            <Icon name="sun" className="size-6 text-gold" />
            <span className="grid flex-1 leading-tight">
              <span className="font-semibold">Mon projet solaire</span>
              <span className="text-[13px] text-on-brand">Étapes, documents et suivi de votre installation</span>
            </span>
            <Icon name="back" className="size-4 rotate-180" />
          </Link>
        </div>
      </div>
    </>
  );
}
