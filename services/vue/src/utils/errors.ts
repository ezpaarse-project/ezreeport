export type ErrorHandler = (message: string, err?: unknown) => void;

let errorHandler: ErrorHandler = (message: string, err: unknown) => {
  // eslint-disable-next-line no-console
  console.error(`[ezr-vue] ${message}`, err);
};

export function setErrorHandler(handler: ErrorHandler) {
  errorHandler = handler;
}

export function handleEzrError(message: string, err?: unknown) {
  errorHandler(message, err);
}
