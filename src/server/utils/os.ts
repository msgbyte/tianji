export function getOSVersion(userAgent: string): string | undefined {
  const ios = /(?:CPU iPhone OS|CPU OS) (\d+(?:_\d+)*)/.exec(userAgent);
  if (ios) return ios[1].replaceAll('_', '.').slice(0, 20);

  // Reduced Chromium UAs freeze Android at 10 and Windows at NT 10.0.
  if (!/Android 10; K[;)]/.test(userAgent)) {
    const android = /Android (\d+(?:\.\d+)*)/.exec(userAgent);
    if (android) return android[1].slice(0, 20);
  }
  // macOS UAs also freeze at 10_15_7; use client hints for desktop versions.
}

export function formatOSVersion(
  os: string | null,
  version: string | null
): string {
  const name = version && os?.startsWith('Windows') ? 'Windows' : os;
  return `${name || 'Unknown'} ${version || '(Unknown)'}`;
}
