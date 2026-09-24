import { BadRequestException, Injectable } from '@nestjs/common';
import { CategoryScoreInputDto } from './dto/calculate-score.dto';
import { CATEGORY_WEIGHTS, HealthCategory } from './scoring.constants';
import { HealthScoreResult } from './scoring.types';

@Injectable()
export class ScoringService {
  calculate(inputs: CategoryScoreInputDto[]): HealthScoreResult {
    this.assertUniqueCategories(inputs);
    for (const input of inputs) {
      if (input.score !== null && (!Number.isFinite(input.score) || input.score < 0 || input.score > 100)) {
        throw new BadRequestException('Category scores must be within 0..100.');
      }
    }

    const inputByCategory = new Map(
      inputs.map((input) => [input.category, input.score]),
    );

    const categories = Object.values(HealthCategory).map((category) => {
      const score = inputByCategory.get(category) ?? null;

      return {
        category,
        score,
        weight: CATEGORY_WEIGHTS[category],
        status: score === null ? ('NO_DATA' as const) : ('AVAILABLE' as const),
      };
    });

    const available = categories.filter(
      (category): category is typeof category & { score: number } =>
        category.score !== null,
    );
    const availableWeight = available.reduce(
      (sum, category) => sum + category.weight,
      0,
    );
    const weightedScore = available.reduce(
      (sum, category) => sum + category.score * category.weight,
      0,
    );

    return {
      score:
        availableWeight === 0
          ? null
          : this.round(weightedScore / availableWeight),
      dataCoverage: this.round(availableWeight * 100),
      availableWeight: this.round(availableWeight),
      categories,
    };
  }

  getMethodology(): typeof CATEGORY_WEIGHTS {
    return CATEGORY_WEIGHTS;
  }

  private assertUniqueCategories(inputs: CategoryScoreInputDto[]): void {
    const categories = inputs.map((input) => input.category);
    if (new Set(categories).size !== categories.length) {
      throw new BadRequestException('Each health category must appear once.');
    }
  }

  private round(value: number): number {
    return Math.round(value * 100) / 100;
  }
}
