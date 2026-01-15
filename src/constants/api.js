// Production backend URL
const PRODUCTION_URL = 'https://clownfish-app-b8ky4.ondigitalocean.app';

// For production deployment, use the deployed backend
export const API_CONFIG = {
  BASE_URL: `${PRODUCTION_URL}/api/v1`,
  WS_URL: `wss://clownfish-app-b8ky4.ondigitalocean.app/ws`,
  TIMEOUT: 15000, // 15 second timeout for production
};

// Only log in development
if (__DEV__) {
  console.log('API Config:', API_CONFIG);
}

export default API_CONFIG;
