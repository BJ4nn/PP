function startOfTomorrowLocal(now) {
  const d = new Date(now);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + 1);
  return d;
}

function atTimeLocal(date, hours, minutes = 0) {
  const d = new Date(date);
  d.setHours(hours, minutes, 0, 0);
  return d;
}

function hoursBetween(startsAt, endsAt) {
  return Math.round((endsAt.getTime() - startsAt.getTime()) / (60 * 60 * 1000));
}

async function upsertCompanyUser(prisma, { email, passwordHash, profile }) {
  const user = await prisma.user.upsert({
    where: { email },
    update: {
      passwordHash,
      role: "COMPANY",
      companyProfile: {
        upsert: {
          update: profile,
          create: profile,
        },
      },
    },
    create: {
      email,
      passwordHash,
      role: "COMPANY",
      companyProfile: { create: profile },
    },
  });

  return prisma.companyProfile.findUniqueOrThrow({ where: { userId: user.id } });
}

async function upsertJob(prisma, data) {
  const existing = await prisma.job.findFirst({
    where: { companyId: data.companyId, title: data.title, startsAt: data.startsAt },
  });
  if (existing) {
    await prisma.job.update({ where: { id: existing.id }, data });
    return existing;
  }
  return prisma.job.create({ data });
}

function buildThreeDayOffers(baseDay) {
  const day0 = new Date(baseDay);
  const day1 = new Date(baseDay);
  day1.setDate(day1.getDate() + 1);
  const day2 = new Date(baseDay);
  day2.setDate(day2.getDate() + 2);

  return [
    {
      startsAt: atTimeLocal(day0, 6, 0),
      endsAt: atTimeLocal(day0, 14, 0),
      title: "Picker/Packer – ranná zmena",
      description:
        "Vychystávanie objednávok (picking) + balenie a štítkovanie. Práca v suchom sklade, tempo podľa skenera, prestávka 30 min. Vhodné aj pre šikovných nováčikov.",
      positionTypes: ["PICKING", "PACKING", "EXPEDITION"],
      hourlyRate: "10.50",
      neededWorkers: 5,
      physicalLevel: "MEDIUM",
    },
    {
      startsAt: atTimeLocal(day1, 14, 0),
      endsAt: atTimeLocal(day1, 22, 0),
      title: "Expedícia – poobedná zmena",
      description:
        "Príprava paliet na odvoz, páskovanie, nakládka/ vykládka (ručné paleťáky). Kontrola štítkov a dodacích listov. Pracuje sa v tíme, BOZP na mieste.",
      positionTypes: ["EXPEDITION", "GOODS_RECEIPT"],
      hourlyRate: "11.20",
      neededWorkers: 3,
      physicalLevel: "HEAVY",
    },
    {
      startsAt: atTimeLocal(day2, 8, 0),
      endsAt: atTimeLocal(day2, 16, 0),
      title: "Kontrola kvality + dopĺňanie",
      description:
        "Kontrola poškodených balení, prebalenie, dopĺňanie na lokácie a základná evidencia v skeneri. Dôraz na presnosť a čistotu pracoviska.",
      positionTypes: ["QUALITY_CONTROL", "PACKING"],
      hourlyRate: "10.90",
      neededWorkers: 2,
      physicalLevel: "LIGHT",
    },
  ];
}

