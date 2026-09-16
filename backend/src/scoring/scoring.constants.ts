export enum HealthCategory {
  SECURITY = 'SECURITY',
  ACTIVITY = 'ACTIVITY',
  DOCUMENTATION = 'DOCUMENTATION',
  CI_CD = 'CI_CD',
  ISSUES = 'ISSUES',
  CODE_HEALTH = 'CODE_HEALTH',
}

export const CATEGORY_WEIGHTS: Readonly<Record<HealthCategory, number>> = {
  [HealthCategory.SECURITY]: 0.2,
  [HealthCategory.ACTIVITY]: 0.15,
  [HealthCategory.DOCUMENTATION]: 0.15,
  [HealthCategory.CI_CD]: 0.15,
  [HealthCategory.ISSUES]: 0.15,
  [HealthCategory.CODE_HEALTH]: 0.2,
};
