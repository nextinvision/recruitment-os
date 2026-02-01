export const SUPPORTED_PLATFORMS = ['linkedin', 'indeed', 'naukri'];
export const PLATFORM_DOMAINS = {
    linkedin: ['www.linkedin.com', 'linkedin.com'],
    indeed: ['www.indeed.com', 'indeed.com'],
    naukri: ['www.naukri.com', 'naukri.com'],
};
export const STORAGE_KEYS = {
    TOKEN: 'auth_token',
    USER: 'user_data',
    STAGING_JOBS: 'staging_jobs',
};
export const API_ENDPOINTS = {
    LOGIN: '/api/auth/login',
    BULK_JOBS: '/api/jobs/bulk',
};
export function getBackendUrl() {
    // Default to localhost for development
    // In production, update this to your production backend URL
    // You can also store this in chrome.storage for user configuration
    return 'http://localhost:3000';
}
export function getApiUrl(endpoint) {
    const baseUrl = getBackendUrl();
    return `${baseUrl}${endpoint}`;
}
