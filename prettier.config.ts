import type { Config } from 'prettier';
// oxlint-disable-next-line no-namespace
import * as prettierPluginOxc from '@prettier/plugin-oxc';

const config: Config = {
  plugins: [prettierPluginOxc],

  trailingComma: 'es5',
  tabWidth: 2,
  semi: true,
  singleQuote: true,
};

// oxlint-disable-next-line no-default-export
export default config;
