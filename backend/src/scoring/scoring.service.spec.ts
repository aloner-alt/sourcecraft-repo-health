import { BadRequestException } from '@nestjs/common';
import { HealthCategory } from './scoring.constants';
import { ScoringService } from './scoring.service';

describe('ScoringService', () => {
  const service = new ScoringService();

  it('calculates the weighted score for all categories', () => {
    const result = service.calculate([
      { category: HealthCategory.SECURITY, score: 60 },
      { category: HealthCategory.ACTIVITY, score: 80 },
      { category: HealthCategory.DOCUMENTATION, score: 70 },
      { category: HealthCategory.CI_CD, score: 90 },
      { category: HealthCategory.ISSUES, score: 50 },
      { category: HealthCategory.CODE_HEALTH, score: 75 },
    ]);

    expect(result.score).toBe(70.5);
    expect(result.dataCoverage).toBe(100);
  });

  it('renormalizes available weights instead of treating no data as zero', () => {
    const result = service.calculate([
      { category: HealthCategory.SECURITY, score: null },
      { category: HealthCategory.ACTIVITY, score: 80 },
      { category: HealthCategory.DOCUMENTATION, score: 60 },
    ]);

    expect(result.score).toBe(70);
    expect(result.dataCoverage).toBe(30);
    expect(
      result.categories.find(
        (category) => category.category === HealthCategory.SECURITY,
      )?.status,
    ).toBe('NO_DATA');
  });

  it('returns a null score when every category has no data', () => {
    const result = service.calculate([]);

    expect(result.score).toBeNull();
    expect(result.dataCoverage).toBe(0);
  });

  it('rejects duplicate categories', () => {
    expect(() =>
      service.calculate([
        { category: HealthCategory.SECURITY, score: 50 },
        { category: HealthCategory.SECURITY, score: 70 },
      ]),
    ).toThrow(BadRequestException);
  });
});

