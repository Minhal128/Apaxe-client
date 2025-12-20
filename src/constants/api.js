// Your computer's WiFi IP address (from ipconfig)
const LOCAL_IP = '192.168.1.5';

// For physical devices, always use the local IP
// 10.0.2.2 only works in Android Emulator, localhost only in iOS Simulator
export const API_CONFIG = {
  BASE_URL: `http://${LOCAL_IP}:5000/api/v1`,
  WS_URL: `ws://${LOCAL_IP}:5001/ws`,
};

console.log('API Config:', API_CONFIG);

export default API_CONFIG;
