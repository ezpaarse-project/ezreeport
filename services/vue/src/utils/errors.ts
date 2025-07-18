export type ErrorHandler = (message: string, err?: unknown) => void;

let errorHandler: ErrorHandler = (message: string, err: unknown) => {
  // oxlint-disable-next-line no-console - Default value for error handling
  console.error(`[ezr-vue] ${message}`, err);
};

export function setErrorHandler(handler: ErrorHandler): void {
  errorHandler = handler;
}

export function handleEzrError(message: string, err?: unknown): void {
  errorHandler(message, err);
}
