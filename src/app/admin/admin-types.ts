import type { getAdminDashboardData } from "@/server/services/admin";

export type AdminDashboardData = Awaited<ReturnType<typeof getAdminDashboardData>>;

