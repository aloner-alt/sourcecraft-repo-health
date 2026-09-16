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
