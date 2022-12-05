/**
 * Async version of `setTimeout`
 *
 * @param ms Time to wait
 */
export const setTimeoutAsync = (ms: number) => new Promise(
  (resolve) => { setTimeout(resolve, ms); },
);
