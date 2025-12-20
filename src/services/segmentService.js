import api from './api';

export const segmentService = {
  async getSegments() {
    const response = await api.get('/segments');
    return {
      success: response.success,
      data: {
        segments: response.data?.segments || response.data || []
      }
    };
  },

  async getSegment(id) {
    const response = await api.get(`/segments/${id}`);
    return {
      success: response.success,
      data: response.data?.segment || response.data
    };
  },
};

export default segmentService;
