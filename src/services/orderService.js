import api from './api';

const orderService = {
  async getOrders(params = {}) {
    const query = new URLSearchParams(params).toString();
    const response = await api.get(`/orders${query ? `?${query}` : ''}`);
    return {
      success: response.success,
      data: response.data || [],
      meta: response.meta
    };
  },

  async getOrderHistory() {
    const response = await api.get('/orders/history');
    return {
      success: response.success,
      data: response.data || [],
      meta: response.meta
    };
  },

  async getPendingSummary() {
    const response = await api.get('/orders/pending');
    return {
      success: response.success,
      data: response.data
    };
  },

  async placeOrder(data) {
    const response = await api.post('/orders', data);
    return {
      success: response.success,
      data: response.data
    };
  },

  async placeBracketOrder(data) {
    const response = await api.post('/orders/bracket', data);
    return {
      success: response.success,
      data: response.data
    };
  },

  async placeCoverOrder(data) {
    const response = await api.post('/orders/cover', data);
    return {
      success: response.success,
      data: response.data
    };
  },

  async modifyOrder(id, data) {
    const response = await api.put(`/orders/${id}`, data);
    return {
      success: response.success,
      data: response.data
    };
  },

  async cancelOrder(id) {
    const response = await api.delete(`/orders/${id}`);
    return {
      success: response.success,
      data: response.data
    };
  },

  async cancelAllOrders() {
    const response = await api.delete('/orders/pending/all');
    return {
      success: response.success,
      data: response.data
    };
  },
};

export { orderService };
export default orderService;
