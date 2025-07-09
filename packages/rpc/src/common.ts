export function setIdleTimeout(
  onIdle: () => void,
  autoStart = true,
  duration = 15000,
) {
  let timeout: NodeJS.Timeout;

  const timer = {
    duration,
    start: () => {
      timeout = setTimeout(onIdle, duration);
    },
    stop: () => {
      clearTimeout(timeout);
    },
    reset: () => {
      timer.stop();
      timer.start();
    },
  };

  if (autoStart) {
    timer.start();
  }

  return timer;
}
