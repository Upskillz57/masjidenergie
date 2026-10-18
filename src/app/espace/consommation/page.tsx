import { Card, PageHeader, Stat } from "@/components/dashboard/ui";
import { EnergyChart } from "@/components/espace/energy-chart";
import { requireUser } from "@/lib/auth";
import { energyMonths, energyTotals, euros, kwh, PRICE_PER_KWH } from "@/lib/espace/data";

export default async function ConsumptionPage() {
  await requireUser("/espace/consommation");
  const before = energyMonths.filter((m) => m.solar === 0);
  const after = energyMonths.filter((m) => m.solar > 0);
  const avg = (list: typeof energyMonths, f: (m: (typeof energyMonths)[number]) => number) =>
    list.length ? list.reduce((n, m) => n + f(m), 0) / list.length : 0;
  const t = energyTotals();

  return (
    <>
      <PageHeader
        eyebrow="CONSOMMATION"
        title="Votre électricité, mois par mois"
        description="Survolez une colonne pour voir le détail. La part dorée est l’électricité produite par vos panneaux et consommée directement par la mosquée."
      />
      <div className="mb-6 grid gap-3.5 sm:grid-cols-3">
        <Stat label="Achat réseau moyen avant solaire" value={kwh(avg(before, (m) => m.grid))} sub="par mois" icon="bolt" />
        <Stat label="Achat réseau moyen depuis" value={kwh(avg(after, (m) => m.grid))} sub="par mois" icon="sun" tone="brand" />
        <Stat label="Économies sur 12 mois" value={euros(t.savings)} sub={`au tarif de ${PRICE_PER_KWH.toLocaleString("fr-FR")} €/kWh`} icon="euro" tone="gold" />
      </div>
      <Card title="12 derniers mois" icon="bolt">
        <EnergyChart months={energyMonths} height={320} />
      </Card>
    </>
  );
}
