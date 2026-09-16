export type SourceCraftOrganizationRef = {
  id: string;
  slug: string;
};

export type SourceCraftRepository = {
  id: string;
  name: string;
  slug: string;
  description?: string;
  default_branch: string;
  organization: SourceCraftOrganizationRef;
  visibility: 'public' | 'internal' | 'private';
  web_url: string;
  last_updated?: string;
  language?: {
    name: string;
    color?: string;
  };
  counters?: {
    forks?: string;
    pull_requests?: string;
    issues?: string;
    tags?: string;
    branches?: string;
  };
};

export type SourceCraftRepositoryPage = {
  repositories: SourceCraftRepository[];
  next_page_token?: string;
};

export type SourceCraftTreeEntry = {
  name: string;
  path: string;
  type: 'file' | 'executable' | 'dir' | 'symlink' | 'submodule';
};

export type SourceCraftTreePage = {
  trees: SourceCraftTreeEntry[];
  next_page_token?: string;
};

export type SourceCraftTreeQuery = {
  pageSize?: number;
  pageToken?: string;
  path?: string;
  recursive?: boolean;
  revision?: string;
};

export type SourceCraftIssue = {
  id: string;
  slug: string;
  title: string;
  description?: string;
  created_at: string;
  updated_at: string;
  completed_at?: string;
  status?: {
    id: string;
    slug: string;
    name: string;
    status_type?: string;
  };
};

export type SourceCraftIssuePage = {
  issues: SourceCraftIssue[];
  next_page_token?: string;
};

export type SourceCraftIssueQuery = {
  pageSize?: number;
  pageToken?: string;
  filter?: string;
  sortBy?: string;
};
