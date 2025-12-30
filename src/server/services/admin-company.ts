import { prisma } from "@/server/db/client";

export async function getCompanyDetailsForAdmin(companyId: string) {
  const company = await prisma.companyProfile.findUnique({
    where: { id: companyId },
    include: {
      user: { select: { email: true, id: true, createdAt: true } },
      _count: { select: { jobs: true } },
    },
  });
  if (!company) return null;

  const applicationsCount = await prisma.jobApplication.count({
    where: { job: { companyId: company.id } },
  });
  const openJobsCount = await prisma.job.count({
    where: { companyId: company.id, status: "OPEN" },
  });

  return {
    company,
    stats: {
      jobsCount: company._count.jobs,
      openJobsCount,
      applicationsCount,
    },
  };
}

