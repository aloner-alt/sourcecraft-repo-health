import { Job } from 'bullmq';
import { AnalysisRunnerService } from './analysis-runner.service';
import { AnalysisProcessor } from './analysis.processor';
import { AnalysisQueueService } from './analysis-queue.service';

describe('AnalysisProcessor', () => {
  const runner = { run: jest.fn() } as unknown as AnalysisRunnerService;
  const queue = { runScheduledSweep: jest.fn() } as unknown as AnalysisQueueService;
  const processor = new AnalysisProcessor(runner, queue);

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

  it('runs the periodic repository sweep', async () => {
    await processor.process({
      name: 'scheduled-analysis-sweep',
      data: {},
    } as Job<{ analysisId: string }>);
    expect(queue.runScheduledSweep).toHaveBeenCalled();
  });
});
