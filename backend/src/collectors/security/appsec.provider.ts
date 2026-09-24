import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

const execFileAsync = promisify(execFile);

export type AppSecSeverity = 'critical' | 'high' | 'medium' | 'low' | 'info';

export type AppSecFinding = {
  id: string;
  title: string;
  severity: AppSecSeverity;
  status: string;
  fixed: boolean;
  scanner: string;
  url?: string;
};

@Injectable()
export class AppSecProvider {
  constructor(private readonly config: ConfigService) {}

  isConfigured(): boolean {
    return Boolean(this.config.get<string>('SOURCECRAFT_CLI_PATH')?.trim());
  }

  async listFindings(org: string, repo: string): Promise<AppSecFinding[]> {
    const executable = this.config.get<string>('SOURCECRAFT_CLI_PATH')?.trim();
    if (!executable) return [];

    const { stdout } = await execFileAsync(
      executable,
      [
        'appsec',
        'defect',
        'list',
        '-R',
        `${org}/${repo}`,
        '--limit',
        '1000',
        '--json',
      ],
      {
        timeout: 30_000,
        windowsHide: true,
        maxBuffer: 10 * 1024 * 1024,
      },
    );
    return normalizeAppSecFindings(JSON.parse(stdout) as unknown);
  }
}

export function normalizeAppSecFindings(payload: unknown): AppSecFinding[] {
  const rows = findRows(payload);
  return rows.map((row, index) => {
    const severity = normalizeSeverity(
      readString(row, ['severity', 'risk.severity', 'criticality', 'level']),
    );
    const status =
      readString(row, ['status', 'state', 'resolution.status']) ?? 'open';
    const normalizedStatus = status.toLowerCase().replaceAll('-', '_');
    const fixed = [
      'fixed',
      'resolved',
      'closed',
      'dismissed',
      'accepted_risk',
      'false_positive',
    ].includes(normalizedStatus);

    return {
      id:
        readString(row, ['id', 'slug', 'number', 'defect_id']) ??
        `finding-${index + 1}`,
      title:
        readString(row, ['title', 'name', 'message', 'description']) ??
        `AppSec finding ${index + 1}`,
      severity,
      status,
      fixed,
      scanner:
        readString(row, [
          'scanner',
          'scanner_type',
          'scan_type',
          'type',
          'category',
          'detector.type',
        ]) ?? 'unknown',
      ...(readString(row, ['web_url', 'url', 'link'])
        ? { url: readString(row, ['web_url', 'url', 'link']) }
        : {}),
    };
  });
}

function findRows(payload: unknown): Record<string, unknown>[] {
  if (Array.isArray(payload)) return payload.filter(isRecord);
  if (!isRecord(payload)) return [];
  for (const key of ['findings', 'defects', 'defect_groups', 'items', 'results']) {
    const value = payload[key];
    if (Array.isArray(value)) return value.filter(isRecord);
  }
  return [];
}

function readString(
  row: Record<string, unknown>,
  paths: string[],
): string | undefined {
  for (const path of paths) {
    let value: unknown = row;
    for (const part of path.split('.')) {
      value = isRecord(value) ? value[part] : undefined;
    }
    if (typeof value === 'string' && value.trim()) return value.trim();
    if (typeof value === 'number') return String(value);
  }
  return undefined;
}

function normalizeSeverity(value?: string): AppSecSeverity {
  const normalized = value?.toLowerCase();
  if (normalized?.includes('critical') || normalized === 'blocker') {
    return 'critical';
  }
  if (normalized?.includes('high')) return 'high';
  if (normalized?.includes('medium') || normalized === 'moderate') {
    return 'medium';
  }
  if (normalized?.includes('low') || normalized === 'minor') return 'low';
  return 'info';
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
