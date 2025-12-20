import api from './api';

const positionService = {
  async getPositions(params = {}) {
    const query = new URLSearchParams(params).toString();
    const response = await api.get(`/positions${query ? `?${query}` : ''}`);
    return {
      success: response.success,
      data: response.data || [],
      meta: response.meta
    };
  },

  async getPosition(id) {
    const response = await api.get(`/positions/${id}`);
    return {
      success: response.success,
      data: response.data?.position || response.data
    };
  },

  async getPositionSummary() {
    const response = await api.get('/positions/summary');
    return {
      success: response.success,
      data: response.data
    };
  },

  async getPositionPnL() {
    const response = await api.get('/positions/pnl');
    return {
      success: response.success,
      data: response.data
    };
  },

  async getNetPositionValue() {
    const response = await api.get('/positions/net-value');
    return {
      success: response.success,
      data: response.data
    };
  },

  async getPositionHistory() {
    const response = await api.get('/positions/history');
    return {
      success: response.success,
      data: response.data || []
    };
  },

  async squareOff(id, quantity = null) {
    const response = await api.post(`/positions/${id}/square-off`, { quantity });
    return {
      success: response.success,
      data: response.data
    };
  },

  async squareOffAll() {
    const response = await api.post('/positions/square-off/all');
    return {
      success: response.success,
      data: response.data
    };
  },
};

export { positionService };
export default positionService;
