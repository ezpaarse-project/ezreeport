import { prepareClient } from '~sdk';

export default function setupEzR() {
  prepareClient(
    import.meta.env.VITE_EZR_API,
    { token: import.meta.env.VITE_EZR_TOKEN },
  );
}
