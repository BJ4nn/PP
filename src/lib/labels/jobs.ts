import { NoticeWindow, WarehouseType } from "@/types";

export const warehouseLabels: Record<WarehouseType, string> = {
  [WarehouseType.WAREHOUSE]: "Sklad",
  [WarehouseType.FULFILLMENT]: "Fulfillment centrum",
  [WarehouseType.RETAIL_DISTRIBUTION]: "Retail distribúcia",
  [WarehouseType.PRODUCTION_SUPPORT]: "Výrobná podpora",
  [WarehouseType.OTHER]: "Iné",
};

export const noticeLabels: Record<NoticeWindow, string> = {
  [NoticeWindow.H12]: "Storno: 12h",
  [NoticeWindow.H24]: "Storno: 24h",
  [NoticeWindow.H48]: "Storno: 48h",
};

export const noticeWindowHours: Record<NoticeWindow, number> = {
  [NoticeWindow.H12]: 12,
  [NoticeWindow.H24]: 24,
  [NoticeWindow.H48]: 48,
};
