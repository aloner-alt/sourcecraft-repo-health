import { Injectable } from '@nestjs/common';
import { SourceCraftClient } from '../sourcecraft/sourcecraft.client';
import { SourceCraftTreeEntry } from '../sourcecraft/sourcecraft.types';

@Injectable()
export class RepositoryTreeProvider {
  private readonly cache = new Map<
    string,
    { expiresAt: number; value: Promise<SourceCraftTreeEntry[]> }
  >();

  constructor(private readonly sourceCraft: SourceCraftClient) {}

  get(org: string, repo: string): Promise<SourceCraftTreeEntry[]> {
    const key = `${org}/${repo}`;
    const cached = this.cache.get(key);
    if (cached && cached.expiresAt > Date.now()) return cached.value;

    const value = this.load(org, repo).catch((error) => {
      this.cache.delete(key);
      throw error;
    });
    this.cache.set(key, { expiresAt: Date.now() + 30_000, value });
    return value;
  }

  private async load(org: string, repo: string): Promise<SourceCraftTreeEntry[]> {
    const entries: SourceCraftTreeEntry[] = [];
    let token: string | undefined;
    for (let page = 0; page < 100; page += 1) {
      const result = await this.sourceCraft.listRepositoryTree(org, repo, {
        pageSize: 500,
        pageToken: token,
        recursive: true,
      });
      entries.push(...result.trees);
      token = result.next_page_token;
      if (!token) return entries;
    }
    throw new Error('SourceCraft repository tree exceeded 100 pages.');
  }
}
