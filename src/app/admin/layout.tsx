import type { Metadata } from "next";
import { Suspense, type ReactNode } from "react";
import { AccountBox } from "@/components/dashboard/account";
import { SidebarNav, type NavItem } from "@/components/dashboard/nav";
import { DashboardShell, Icon } from "@/components/dashboard/ui";
import { getSidebarCounts } from "@/lib/admin/data";
import { getCurrentUser } from "@/lib/auth";
import { isStaffRole } from "@/lib/workflow";

export const metadata: Metadata = {
  title: "Espace admin",
  robots: { index: false, follow: false },
};

const items = (counts?: { newRequests: number; pendingAccounts: number }, isAdmin = false): NavItem[] => [
  { href: "/admin/demandes", label: "Demandes d’étude", icon: <Icon name="inbox" />, badge: counts?.newRequests },
  { href: "/admin/comptes", label: "Comptes mosquées", icon: <Icon name="userPlus" />, badge: counts?.pendingAccounts },
  { href: "/admin/cartes", label: "Cartes de visite", icon: <Icon name="card" /> },
  ...(isAdmin ? [{ href: "/admin/equipe", label: "Équipe", icon: <Icon name="users" /> }] : []),
  { href: "/espace", label: "Aperçu espace mosquée", icon: <Icon name="gauge" /> },
];

async function AdminNav() {
  const user = await getCurrentUser();
  if (!user || !isStaffRole(user.role)) return <SidebarNav items={items()} />;
  return <SidebarNav items={items(await getSidebarCounts(), user.role === "admin")} />;
}

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <DashboardShell
      area="Espace admin"
      nav={
        <Suspense fallback={<SidebarNav items={items()} />}>
          <AdminNav />
        </Suspense>
      }
      account={
        <Suspense fallback={null}>
          <AccountBox />
        </Suspense>
      }
    >
      {children}
    </DashboardShell>
  );
}
