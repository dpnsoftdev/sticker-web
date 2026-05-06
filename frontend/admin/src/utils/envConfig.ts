export const envConfig = {
  apiBaseUrl: import.meta.env.VITE_API_URL,
  appEnv: import.meta.env.MODE,
  assetBaseUrl:
    import.meta.env.VITE_MODE === "development" &&
    !import.meta.env.VITE_USE_PRODUCTION_ENV
      ? import.meta.env.VITE_ASSET_BASE_URL_DEV
      : import.meta.env.VITE_ASSET_BASE_URL,
};
