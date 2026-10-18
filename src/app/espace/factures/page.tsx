import { Card, Icon, PageHeader } from "@/components/dashboard/ui";
import { requireUser } from "@/lib/auth";
import { euros, invoices, kwh } from "@/lib/espace/data";

export default async function InvoicesPage() {
  await requireUser("/espace/factures");
  const totalSavings = invoices.reduce((n, f) => n + f.savings, 0);

  return (
    <>
      <PageHeader
        eyebrow="FACTURES"
        title="Vos factures d’électricité"
        description={`Sur 12 mois, le solaire vous a évité ${euros(totalSavings)} d’achats d’électricité.`}
      />
      <Card className="overflow-hidden [&>div]:p-0">
        <table className="w-full text-left text-[14px]">
          <thead className="hidden border-b border-line bg-bg-soft text-[12px] font-semibold uppercase tracking-[0.06em] text-muted md:table-header-group">
            <tr>
              <th className="px-5 py-3">Facture</th>
              <th className="px-3 py-3">Période</th>
              <th className="px-3 py-3 text-right">Réseau</th>
              <th className="px-3 py-3 text-right">Économie solaire</th>
              <th className="px-3 py-3 text-right">Montant</th>
              <th className="px-5 py-3 text-right">Document</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {invoices.map((f) => (
              <tr key={f.id} className="grid grid-cols-2 gap-1 px-5 py-4 md:table-row md:p-0">
                <td className="md:px-5 md:py-3.5">
                  <span className="grid leading-tight">
                    <span className="font-semibold text-heading">{f.month}</span>
                    <span className="text-[12.5px] text-muted">{f.id}</span>
                  </span>
                </td>
                <td className="text-right text-[13.5px] text-muted md:px-3 md:py-3.5 md:text-left">{f.period}</td>
                <td className="tabular-nums text-fg md:px-3 md:py-3.5 md:text-right">{kwh(f.kwh)}</td>
                <td className="text-right tabular-nums md:px-3 md:py-3.5">
                  {f.savings > 0 ? <span className="font-semibold text-brand-text">− {euros(f.savings, 2)}</span> : <span className="text-muted">—</span>}
                </td>
                <td className="md:px-3 md:py-3.5 md:text-right">
                  <span className="grid leading-tight md:justify-items-end">
                    <span className="font-semibold tabular-nums text-heading">{euros(f.amount, 2)}</span>
                    <span className={`text-[12px] font-semibold ${f.status === "payee" ? "text-brand-text" : "text-gold-dark"}`}>
                      {f.status === "payee" ? "Payée" : "À payer"}
                    </span>
                  </span>
                </td>
                <td className="text-right md:px-5 md:py-3.5">
                  <button
                    type="button"
                    disabled
                    title="Disponible après le raccordement de votre compte"
                    className="inline-flex h-8 cursor-not-allowed items-center gap-1.5 rounded-lg border border-line px-3 text-[13px] font-semibold text-muted"
                  >
                    <Icon name="download" className="size-4" /> PDF
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </>
  );
}
