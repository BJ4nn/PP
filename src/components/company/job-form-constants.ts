import {
  ExperienceLevel,
  JobPositionType,
  NoticeWindow,
  PhysicalLevel,
  Region,
  WarehouseType,
} from "@/types";

export const regionOptions = Object.values(Region);
export const warehouseOptions = Object.values(WarehouseType);
export const experienceOptions = [undefined, ...Object.values(ExperienceLevel)];
export const physicalOptions = [undefined, ...Object.values(PhysicalLevel)];
export const noticeOptions = Object.values(NoticeWindow);
export const positionTypeOptions = Object.values(JobPositionType);

export const warehouseLabels: Record<WarehouseType, string> = {
  [WarehouseType.WAREHOUSE]: "Sklad",
  [WarehouseType.FULFILLMENT]: "Fulfillment centrum",
  [WarehouseType.RETAIL_DISTRIBUTION]: "Retail distribúcia",
  [WarehouseType.PRODUCTION_SUPPORT]: "Výrobná podpora",
  [WarehouseType.OTHER]: "Iné",
};

export const experienceLabels: Record<ExperienceLevel, string> = {
  [ExperienceLevel.NONE]: "Bez požiadavky",
  [ExperienceLevel.BASIC]: "Základná prax",
  [ExperienceLevel.INTERMEDIATE]: "Skúsený",
  [ExperienceLevel.ADVANCED]: "Senior / vedúci",
};

export const physicalLabels: Record<PhysicalLevel, string> = {
  [PhysicalLevel.LIGHT]: "Ľahká fyzická náročnosť",
  [PhysicalLevel.MEDIUM]: "Stredná fyzická náročnosť",
  [PhysicalLevel.HEAVY]: "Náročná fyzická práca",
};

export const noticeLabels: Record<NoticeWindow, string> = {
  [NoticeWindow.H12]: "12h",
  [NoticeWindow.H24]: "24h",
  [NoticeWindow.H48]: "48h",
};

export const positionTypeLabels: Record<JobPositionType, string> = {
  [JobPositionType.PACKING]: "Balenie",
  [JobPositionType.PICKING]: "Picking",
  [JobPositionType.EXPEDITION]: "Expedícia",
  [JobPositionType.VZV]: "VZV",
  [JobPositionType.GOODS_RECEIPT]: "Príjem tovaru",
  [JobPositionType.QUALITY_CONTROL]: "Kontrola tovaru",
};
