export type Timeout = {
  duration: number;
  start: () => void;
  stop: () => void;
  reset: () => void;
};

export function setIdleTimeout(
  onIdle: () => void,
  autoStart = true,
  duration = 15000
): Timeout {
  let timeout: NodeJS.Timeout;

  const timer = {
    duration,
    start: (): void => {
      timeout = setTimeout(onIdle, duration);
    },
    stop: (): void => {
      clearTimeout(timeout);
    },
    reset: (): void => {
      timer.stop();
      timer.start();
    },
  };

  if (autoStart) {
    timer.start();
  }

  return timer;
}