function buildThreeDayVzvOffers(baseDay) {
  const day0 = new Date(baseDay);
  const day1 = new Date(baseDay);
  day1.setDate(day1.getDate() + 1);
  const day2 = new Date(baseDay);
  day2.setDate(day2.getDate() + 2);

  const urgentStarts = atTimeLocal(day1, 12, 0);
  return [
    {
      startsAt: atTimeLocal(day0, 7, 0),
      endsAt: atTimeLocal(day0, 15, 0),
      title: "Príjem tovaru – skener",
      description:
        "Príjem tovaru, naskladnenie podľa lokácií a kontrola množstiev. Skener + papierové dodacie listy. Zodpovedná práca, čistý sklad.",
      positionTypes: ["GOODS_RECEIPT", "QUALITY_CONTROL"],
      hourlyRate: "10.80",
      neededWorkers: 2,
      physicalLevel: "MEDIUM",
    },
    {
      startsAt: urgentStarts,
      endsAt: atTimeLocal(day1, 20, 0),
      title: "VZV vodič – urgent (poobedná)",
      description:
        "Urgentné doplnenie tímu na VZV (čelný). Presuny paliet, zásobovanie vychystávacích zón, práca so skenerom. Platný preukaz VZV nutný.",
      positionTypes: ["VZV", "EXPEDITION"],
      hourlyRate: "13.20",
      neededWorkers: 1,
      requiredVzv: true,
      minExperience: "BASIC",
      physicalLevel: "MEDIUM",
      isUrgent: true,
      urgentBonusEur: 15,
      confirmByOffsetHours: 6,
    },
    {
      startsAt: atTimeLocal(day2, 6, 30),
      endsAt: atTimeLocal(day2, 14, 30),
      title: "Doplňovanie lokácií (reach truck)",
      description:
        "Doplňovanie vysokých lokácií, presuny paliet a práca v uličkách. Nutná skúsenosť s VZV, precíznosť a ohľaduplnosť.",
      positionTypes: ["VZV"],
      hourlyRate: "12.80",
      neededWorkers: 2,
      requiredVzv: true,
      minExperience: "INTERMEDIATE",
      physicalLevel: "MEDIUM",
    },
  ];
}

function buildThreeDayPackagingOffers(baseDay) {
  const day0 = new Date(baseDay);
  const day1 = new Date(baseDay);
  day1.setDate(day1.getDate() + 1);
  const day2 = new Date(baseDay);
  day2.setDate(day2.getDate() + 2);

  return [
    {
      startsAt: atTimeLocal(day0, 9, 0),
      endsAt: atTimeLocal(day0, 17, 0),
      title: "Balenie e-shop objednávok",
      description:
        "Balenie drobného tovaru, kontrola obsahu objednávok a tlač štítkov. Práca v teple, sedenie/ státie podľa potreby. Vhodné aj pre začiatočníkov.",
      positionTypes: ["PACKING", "QUALITY_CONTROL"],
      hourlyRate: "10.20",
      neededWorkers: 4,
      physicalLevel: "LIGHT",
    },
    {
      startsAt: atTimeLocal(day1, 6, 0),
      endsAt: atTimeLocal(day1, 14, 0),
      title: "Picking – ľahký tovar",
      description:
        "Vychystávanie ľahkého tovaru (kozmetika/drogéria) podľa skenera, triedenie do boxov a odovzdanie na balenie. Tempo je primerané, zaškolenie na mieste.",
      positionTypes: ["PICKING", "PACKING"],
      hourlyRate: "10.70",
      neededWorkers: 6,
      physicalLevel: "LIGHT",
    },
    {
      startsAt: atTimeLocal(day2, 13, 0),
      endsAt: atTimeLocal(day2, 21, 0),
      title: "Expedícia – páskovanie paliet",
      description:
        "Príprava paliet na nočný odvoz, páskovanie a fóliovanie. Spolupráca s VZV vodičmi, práca v stoji, pracovná obuv nutná.",
      positionTypes: ["EXPEDITION"],
      hourlyRate: "11.00",
      neededWorkers: 3,
      physicalLevel: "MEDIUM",
    },
  ];
}

