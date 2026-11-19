/**
 * Run `call` with a signal that aborts after `ms`, and reject at that moment.
 * A call that honours the signal is cancelled; one that ignores it is still
 * abandoned on time, so no caller ever waits on a hung dependency.
 */
export async function withTimeout<T>(
  call: (signal: AbortSignal) => Promise<T>,
  ms: number,
): Promise<T> {
  const controller = new AbortController();
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => {
      const err = new DOMException(`call exceeded ${ms}ms`, 'TimeoutError');
      controller.abort(err);
      reject(err);
    }, ms);
  });
  try {
    return await Promise.race([call(controller.signal), timeout]);
  } finally {
    clearTimeout(timer);
  }
}
