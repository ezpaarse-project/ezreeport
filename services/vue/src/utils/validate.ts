// from zod (https://github.com/colinhacks/zod/blob/850871defc2c98928f1c7e8e05e93d4a84ed3c5f/src/types.ts#L660)
const emailRegex = /^(?!\.)(?!.*\.\.)([A-Z0-9_'+\-.]*)[A-Z0-9_+-]@([A-Z0-9][A-Z0-9-]*\.)+[A-Z]{2,}$/i;

// eslint-disable-next-line import/prefer-default-export
export const isEmail = (email: string) => emailRegex.test(email);