export async function seedDemoWarehouseCompaniesAndShifts(prisma, passwordHash) {
  const baseDay = startOfTomorrowLocal(new Date());

  const companies = [
    {
      email: "company2@demo.local",
      profile: {
        companyName: "LogiPack Bratislava s.r.o.",
        siteName: "DC Devínska Nová Ves",
        contactName: "Marek Kováč",
        contactPhone: "+421900000101",
        addressStreet: "Priemyselná 12",
        addressCity: "Bratislava",
        addressZip: "84107",
        region: "BA",
        warehouseType: "WAREHOUSE",
        isApproved: true,
        onboardingComplete: true,
      },
      offersFactory: buildThreeDayOffers,
    },
    {
      email: "company3@demo.local",
      profile: {
        companyName: "SkladPlus Senec a.s.",
        siteName: "Park Senec – hala B",
        contactName: "Ivana Novotná",
        contactPhone: "+421900000102",
        addressStreet: "Diaľničná cesta 3",
        addressCity: "Senec",
        addressZip: "90301",
        region: "SENEC",
        warehouseType: "WAREHOUSE",
        isApproved: true,
        onboardingComplete: true,
      },
      offersFactory: buildThreeDayVzvOffers,
    },
    {
      email: "company4@demo.local",
      profile: {
        companyName: "Trnava Logistics s.r.o.",
        siteName: "Hala pri obchvate",
        contactName: "Peter Blaško",
        contactPhone: "+421900000103",
        addressStreet: "Priemyselná 18",
        addressCity: "Trnava",
        addressZip: "91701",
        region: "TRNAVA",
        warehouseType: "WAREHOUSE",
        isApproved: true,
        onboardingComplete: true,
      },
      offersFactory: buildThreeDayPackagingOffers,
    },
    {
      email: "company5@demo.local",
      profile: {
        companyName: "Galanta Distribution s.r.o.",
        siteName: "DC Galanta – suchý sklad",
        contactName: "Zuzana Horváthová",
        contactPhone: "+421900000104",
        addressStreet: "Skladová 6",
        addressCity: "Galanta",
        addressZip: "92401",
        region: "GALANTA",
        warehouseType: "WAREHOUSE",
        isApproved: true,
        onboardingComplete: true,
      },
      offersFactory: buildThreeDayOffers,
    },
    {
      email: "company6@demo.local",
      profile: {
        companyName: "Bratislava ColdChain s.r.o.",
        siteName: "Chladený sklad – Ivanka pri Dunaji",
        contactName: "Tomáš Szabó",
        contactPhone: "+421900000105",
        addressStreet: "Letisková 2",
        addressCity: "Ivanka pri Dunaji",
        addressZip: "90028",
        region: "BA",
        warehouseType: "WAREHOUSE",
        isApproved: true,
        onboardingComplete: true,
      },
      offersFactory: (d) => {
        const offers = buildThreeDayVzvOffers(d);
        return offers.map((offer) => ({
          ...offer,
          description: `${offer.description} Pracuje sa v chladenom sklade (cca 6–10°C) – teplé oblečenie zabezpečené.`,
          hourlyRate: offer.requiredVzv ? "13.70" : "11.40",
        }));
      },
    },
  ];

  const seededEmails = [];

  for (const company of companies) {
    const companyProfile = await upsertCompanyUser(prisma, {
      email: company.email,
      passwordHash,
      profile: company.profile,
    });
    seededEmails.push(company.email);

    const offers = company.offersFactory(baseDay);
    for (const offer of offers) {
      const confirmBy =
        offer.isUrgent && typeof offer.confirmByOffsetHours === "number"
          ? new Date(offer.startsAt.getTime() - offer.confirmByOffsetHours * 60 * 60 * 1000)
          : undefined;

      await upsertJob(prisma, {
        companyId: companyProfile.id,
        title: offer.title,
        description: offer.description,
        locationCity: companyProfile.addressCity ?? "Bratislava",
        locationAddress: companyProfile.addressStreet ?? "Hlavná 1",
        region: companyProfile.region,
        warehouseType: "WAREHOUSE",
        positionTypes: offer.positionTypes ?? [],
        startsAt: offer.startsAt,
        endsAt: offer.endsAt,
        durationHours: hoursBetween(offer.startsAt, offer.endsAt),
        hourlyRate: offer.hourlyRate,
        requiredVzv: offer.requiredVzv ?? false,
        minExperience: offer.minExperience ?? null,
        physicalLevel: offer.physicalLevel ?? "MEDIUM",
        neededWorkers: offer.neededWorkers,
        status: "OPEN",
        isUrgent: offer.isUrgent ?? false,
        urgentBonusEur: offer.urgentBonusEur,
        confirmBy,
      });
    }
  }

  return seededEmails;
}
