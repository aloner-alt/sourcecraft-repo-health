import { SecurityCollector } from './security.collector';
import { DataStatus } from '@prisma/client';

describe('SecurityCollector', () => {
  it('returns NO_DATA when no confirmed AppSec endpoint is configured', async () => {
    await expect(new SecurityCollector().collect('team', 'demo')).resolves.toMatchObject({ score: null, status: DataStatus.NO_DATA, metrics: [] });
  });
  it('maps only validated AppSec findings and unresolved severity', async () => {
    const original = global.fetch;
    global.fetch = jest.fn().mockResolvedValue(new Response(JSON.stringify({ findings: [{ id: '1', severity: 'critical', status: 'open' }, { id: '2', severity: 'low', status: 'fixed' }] }), { status: 200, headers: { 'content-type': 'application/json' } })) as any;
    const config = { get: jest.fn((key: string) => key === 'SOURCECRAFT_APPSEC_ENDPOINT' ? 'https://appsec.example/findings' : 'token') } as any;
    await expect(new SecurityCollector(config).collect('team', 'demo')).resolves.toMatchObject({ score: 60, status: DataStatus.AVAILABLE });
    global.fetch = original;
  });
  it('does not score malformed AppSec responses', async () => {
    const original = global.fetch;
    global.fetch = jest.fn().mockResolvedValue(new Response('{}', { status: 200 })) as any;
    const config = { get: jest.fn().mockReturnValue('https://appsec.example/findings') } as any;
    await expect(new SecurityCollector(config).collect('team', 'demo')).resolves.toMatchObject({ score: null, status: DataStatus.COLLECTION_ERROR });
    global.fetch = original;
  });
});
