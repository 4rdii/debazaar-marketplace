/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL: string;
  readonly VITE_APP_NAME: string;
  readonly VITE_APP_LOGO: string;
  readonly VITE_BLOCKCHAIN_NETWORK: string;
  readonly VITE_ARBITRUM_SEPOLIA_CHAIN_ID: string;
  readonly VITE_ARBITRUM_ONE_CHAIN_ID: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

interface Window {
  ethereum?: any;
}
