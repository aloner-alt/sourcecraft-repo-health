import { SecurityCollector } from './security.collector';
import { DataStatus } from '@prisma/client';

describe('SecurityCollector', () => {
  it('does not infer security from repository files when AppSec is unavailable', async () => {
    await expect(new SecurityCollector().collect('team', 'demo')).resolves.toEqual({
      score: null,
      status: DataStatus.NO_DATA,
      summary:
        'AppSec SourceCraft results are unavailable; security was not scored and no vulnerability claim was made.',
      metrics: [],
    });
  });
});
