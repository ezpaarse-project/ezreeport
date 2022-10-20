export const sleep = (duration: number) => new Promise<void>((resolve) => {
  setTimeout(resolve, duration);
});

export const stringToB64 = (
  str: string,
  encoding: 'base64' | 'base64url' = 'base64',
) => Buffer.from(str).toString(encoding);

export const b64ToString = (
  b64: string,
  encoding: 'base64' | 'base64url' = 'base64',
) => Buffer.from(b64, encoding).toString();
