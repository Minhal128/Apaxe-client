import api from './api';

const orderService = {
  async getOrders(params = {}) {
    try {
      const query = new URLSearchParams(params).toString();
      const response = await api.get(`/orders${query ? `?${query}` : ''}`);
      return {
        success: response.success !== false,
        data: response.data || [],
        meta: response.meta,
        message: response.error?.message || response.message
      };
    } catch (error) {
      console.error('Error fetching orders:', error);
      return {
        success: false,
        data: [],
        message: error.message || 'Failed to fetch orders'
      };
    }
  },

  async getOrderHistory() {
    try {
      const response = await api.get('/orders/history');
      return {
        success: response.success !== false,
        data: response.data || [],
        meta: response.meta,
        message: response.error?.message || response.message
      };
    } catch (error) {
      console.error('Error fetching order history:', error);
      return {
        success: false,
        data: [],
        message: error.message || 'Failed to fetch order history'
      };
    }
  },

  async getPendingSummary() {
    try {
      const response = await api.get('/orders/pending');
      return {
        success: response.success !== false,
        data: response.data,
        message: response.error?.message || response.message
      };
    } catch (error) {
      console.error('Error fetching pending summary:', error);
      return {
        success: false,
        data: null,
        message: error.message || 'Failed to fetch pending summary'
      };
    }
  },

  async placeOrder(data) {
    try {
      console.log('OrderService: Placing order with data:', JSON.stringify(data));
      const response = await api.post('/orders', data);
      console.log('OrderService: Order response:', JSON.stringify(response));
      
      // Handle different response formats
      if (response.success === false || response.error) {
        return {
          success: false,
          data: null,
          message: response.error?.message || response.message || 'Order failed'
        };
      }
      
      return {
        success: true,
        data: response.data || response,
        message: 'Order placed successfully'
      };
    } catch (error) {
      console.error('OrderService: Error placing order:', error);
      return {
        success: false,
        data: null,
        message: error.message || 'Failed to place order'
      };
    }
  },

  async placeBracketOrder(data) {
    try {
      const response = await api.post('/orders/bracket', data);
      return {
        success: response.success !== false && !response.error,
        data: response.data,
        message: response.error?.message || response.message
      };
    } catch (error) {
      console.error('Error placing bracket order:', error);
      return {
        success: false,
        data: null,
        message: error.message || 'Failed to place bracket order'
      };
    }
  },

  async placeCoverOrder(data) {
    try {
      const response = await api.post('/orders/cover', data);
      return {
        success: response.success !== false && !response.error,
        data: response.data,
        message: response.error?.message || response.message
      };
    } catch (error) {
      console.error('Error placing cover order:', error);
      return {
        success: false,
        data: null,
        message: error.message || 'Failed to place cover order'
      };
    }
  },

  async modifyOrder(id, data) {
    try {
      const response = await api.put(`/orders/${id}`, data);
      return {
        success: response.success !== false && !response.error,
        data: response.data,
        message: response.error?.message || response.message
      };
    } catch (error) {
      console.error('Error modifying order:', error);
      return {
        success: false,
        data: null,
        message: error.message || 'Failed to modify order'
      };
    }
  },

  async cancelOrder(id) {
    try {
      const response = await api.delete(`/orders/${id}`);
      return {
        success: response.success !== false && !response.error,
        data: response.data,
        message: response.error?.message || response.message
      };
    } catch (error) {
      console.error('Error cancelling order:', error);
      return {
        success: false,
        data: null,
        message: error.message || 'Failed to cancel order'
      };
    }
  },

  async cancelAllOrders() {
    try {
      const response = await api.delete('/orders/pending/all');
      return {
        success: response.success !== false && !response.error,
        data: response.data,
        message: response.error?.message || response.message
      };
    } catch (error) {
      console.error('Error cancelling all orders:', error);
      return {
        success: false,
        data: null,
        message: error.message || 'Failed to cancel all orders'
      };
    }
  },
};

export { orderService };
export default orderService;
