import { defineConfig } from 'tsup';

import viteConfig from './vite.config.mts';

export default defineConfig({
  dts: { only: true },
  outDir: 'dist',
  entry: viteConfig.build!.lib
    ? viteConfig.build!.lib.entry as Record<string, string>
    : {},
});
