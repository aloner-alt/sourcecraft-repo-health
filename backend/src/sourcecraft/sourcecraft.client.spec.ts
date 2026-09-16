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

  it('lists a repository tree recursively', async () => {
    const fetchMock = jest.spyOn(global, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ trees: [], next_page_token: 'next' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }),
    );

    const page = await client.listRepositoryTree('team', 'demo', {
      pageSize: 250,
      pageToken: 'cursor',
      revision: 'main',
    });

    expect(page.next_page_token).toBe('next');
    expect(fetchMock.mock.calls[0][0].toString()).toBe(
      'https://api.sourcecraft.tech/repos/team/demo/trees?page_size=250&recursive=true&page_token=cursor&revision=main',
    );
  });

  it('lists repository issues with pagination', async () => {
    const fetchMock = jest.spyOn(global, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ issues: [] }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }),
    );

    await client.listRepositoryIssues('team', 'demo', {
      pageSize: 50,
      pageToken: 'cursor',
    });

    expect(fetchMock.mock.calls[0][0].toString()).toBe(
      'https://api.sourcecraft.tech/repos/team/demo/issues?page_size=50&page_token=cursor',
    );
  });

  it('lists CI runs using the documented endpoint', async () => {
    const fetchMock = jest.spyOn(global, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ runs: [] }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }),
    );

    await client.listRepositoryCiRuns('team', 'demo', 50, 'cursor');

    expect(fetchMock.mock.calls[0][0].toString()).toBe(
      'https://api.sourcecraft.tech/repos/team/demo/cicd/runs?page_size=50&page_token=cursor',
    );
  });
});
