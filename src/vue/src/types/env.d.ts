/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_AUTH_TOKEN: string
  readonly VITE_REPORT_API: string
  readonly VITE_LOGO_URL: string
  // more env variables...
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
