export type Timeout = {
  duration: number;
  start: () => void;
  stop: () => void;
  reset: () => void;
};

export function setIdleTimeout(
  onIdle: () => void,
  autoStart = true,
  duration = 15_000
): Timeout {
  let timeout: NodeJS.Timeout;

  const timer = {
    duration,
    reset: (): void => {
      timer.stop();
      timer.start();
    },
    start: (): void => {
      timeout = setTimeout(onIdle, duration);
    },
    stop: (): void => {
      clearTimeout(timeout);
    },
  };

  if (autoStart) {
    timer.start();
  }

  return timer;
}
