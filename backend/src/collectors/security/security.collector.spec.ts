import { SecurityCollector } from './security.collector';
import { AppSecProvider } from './appsec.provider';

describe('SecurityCollector', () => {
  const appSec = {
    isConfigured: jest.fn(),
    listFindings: jest.fn(),
  } as unknown as AppSecProvider;
  const collector = new SecurityCollector(appSec);

  it('excludes Security when real SourceCraft AppSec data is unavailable', async () => {
    (appSec.isConfigured as jest.Mock).mockReturnValue(false);

    await expect(collector.collect('team', 'demo')).resolves.toMatchObject({
      score: null,
      status: 'NO_DATA',
      metrics: [],
      summary: expect.stringContaining('instead of being simulated'),
    });
  });

  it('scores real SourceCraft AppSec findings by severity and remediation', async () => {
    (appSec.isConfigured as jest.Mock).mockReturnValue(true);
    (appSec.listFindings as jest.Mock).mockResolvedValue([
      { id: '1', title: 'Injection', severity: 'critical', status: 'open', fixed: false, scanner: 'SAST' },
      { id: '2', title: 'Old package', severity: 'high', status: 'fixed', fixed: true, scanner: 'SCA' },
    ]);

    await expect(collector.collect('team', 'demo')).resolves.toMatchObject({
      score: 70,
      status: 'AVAILABLE',
      summary: expect.stringContaining('2 real SourceCraft AppSec findings'),
      metrics: expect.arrayContaining([
        expect.objectContaining({ key: 'open_critical_findings', normalizedScore: 50 }),
        expect.objectContaining({ key: 'remediation_rate', normalizedScore: 50 }),
      ]),
    });
  });

  it('distinguishes AppSec permission denial from a bad security score', async () => {
    (appSec.isConfigured as jest.Mock).mockReturnValue(true);
    (appSec.listFindings as jest.Mock).mockRejectedValue({
      stderr: 'Insufficient permissions for repository',
    });

    await expect(collector.collect('team', 'demo')).resolves.toMatchObject({
      score: null,
      status: 'PERMISSION_DENIED',
      metrics: [],
    });
  });
});
