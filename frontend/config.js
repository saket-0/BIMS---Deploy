// This file holds the single source of truth for configuration.

//
// --- !!! IMPORTANT !!! ---
//
// You must change this URL in Step 5 of the deployment guide.
// It must be the URL of your live Render backend
// (e.g., https://bims-backend.onrender.com)
//
// const API_BASE_URL = 'https://bims-backend-cxl8.onrender.com';
//
// --- !!! IMPORTANT !!! ---
//


window.APP_CONFIG = {
    API_BASE_URL: 'https://bims-backend-cxl8.onrender.com',
    // Add other configuration here as needed
    VERSION: '1.0.0',
    ENVIRONMENT: 'production'
};

// For backward compatibility, also expose API_BASE_URL directly
window.API_BASE_URL = window.APP_CONFIG.API_BASE_URL;

// Freeze the config to prevent accidental modifications
Object.freeze(window.APP_CONFIG);

// Log configuration on load (remove in production if desired)
console.log('✅ BIMS Configuration loaded:', {
    API_BASE_URL: window.APP_CONFIG.API_BASE_URL,
    VERSION: window.APP_CONFIG.VERSION
});