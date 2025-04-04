import config from 'config';

export default function setupConfig<T>() {
  return config as unknown as T;
}
