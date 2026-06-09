// Validates production environment keys at runtime before mounting the app
const config = {
  airtableBaseId: import.meta.env.VITE_AIRTABLE_BASE_ID,
  apiEndpoint: import.meta.env.VITE_BASE44_API_URL || 'https://api.vellera.app',
};

// Fail fast if the build configuration is broken
if (!config.airtableBaseId && import.meta.env.PROD) {
  console.error("CRITICAL: Production Environment variables are missing!");
}

export default config;