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

export type SourceCraftCiRunStatus =
  | 'created'
  | 'prepared'
  | 'processing'
  | 'success'
  | 'failed'
  | 'canceled'
  | 'timeout'
  | 'skipped'
  | 'awaiting_approval'
  | 'rejected';

export type SourceCraftCiRun = {
  id: string;
  slug: string;
  status: SourceCraftCiRunStatus;
  dates: {
    created_at: string;
    started_at?: string;
    finished_at?: string;
    updated_at: string;
  };
  event_type?: 'push' | 'pr_update' | 'manual' | 'restart' | 'schedule';
  error_messages?: string[];
};

export type SourceCraftCiRunPage = {
  runs: SourceCraftCiRun[];
  next_page_token?: string;
};

export type SourceCraftPullRequest = {
  id: string;
  status?: 'draft' | 'open' | 'discarded' | 'merging' | 'merged';
  created_at?: string;
  updated_at?: string;
  merged_at?: string;
};

export type SourceCraftPullRequestPage = {
  pull_requests?: SourceCraftPullRequest[];
  pulls?: SourceCraftPullRequest[];
  next_page_token?: string;
};

export type SourceCraftRelease = {
  id: string;
  status?: 'draft' | 'published' | 'discarded';
  released_at?: string;
  created_at?: string;
  updated_at?: string;
};

export type SourceCraftReleasePage = {
  releases?: SourceCraftRelease[];
  next_page_token?: string;
};
