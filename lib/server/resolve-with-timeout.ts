type ResolveWithTimeoutOptions<T> = {
  timeoutMs: number;
  fallback: T;
};

export async function resolveWithTimeout<T>(
  promise: Promise<T>,
  options: ResolveWithTimeoutOptions<T>,
): Promise<T> {
  let timeoutId: ReturnType<typeof setTimeout> | undefined;

  try {
    return await Promise.race([
      promise,
      new Promise<T>((resolve) => {
        timeoutId = setTimeout(() => resolve(options.fallback), options.timeoutMs);
      }),
    ]);
  } catch {
    return options.fallback;
  } finally {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
  }
}
