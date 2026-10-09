import { WorkAction } from '@prisma/client'

export { WorkAction }

export const WORK_ACTION_LABELS: Record<WorkAction, string> = {
  PLANTED: 'Planted',
  POTTED_ON: 'Potted on',
  REPOTTED: 'Repotted',
  PRUNED: 'Pruned',
  WATERED: 'Watered',
  FED: 'Fed',
  PROPAGATED: 'Propagated',
  DIVIDED: 'Divided',
  STAKED: 'Staked',
  WEEDED: 'Weeded',
  MULCHED: 'Mulched',
  PEST_DISEASE_TREATMENT: 'Pest/disease treatment',
  LABELLED: 'Labelled',
  SURVEYED: 'Surveyed',
  OTHER: 'Other',
}
