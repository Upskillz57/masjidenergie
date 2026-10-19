import type { Metadata } from "next";
import { Suspense, type ReactNode } from "react";
import { AccountBox } from "@/components/dashboard/account";
import { SidebarNav, type NavItem } from "@/components/dashboard/nav";
import { DashboardShell, Icon } from "@/components/dashboard/ui";

export const metadata: Metadata = {
  title: "Espace mosquée",
  robots: { index: false, follow: false },
};

const items: NavItem[] = [
  { href: "/espace", label: "Tableau de bord", icon: <Icon name="gauge" />, exact: true },
  { href: "/espace/consommation", label: "Consommation", icon: <Icon name="bolt" /> },
  { href: "/espace/factures", label: "Factures", icon: <Icon name="file" /> },
  { href: "/espace/projet", label: "Mon projet solaire", icon: <Icon name="sun" /> },
  { href: "/espace/documents", label: "Documents", icon: <Icon name="folder" /> },
  { href: "/espace/carte", label: "Carte de visite", icon: <Icon name="card" /> },
];

export default function EspaceLayout({ children }: { children: ReactNode }) {
  return (
    <DashboardShell
      area="Espace mosquée"
      nav={<SidebarNav items={items} />}
      account={
        <Suspense fallback={null}>
          <AccountBox />
        </Suspense>
      }
    >
      <p className="mb-6 flex items-start gap-2.5 rounded-lg border border-gold/40 bg-gold/10 px-4 py-2.5 text-[13.5px] text-fg">
        <Icon name="clock" className="mt-0.5 size-4 flex-none text-gold-dark" />
        <span>
          <strong className="font-semibold">Aperçu de l’espace mosquée.</strong> Les chiffres de consommation et les factures
          affichés sont des exemples, en attendant le raccordement de votre compteur. Le suivi de votre projet est réel.
        </span>
      </p>
      {children}
    </DashboardShell>
  );
}
