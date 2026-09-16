import { ConfigService } from '@nestjs/config';
import { BadGatewayException } from '@nestjs/common';
import { SourceCraftClient } from './sourcecraft.client';

describe('SourceCraftClient', () => {
  const config = {
    get: jest.fn((key: string, fallback?: string) => {
      const values: Record<string, string> = {
        SOURCECRAFT_API_BASE_URL: 'https://api.sourcecraft.tech',
        SOURCECRAFT_TOKEN: 'test-token',
      };
      return values[key] ?? fallback;
    }),
  } as unknown as ConfigService;
  const client = new SourceCraftClient(config);

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('gets a repository using the documented endpoint', async () => {
    const fetchMock = jest.spyOn(global, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ id: 'repo-1', slug: 'demo' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }),
    );

    const repository = await client.getRepository('team', 'demo');

    expect(repository.id).toBe('repo-1');
    expect(fetchMock).toHaveBeenCalledWith(
      new URL('https://api.sourcecraft.tech/repos/team/demo'),
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: 'Bearer test-token',
        }),
      }),
    );
  });

  it('maps non-success responses to a gateway error', async () => {
    jest.spyOn(global, 'fetch').mockResolvedValue(new Response(null, { status: 404 }));

    await expect(client.getRepository('team', 'missing')).rejects.toBeInstanceOf(
      BadGatewayException,
    );
  });
});
