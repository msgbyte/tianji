interface UserAgentData {
  platform: string;
  getHighEntropyValues(hints: string[]): Promise<{ platformVersion?: string }>;
}

export async function getBrowserOSVersion(): Promise<string | undefined> {
  if (typeof navigator === 'undefined') return;
  const data = (navigator as Navigator & { userAgentData?: UserAgentData })
    .userAgentData;
  if (!data?.getHighEntropyValues) return;

  let timeout: ReturnType<typeof setTimeout> | undefined;
  try {
    // Client hints must not indefinitely delay event delivery.
    const hints = await Promise.race([
      data.getHighEntropyValues(['platformVersion']),
      new Promise<undefined>((resolve) => {
        timeout = setTimeout(() => resolve(undefined), 200);
      }),
    ]);
    const version = hints?.platformVersion;
    if (!version || version.length > 20 || !/^\d+(\.\d+)*$/.test(version))
      return;

    if (data.platform === 'Windows') {
      // Windows reports a Universal API Contract version, not its product version.
      const major = Number(version.split('.')[0]);
      return major >= 13 ? '11' : major > 0 ? '10' : undefined;
    }
    if (['Android', 'macOS', 'Chrome OS'].includes(data.platform)) {
      return version;
    }
  } catch {
    // High entropy hints can be denied by browser policy.
  } finally {
    clearTimeout(timeout);
  }
}
