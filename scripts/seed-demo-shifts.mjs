function nextMondayLocal(now) {
  const d = new Date(now);
  d.setHours(0, 0, 0, 0);
  const day = d.getDay(); // 0=Sun..6=Sat
  const diff = (8 - day) % 7;
  d.setDate(d.getDate() + (diff === 0 ? 7 : diff));
  return d;
}

function atTimeLocal(date, hours, minutes = 0) {
  const d = new Date(date);
  d.setHours(hours, minutes, 0, 0);
  return d;
}

export async function seedDemoMorningShiftsForNextWeek(prisma, companyProfile) {
  const startOfNextWeek = nextMondayLocal(new Date());

  for (let i = 0; i < 7; i += 1) {
    const day = new Date(startOfNextWeek);
    day.setDate(startOfNextWeek.getDate() + i);

    const startsAt = atTimeLocal(day, 8, 0);
    const endsAt = atTimeLocal(day, 16, 0);

    const existing = await prisma.job.findFirst({
      where: {
        companyId: companyProfile.id,
        title: "Ranná zmena",
        startsAt,
      },
    });

    const data = {
      companyId: companyProfile.id,
      title: "Ranná zmena",
      description: "Demo ranná zmena (budúci týždeň) pre testovanie marketplace/kalendára.",
      locationCity: companyProfile.addressCity ?? "Bratislava",
      locationAddress: companyProfile.addressStreet ?? "Hlavná 1",
      region: companyProfile.region,
      warehouseType: companyProfile.warehouseType ?? "WAREHOUSE",
      positionTypes: [],
      startsAt,
      endsAt,
      durationHours: 8,
      hourlyRate: "10.00",
      neededWorkers: 2,
      status: "OPEN",
    };

    if (existing) {
      await prisma.job.update({ where: { id: existing.id }, data });
    } else {
      await prisma.job.create({ data });
    }
  }
}
