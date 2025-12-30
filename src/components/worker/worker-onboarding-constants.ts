import {
  DayOfWeek,
  ExperienceLevel,
  Region,
  ShiftType,
} from "@/types";
import type { WorkerOnboardingInput } from "@/lib/validators/onboarding";

export const dayOptions = Object.values(DayOfWeek);
export const shiftOptions = Object.values(ShiftType);
export const experienceOptions = Object.values(ExperienceLevel);
export const regionOptions = Object.values(Region);

export const dayLabels: Record<DayOfWeek, string> = {
  [DayOfWeek.MON]: "Pondelok",
  [DayOfWeek.TUE]: "Utorok",
  [DayOfWeek.WED]: "Streda",
  [DayOfWeek.THU]: "Štvrtok",
  [DayOfWeek.FRI]: "Piatok",
  [DayOfWeek.SAT]: "Sobota",
  [DayOfWeek.SUN]: "Nedeľa",
};

export const shiftLabels: Record<ShiftType, string> = {
  [ShiftType.MORNING]: "Ranná zmena",
  [ShiftType.AFTERNOON]: "Poobedná zmena",
  [ShiftType.NIGHT]: "Nočná zmena",
};

export const experienceLabels: Record<ExperienceLevel, string> = {
  [ExperienceLevel.NONE]: "Začínajúci",
  [ExperienceLevel.BASIC]: "Základná prax",
  [ExperienceLevel.INTERMEDIATE]: "Skúsený",
  [ExperienceLevel.ADVANCED]: "Senior / vedúci",
};

export const createWorkerOnboardingDefaults = (): WorkerOnboardingInput => ({
  fullName: "",
  phone: "",
  city: "",
  region: Region.BA,
  hasTradeLicense: false,
  experienceLevel: ExperienceLevel.NONE,
  hasVzv: false,
  hasBozp: false,
  hasFoodCard: false,
  availability: {
    daysOfWeek: [],
    shiftTypes: [],
  },
  hasCar: false,
  preferredContractType: null,
  minHourlyRate: undefined,
  minHourlyRateEmployment: undefined,
});
