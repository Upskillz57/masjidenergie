import type { Metadata, Viewport } from "next";
import { Suspense, type ReactNode } from "react";
import { ServiceWorkerRegister } from "@/components/admin/notifications/push";
import { AccountBox } from "@/components/dashboard/account";
import { SidebarNav, type NavItem } from "@/components/dashboard/nav";
import { DashboardShell, Icon } from "@/components/dashboard/ui";
import { getSidebarCounts } from "@/lib/admin/data";
import { countUnreadNotifications } from "@/lib/admin/notifications-data";
import { countMyOpenTasks } from "@/lib/admin/tasks-data";
import { getCurrentUser } from "@/lib/auth";
import { isStaffRole } from "@/lib/workflow";

export const metadata: Metadata = {
  title: "Espace admin",
  robots: { index: false, follow: false },
  // Installable sur l'écran d'accueil (application « ME Équipe »).
  manifest: "/equipe.webmanifest",
  appleWebApp: { capable: true, title: "ME Équipe", statusBarStyle: "black-translucent" },
  icons: { apple: "/brand/icones/masjid-energie-icone-180px.png" },
};

export const viewport: Viewport = { themeColor: "#0a3d2e" };

type Counts = { newRequests: number; pendingAccounts: number; myTasks: number; unread: number };

const items = (counts?: Counts, isAdmin = false): NavItem[] => [
  { href: "/admin/travail", label: "Espace de travail", icon: <Icon name="check" />, badge: counts?.myTasks },
  { href: "/admin/notifications", label: "Notifications", icon: <Icon name="bell" />, badge: counts?.unread },
  { href: "/admin/demandes", label: "Demandes d’étude", icon: <Icon name="inbox" />, badge: counts?.newRequests },
  { href: "/admin/comptes", label: "Comptes mosquées", icon: <Icon name="userPlus" />, badge: counts?.pendingAccounts },
  { href: "/admin/cartes", label: "Cartes de visite", icon: <Icon name="card" /> },
  { href: "/admin/documents", label: "Documents utiles", icon: <Icon name="file" /> },
  ...(isAdmin ? [{ href: "/admin/equipe", label: "Équipe", icon: <Icon name="users" /> }] : []),
  { href: "/espace", label: "Aperçu espace mosquée", icon: <Icon name="gauge" /> },
];

async function AdminNav() {
  const user = await getCurrentUser();
  if (!user || !isStaffRole(user.role)) return <SidebarNav items={items()} />;
  const [counts, myTasks, unread] = await Promise.all([
    getSidebarCounts(),
    countMyOpenTasks(user.id),
    countUnreadNotifications(user.id),
  ]);
  return <SidebarNav items={items({ ...counts, myTasks, unread }, user.role === "admin")} />;
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
      <ServiceWorkerRegister />
      {children}
    </DashboardShell>
  );
}
