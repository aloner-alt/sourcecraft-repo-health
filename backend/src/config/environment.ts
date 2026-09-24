const REQUIRED_SECRET_LENGTH = 32;
const JWT_SECRET_PLACEHOLDER = 'replace-with-at-least-32-random-characters';

type Environment = Record<string, unknown>;

function optionalString(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

function requiredString(config: Environment, name: string): string {
  const value = optionalString(config[name]);
  if (!value) throw new Error(`${name} is required`);
  config[name] = value;
  return value;
}

function parsePort(config: Environment, name: string, fallback: number): void {
  const raw = optionalString(config[name]);
  const value = raw === undefined ? fallback : Number(raw);
  if (!Number.isInteger(value) || value < 1 || value > 65_535) {
    throw new Error(`${name} must be an integer between 1 and 65535`);
  }
  config[name] = value;
}

function parsePositiveInteger(
  config: Environment,
  name: string,
  fallback: number,
): void {
  const raw = optionalString(config[name]);
  const value = raw === undefined ? fallback : Number(raw);
  if (!Number.isInteger(value) || value < 1) {
    throw new Error(`${name} must be a positive integer`);
  }
  config[name] = value;
}

function validateUrl(
  config: Environment,
  name: string,
  options: { required?: boolean; protocols?: string[] } = {},
): void {
  const value = options.required
    ? requiredString(config, name)
    : optionalString(config[name]);
  if (!value) return;

  let url: URL;
  try {
    url = new URL(value);
  } catch {
    throw new Error(`${name} must be a valid URL`);
  }

  if (options.protocols && !options.protocols.includes(url.protocol)) {
    throw new Error(
      `${name} must use one of these protocols: ${options.protocols.join(', ')}`,
    );
  }
  config[name] = value;
}

export function validateEnvironment(input: Environment): Environment {
  const config = { ...input };
  const nodeEnv = optionalString(config.NODE_ENV) ?? 'development';
  if (!['development', 'test', 'production'].includes(nodeEnv)) {
    throw new Error('NODE_ENV must be development, test, or production');
  }
  config.NODE_ENV = nodeEnv;

  parsePort(config, 'PORT', 3000);
  parsePort(config, 'REDIS_PORT', 6379);
  parsePositiveInteger(config, 'ANALYSIS_INTERVAL_HOURS', 24);
  parsePositiveInteger(config, 'SOURCECRAFT_CATALOG_MAX_PAGES', 100);
  const scheduleEnabled = optionalString(config.SCHEDULE_ENABLED) ?? 'true';
  if (!['true', 'false'].includes(scheduleEnabled)) {
    throw new Error('SCHEDULE_ENABLED must be true or false');
  }
  config.SCHEDULE_ENABLED = scheduleEnabled;
  config.REDIS_HOST = optionalString(config.REDIS_HOST) ?? 'localhost';
  config.FRONTEND_URL =
    optionalString(config.FRONTEND_URL) ?? 'http://localhost:3001';
  config.SOURCECRAFT_API_BASE_URL =
    optionalString(config.SOURCECRAFT_API_BASE_URL) ??
    'https://api.sourcecraft.tech';
  config.SOURCECRAFT_CLI_PATH = optionalString(config.SOURCECRAFT_CLI_PATH);

  validateUrl(config, 'DATABASE_URL', {
    required: true,
    protocols: ['postgresql:', 'postgres:'],
  });
  validateUrl(config, 'FRONTEND_URL', { protocols: ['http:', 'https:'] });
  validateUrl(config, 'SOURCECRAFT_API_BASE_URL', {
    protocols: ['http:', 'https:'],
  });
  validateUrl(config, 'YANDEX_CALLBACK_URL', {
    protocols: ['http:', 'https:'],
  });

  const jwtSecret = requiredString(config, 'AUTH_JWT_SECRET');
  if (
    jwtSecret.length < REQUIRED_SECRET_LENGTH ||
    jwtSecret === JWT_SECRET_PLACEHOLDER
  ) {
    throw new Error(
      `AUTH_JWT_SECRET must be a random secret of at least ${REQUIRED_SECRET_LENGTH} characters`,
    );
  }

  const yandexClientId = optionalString(config.YANDEX_CLIENT_ID);
  const yandexClientSecret = optionalString(config.YANDEX_CLIENT_SECRET);
  if (
    (yandexClientId && !yandexClientSecret) ||
    (!yandexClientId && yandexClientSecret)
  ) {
    throw new Error(
      'YANDEX_CLIENT_ID and YANDEX_CLIENT_SECRET must be configured together',
    );
  }
  if (yandexClientId && yandexClientSecret) {
    requiredString(config, 'YANDEX_CALLBACK_URL');
    config.YANDEX_CLIENT_ID = yandexClientId;
    config.YANDEX_CLIENT_SECRET = yandexClientSecret;
  }

  return config;
}
