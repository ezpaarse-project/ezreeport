import { prepareClient } from '~sdk';

export function setupEzR(): void {
  prepareClient(import.meta.env.VITE_EZR_API, {
    token: import.meta.env.VITE_EZR_TOKEN,
  });
}
