import api from './api';

export const watchlistService = {
  async getWatchlists() {
    const response = await api.get('/watchlists');
    return {
      success: response.success,
      data: response.data || []
    };
  },

  async getWatchlist(id) {
    const response = await api.get(`/watchlists/${id}`);
    return {
      success: response.success,
      data: response.data?.watchlist || response.data
    };
  },

  async getDefaultWatchlist() {
    const response = await api.get('/watchlists/default');
    return {
      success: response.success,
      data: response.data?.watchlist || response.data
    };
  },

  async createWatchlist(name, isDefault = false) {
    const response = await api.post('/watchlists', { name, isDefault });
    return {
      success: response.success,
      data: response.data?.watchlist || response.data
    };
  },

  async updateWatchlist(id, data) {
    const response = await api.put(`/watchlists/${id}`, data);
    return {
      success: response.success,
      data: response.data?.watchlist || response.data
    };
  },

  async deleteWatchlist(id) {
    const response = await api.delete(`/watchlists/${id}`);
    return {
      success: response.success,
      data: response.data
    };
  },

  async addInstrument(watchlistId, instrumentId) {
    const response = await api.post(`/watchlists/${watchlistId}/instruments`, { instrumentId });
    return {
      success: response.success,
      data: response.data
    };
  },

  async removeInstrument(watchlistId, instrumentId) {
    const response = await api.delete(`/watchlists/${watchlistId}/instruments/${instrumentId}`);
    return {
      success: response.success,
      data: response.data
    };
  },

  async searchInstruments(query) {
    const response = await api.get(`/watchlists/search?q=${encodeURIComponent(query)}`);
    return {
      success: response.success,
      data: response.data || []
    };
  },

  async getMostTraded() {
    const response = await api.get('/watchlists/most-traded');
    return {
      success: response.success,
      data: response.data || []
    };
  },
};

export default watchlistService;
