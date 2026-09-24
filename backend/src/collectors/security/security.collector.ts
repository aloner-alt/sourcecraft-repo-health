import { Injectable, Optional } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DataStatus } from '@prisma/client';

type AppSecFinding = { id?: string; severity?: string; status?: string; scanner?: string; type?: string };
export type SecurityCollectionResult = {
  score: number | null;
  status: DataStatus;
  summary: string;
  metrics: Array<{ key: string; rawValue: Record<string, unknown>; normalizedScore: number | null; weight: number; status: DataStatus; source: string; explanation: string }>;
};

@Injectable()
export class SecurityCollector {
  constructor(@Optional() private readonly config?: ConfigService) {}

  async collect(_org: string, _repo: string): Promise<SecurityCollectionResult> {
    const endpoint = this.config?.get<string>('SOURCECRAFT_APPSEC_ENDPOINT');
    if (!endpoint) return this.noData();
    const token = this.config?.get<string>('SOURCECRAFT_TOKEN');
    try {
      const response = await fetch(endpoint, { headers: { Accept: 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) }, signal: AbortSignal.timeout(15_000) });
      if (response.status === 401 || response.status === 403) return { score: null, status: DataStatus.PERMISSION_DENIED, summary: 'SourceCraft AppSec access was denied; security was not scored.', metrics: [] };
      if (!response.ok) return { score: null, status: DataStatus.COLLECTION_ERROR, summary: `SourceCraft AppSec returned HTTP ${response.status}; security was not scored.`, metrics: [] };
      const body = await response.json() as { findings?: AppSecFinding[] };
      if (!Array.isArray(body.findings)) return { score: null, status: DataStatus.COLLECTION_ERROR, summary: 'SourceCraft AppSec response has no validated findings array; security was not scored.', metrics: [] };
      const findings = body.findings.filter((f) => f && typeof f === 'object');
      const unresolved = findings.filter((f) => !['fixed', 'resolved', 'closed', 'remediated'].includes((f.status ?? '').toLowerCase()));
      const penalty = unresolved.reduce((sum, f) => sum + ({ critical: 40, high: 20, medium: 8, low: 2 }[(f.severity ?? '').toLowerCase()] ?? 0), 0);
      const score = Math.max(0, Math.min(100, 100 - penalty));
      return { score, status: DataStatus.AVAILABLE, summary: `${findings.length} confirmed SourceCraft AppSec findings collected; ${unresolved.length} unresolved.`, metrics: [{ key: 'appsec_findings', rawValue: { total: findings.length, unresolved: unresolved.length, bySeverity: this.countSeverities(unresolved) }, normalizedScore: score, weight: 1, status: DataStatus.AVAILABLE, source: 'sourcecraft.appsec.findings', explanation: 'Score uses only validated findings returned by the configured SourceCraft AppSec endpoint; unresolved penalties: critical 40, high 20, medium 8, low 2.' }] };
    } catch (error) {
      return { score: null, status: DataStatus.COLLECTION_ERROR, summary: `SourceCraft AppSec collection failed: ${error instanceof Error ? error.message : 'unknown error'}`, metrics: [] };
    }
  }
  private countSeverities(findings: AppSecFinding[]) { return findings.reduce<Record<string, number>>((result, finding) => { const key = (finding.severity ?? 'unknown').toLowerCase(); result[key] = (result[key] ?? 0) + 1; return result; }, {}); }
  private noData(): SecurityCollectionResult { return { score: null, status: DataStatus.NO_DATA, summary: 'AppSec SourceCraft endpoint is not configured; security was not scored and no vulnerability claim was made.', metrics: [] }; }
}
