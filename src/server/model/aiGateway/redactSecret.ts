export function redactSecret(value: string, secret: string): string {
  return secret ? value.split(secret).join('[REDACTED]') : value;
}
