import { JobWaveStage } from "@/types";

const WAVE_DELAY_HOURS = 12;

const stageOrder: Record<JobWaveStage, number> = {
  [JobWaveStage.WAVE1]: 1,
  [JobWaveStage.WAVE2]: 2,
  [JobWaveStage.PUBLIC]: 3,
};

export function getAutoWaveStage(waveStartedAt: Date, now = new Date()) {
  const hoursSince = (now.getTime() - waveStartedAt.getTime()) / (60 * 60 * 1000);
  if (hoursSince >= WAVE_DELAY_HOURS * 2) return JobWaveStage.PUBLIC;
  if (hoursSince >= WAVE_DELAY_HOURS) return JobWaveStage.WAVE2;
  return JobWaveStage.WAVE1;
}

export function getEffectiveWaveStage(
  waveStage: JobWaveStage,
  waveStartedAt: Date,
  now = new Date(),
) {
  const autoStage = getAutoWaveStage(waveStartedAt, now);
  return stageOrder[waveStage] >= stageOrder[autoStage] ? waveStage : autoStage;
}

export function canWorkerSeeWave(
  waveStage: JobWaveStage,
  flags: { isPriority: boolean; hasWorked: boolean },
) {
  if (waveStage === JobWaveStage.PUBLIC) return true;
  if (waveStage === JobWaveStage.WAVE2) return flags.hasWorked || flags.isPriority;
  return flags.isPriority;
}
