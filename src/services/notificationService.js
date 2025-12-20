import api from './api';

export const notificationService = {
  async getNotifications() {
    const response = await api.get('/notifications');
    return {
      success: response.success,
      data: response.data || []
    };
  },

  async getUnreadCount() {
    const response = await api.get('/notifications/unread-count');
    return {
      success: response.success,
      data: response.data
    };
  },

  async markAsRead(id) {
    const response = await api.post(`/notifications/${id}/read`);
    return {
      success: response.success,
      data: response.data
    };
  },

  async markAllAsRead() {
    const response = await api.post('/notifications/read-all');
    return {
      success: response.success,
      data: response.data
    };
  },

  async deleteNotification(id) {
    const response = await api.delete(`/notifications/${id}`);
    return {
      success: response.success,
      data: response.data
    };
  },
};

export default notificationService;
