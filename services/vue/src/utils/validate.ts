// From zod (https://github.com/colinhacks/zod/blob/850871defc2c98928f1c7e8e05e93d4a84ed3c5f/src/types.ts#L660)
const emailRegex =
  // oxlint-disable-next-line prefer-named-capture-group require-unicode-regexp
  /^(?!\.)(?!.*\.\.)([A-Z0-9_'+\-.]*)[A-Z0-9_+-]@([A-Z0-9][A-Z0-9-]*\.)+[A-Z]{2,}$/i;

export const isEmail = (email: string): boolean => emailRegex.test(email);
