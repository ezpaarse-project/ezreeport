// eslint-disable-next-line import/prefer-default-export
export function setIdleTimeout(
  onIdle: () => void,
  autoStart = true,
  duration = 15000,
) {
  let timeout: NodeJS.Timeout;

  const timer = {
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
