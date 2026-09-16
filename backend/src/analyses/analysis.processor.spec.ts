import { Job } from 'bullmq';
import { AnalysisRunnerService } from './analysis-runner.service';
import { AnalysisProcessor } from './analysis.processor';

describe('AnalysisProcessor', () => {
  const runner = { run: jest.fn() } as unknown as AnalysisRunnerService;
  const processor = new AnalysisProcessor(runner);

  it('runs the queued analysis', async () => {
    await processor.process({
      name: 'run-analysis',
      data: { analysisId: 'analysis-1' },
    } as Job<{ analysisId: string }>);

    expect(runner.run).toHaveBeenCalledWith('analysis-1');
  });

  it('rejects unknown jobs', async () => {
    await expect(
      processor.process({ name: 'unknown', data: {} } as Job<{
        analysisId: string;
      }>),
    ).rejects.toThrow('Unsupported analysis job');
  });
});
