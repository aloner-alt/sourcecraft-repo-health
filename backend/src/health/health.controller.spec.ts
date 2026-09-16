import { HealthController } from './health.controller';

describe('HealthController', () => {
  it('returns the service health', () => {
    const response = new HealthController().getHealth();

    expect(response.status).toBe('ok');
    expect(response.service).toBe('sourcecraft-repo-health-backend');
    expect(Date.parse(response.timestamp)).not.toBeNaN();
  });
});
