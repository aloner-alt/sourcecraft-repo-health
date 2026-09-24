import {
  BadGatewayException,
  GatewayTimeoutException,
  Injectable,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  SourceCraftCiRunPage,
  SourceCraftIssuePage,
  SourceCraftIssueQuery,
  SourceCraftRepository,
  SourceCraftRepositoryPage,
  SourceCraftTreePage,
  SourceCraftTreeQuery,
  SourceCraftPullRequestPage,
  SourceCraftReleasePage,
} from './sourcecraft.types';

@Injectable()
export class SourceCraftClient {
  private readonly baseUrl: string;

  constructor(private readonly config: ConfigService) {
    this.baseUrl = this.config
      .get<string>('SOURCECRAFT_API_BASE_URL', 'https://api.sourcecraft.tech')
      .replace(/\/$/, '');
  }

  getRepository(
    organizationSlug: string,
    repositorySlug: string,
  ): Promise<SourceCraftRepository> {
    return this.request(
      `/repos/${encodeURIComponent(organizationSlug)}/${encodeURIComponent(repositorySlug)}`,
    );
  }

  listOrganizationRepositories(
    organizationSlug: string,
    pageSize = 100,
    pageToken?: string,
  ): Promise<SourceCraftRepositoryPage> {
    return this.request(`/orgs/${encodeURIComponent(organizationSlug)}/repos`, {
      page_size: String(pageSize),
      ...(pageToken ? { page_token: pageToken } : {}),
    });
  }

  listRepositoryTree(
    organizationSlug: string,
    repositorySlug: string,
    query: SourceCraftTreeQuery = {},
  ): Promise<SourceCraftTreePage> {
    return this.request(
      `/repos/${encodeURIComponent(organizationSlug)}/${encodeURIComponent(repositorySlug)}/trees`,
      {
        page_size: String(query.pageSize ?? 500),
        recursive: String(query.recursive ?? true),
        ...(query.pageToken ? { page_token: query.pageToken } : {}),
        ...(query.path ? { path: query.path } : {}),
        ...(query.revision ? { revision: query.revision } : {}),
      },
    );
  }

  listRepositoryIssues(
    organizationSlug: string,
    repositorySlug: string,
    query: SourceCraftIssueQuery = {},
  ): Promise<SourceCraftIssuePage> {
    return this.request(
      `/repos/${encodeURIComponent(organizationSlug)}/${encodeURIComponent(repositorySlug)}/issues`,
      {
        page_size: String(query.pageSize ?? 100),
        ...(query.pageToken ? { page_token: query.pageToken } : {}),
        ...(query.filter ? { filter: query.filter } : {}),
        ...(query.sortBy ? { sort_by: query.sortBy } : {}),
      },
    );
  }

  listRepositoryCiRuns(
    organizationSlug: string,
    repositorySlug: string,
    pageSize = 100,
    pageToken?: string,
  ): Promise<SourceCraftCiRunPage> {
    return this.request(
      `/repos/${encodeURIComponent(organizationSlug)}/${encodeURIComponent(repositorySlug)}/cicd/runs`,
      {
        page_size: String(pageSize),
        ...(pageToken ? { page_token: pageToken } : {}),
      },
    );
  }

  listRepositoryPullRequests(organizationSlug: string, repositorySlug: string, pageSize = 100, pageToken?: string): Promise<SourceCraftPullRequestPage> {
    return this.request(`/repos/${encodeURIComponent(organizationSlug)}/${encodeURIComponent(repositorySlug)}/pulls`, {
      page_size: String(pageSize), ...(pageToken ? { page_token: pageToken } : {}),
    });
  }

  listRepositoryReleases(organizationSlug: string, repositorySlug: string, pageSize = 100, pageToken?: string): Promise<SourceCraftReleasePage> {
    return this.request(`/repos/${encodeURIComponent(organizationSlug)}/${encodeURIComponent(repositorySlug)}/releases`, {
      page_size: String(pageSize), ...(pageToken ? { page_token: pageToken } : {}),
    });
  }
  private async request<T>(
    path: string,
    query: Record<string, string> = {},
  ): Promise<T> {
    const url = new URL(`${this.baseUrl}${path}`);
    Object.entries(query).forEach(([key, value]) =>
      url.searchParams.set(key, value),
    );

    const token = this.config.get<string>('SOURCECRAFT_TOKEN');

    try {
      const response = await fetch(url, {
        headers: {
          Accept: 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        signal: AbortSignal.timeout(15_000),
      });

      if (!response.ok) {
        throw new BadGatewayException({
          message: `SourceCraft API request failed with status ${response.status} for ${path}.`,
          sourceStatus: response.status,
          path,
        });
      }

      return (await response.json()) as T;
    } catch (error) {
      if (error instanceof BadGatewayException) {
        throw error;
      }
      if (error instanceof DOMException && error.name === 'TimeoutError') {
        throw new GatewayTimeoutException('SourceCraft API request timed out.');
      }
      throw new BadGatewayException('SourceCraft API is unavailable.');
    }
  }
}

