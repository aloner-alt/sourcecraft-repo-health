import { normalizeAppSecFindings } from './appsec.provider';

describe('normalizeAppSecFindings', () => {
  it('normalizes SourceCraft CLI arrays without inventing findings', () => {
    expect(
      normalizeAppSecFindings([
        {
          slug: 17,
          title: 'Unsafe dependency',
          severity: 'HIGH',
          status: 'resolved',
          scanner_type: 'SCA',
          web_url: 'https://sourcecraft.dev/example/17',
        },
      ]),
    ).toEqual([
      {
        id: '17',
        title: 'Unsafe dependency',
        severity: 'high',
        status: 'resolved',
        fixed: true,
        scanner: 'SCA',
        url: 'https://sourcecraft.dev/example/17',
      },
    ]);
  });

  it('accepts an enveloped defect-groups response', () => {
    expect(
      normalizeAppSecFindings({
        defect_groups: [
          {
            id: 'secret-1',
            name: 'Leaked credential',
            risk: { severity: 'critical' },
            state: 'open',
            category: 'secret scanning',
          },
        ],
      }),
    ).toEqual([
      expect.objectContaining({
        id: 'secret-1',
        severity: 'critical',
        fixed: false,
        scanner: 'secret scanning',
      }),
    ]);
  });
});
