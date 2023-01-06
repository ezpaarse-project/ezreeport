/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_EZMESURE_TOKEN: string
  readonly VITE_REPORT_API: string
  // more env variables...
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
