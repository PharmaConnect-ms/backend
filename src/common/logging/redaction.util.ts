const SENSITIVE_KEYS = new Set([
  'password',
  'token',
  'access_token',
  'refresh_token',
  'authorization',
  'api_key',
  'apikey',
  'secret',
  'usersummary',
  'summary',
  'details',
  'instructions',
  'allergies',
  'prescription',
  'prescriptionimage',
]);

function isSensitiveKey(key: string): boolean {
  const normalized = key.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
  return SENSITIVE_KEYS.has(normalized);
}

export function redactSensitive(value: unknown): unknown {
  if (value === null || value === undefined) {
    return value;
  }

  if (Array.isArray(value)) {
    return value.map((item) => redactSensitive(item));
  }

  if (typeof value === 'object') {
    const input = value as Record<string, unknown>;
    const output: Record<string, unknown> = {};

    for (const [key, nestedValue] of Object.entries(input)) {
      if (isSensitiveKey(key)) {
        output[key] = '[REDACTED]';
      } else {
        output[key] = redactSensitive(nestedValue);
      }
    }

    return output;
  }

  if (typeof value === 'string') {
    if (value.startsWith('Bearer ')) {
      return '[REDACTED]';
    }

    if (value.length > 2000) {
      return `${value.slice(0, 120)}...[TRUNCATED]`;
    }
  }

  return value;
}
