import type { Metadata } from "next";
import { AppShell } from "@/components/layout/app-shell";
import { requireRole } from "@/lib/auth/session";
import { UserRole } from "@/types";
import { getAdminDashboardData } from "@/server/services/admin";
import { tabs, type TabValue } from "@/app/admin/admin-constants";
import { AdminTabs } from "@/app/admin/admin-tabs";
import { CompanyApprovals } from "@/app/admin/company-approvals";
import { AdminOverview } from "@/app/admin/admin-overview";
import { AdminUsers } from "@/app/admin/admin-users";
import { AdminJobs } from "@/app/admin/admin-jobs";
import { AdminApplications } from "@/app/admin/admin-applications";
import { AdminMonitorColumns } from "@/app/admin/admin-monitor-columns";

export const metadata: Metadata = {
  title: "Admin monitor · Warehouse Flex Portal",
};

export const dynamic = "force-dynamic";

type Props = {
  searchParams: Promise<{
    tab?: string;
  }>;
};

export default async function AdminPage({ searchParams }: Props) {
  const resolvedParams = await searchParams;
  await requireRole(UserRole.ADMIN);
  const requestedTab = resolvedParams?.tab?.toLowerCase() as
    | TabValue
    | undefined;
  const activeTab = tabs.some((tab) => tab.value === requestedTab)
    ? (requestedTab as TabValue)
    : "overview";
  const data = await getAdminDashboardData();
  const noDataYet =
    data.counts.workers === 0 &&
    data.counts.companies === 0 &&
    data.counts.applications === 0;

  return (
    <AppShell
      title="Admin monitor"
      subtitle="Len na čítanie – slúži na kontrolu, či všetky toky fungujú."
      homeHref="/admin"
    >
      <div className="space-y-6">
        <p className="text-xs text-muted-foreground">
          Táto časť je iba na náhľad produkčnej prevádzky.
        </p>
        <AdminTabs activeTab={activeTab} />
        <CompanyApprovals pendingCompanies={data.pendingCompanies} />
        {activeTab === "overview" ? (
          <>
            <AdminOverview counts={data.counts} noDataYet={noDataYet} />
            <AdminMonitorColumns monitor={data.monitor} />
          </>
        ) : null}
        {activeTab === "users" ? (
          <AdminUsers
            latestWorkers={data.latestWorkers}
            latestCompanies={data.latestCompanies}
          />
        ) : null}
        {activeTab === "jobs" ? <AdminJobs recentJobs={data.recentJobs} /> : null}
        {activeTab === "applications" ? (
          <AdminApplications recentApplications={data.recentApplications} />
        ) : null}
      </div>
    </AppShell>
  );
}
