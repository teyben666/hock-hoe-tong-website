/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_CLINIC_PHONE?: string;
  readonly VITE_API_URL?: string;
  readonly VITE_WHATSAPP_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
