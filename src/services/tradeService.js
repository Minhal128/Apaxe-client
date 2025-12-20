import api from './api';

export const tradeService = {
  async getTrades(params = {}) {
    const query = new URLSearchParams(params).toString();
    const response = await api.get(`/trades${query ? `?${query}` : ''}`);
    return {
      success: response.success,
      data: response.data || [],
      meta: response.meta
    };
  },

  async getTodaysTrades() {
    const response = await api.get('/trades/today');
    return {
      success: response.success,
      data: response.data || []
    };
  },

  async getTradeSummary() {
    const response = await api.get('/trades/summary');
    return {
      success: response.success,
      data: response.data
    };
  },

  async getTradesByInstrument(instrumentId) {
    const response = await api.get(`/trades/instrument/${instrumentId}`);
    return {
      success: response.success,
      data: response.data || []
    };
  },

  async getTradesByDateRange(startDate, endDate) {
    const response = await api.get(`/trades/range/${startDate}/${endDate}`);
    return {
      success: response.success,
      data: response.data || []
    };
  },

  async getPnlReport() {
    const response = await api.get('/trades/pnl');
    return {
      success: response.success,
      data: response.data
    };
  },
};

export default tradeService;
