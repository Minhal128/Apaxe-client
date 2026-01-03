import api from './api';

const instrumentService = {
  async getInstruments(params = {}) {
    const queryParams = { ...params };
    
    // MCX2 segment mapping - use ID instead of search string
    if (queryParams.search === 'MCX2') {
      queryParams.segment = '6946a6bb2056b8e4a5319327';
      delete queryParams.search;
    }

    const query = new URLSearchParams(queryParams).toString();
    const response = await api.get(`/instruments${query ? `?${query}` : ''}`);
    
    // Handle authentication errors gracefully
    if (!response.success && response.error?.code === 'AUTHENTICATION_ERROR') {
      console.log('Instruments endpoint requires authentication, returning empty data');
      return {
        success: true,
        data: [],
        meta: { page: 1, limit: 50, total: 0, totalPages: 0 }
      };
    }
    
    // Backend returns paginated response with data array
    return {
      success: response.success,
      data: response.data || [],
      meta: response.meta
    };
  },

  async getInstrument(id) {
    const response = await api.get(`/instruments/${id}`);
    
    if (!response.success && response.error?.code === 'AUTHENTICATION_ERROR') {
      console.log('Instrument details endpoint requires authentication');
      return {
        success: false,
        data: null,
        error: 'Authentication required'
      };
    }
    
    return {
      success: response.success,
      data: response.data?.instrument || response.data
    };
  },

  async getBySymbol(symbol) {
    // Use search endpoint to find instrument by symbol since /instruments/symbol/{symbol} doesn't exist
    const response = await api.get(`/instruments/search?q=${encodeURIComponent(symbol)}`);
    
    if (!response.success && response.error?.code === 'AUTHENTICATION_ERROR') {
      console.log('Instrument by symbol endpoint requires authentication');
      return {
        success: false,
        data: null,
        error: 'Authentication required'
      };
    }
    
    if (response.success) {
      const instruments = response.data?.instruments || response.data || [];
      // Find exact match or first result
      const instrument = instruments.find(inst => inst.symbol === symbol) || instruments[0];
      return {
        success: true,
        data: instrument || null
      };
    }
    
    return {
      success: response.success,
      data: response.data?.instrument || response.data
    };
  },

  async searchInstruments(query) {
    const response = await api.get(`/instruments/search?q=${encodeURIComponent(query)}`);
    
    if (!response.success && response.error?.code === 'AUTHENTICATION_ERROR') {
      console.log('Search instruments endpoint requires authentication, returning empty data');
      return {
        success: true,
        data: []
      };
    }
    
    return {
      success: response.success,
      data: response.data?.instruments || response.data || []
    };
  },

  async getTopMovers() {
    const response = await api.get('/instruments/top-movers');
    
    if (!response.success && response.error?.code === 'AUTHENTICATION_ERROR') {
      console.log('Top movers endpoint requires authentication, returning empty data');
      return {
        success: true,
        data: []
      };
    }
    
    return {
      success: response.success,
      data: response.data?.movers || response.data || []
    };
  },

  async getExpiringInstruments() {
    const response = await api.get('/instruments/expiring');
    return {
      success: response.success,
      data: response.data?.instruments || response.data || []
    };
  },

  async getQuote(id) {
    const response = await api.get(`/instruments/${id}/quote`);
    
    if (!response.success && response.error?.code === 'AUTHENTICATION_ERROR') {
      console.log('Quote endpoint requires authentication');
      return {
        success: false,
        data: null,
        error: 'Authentication required'
      };
    }
    
    return {
      success: response.success,
      data: response.data?.quote || response.data
    };
  },

  async getOHLC(id) {
    const response = await api.get(`/instruments/${id}/ohlc`);
    
    if (!response.success && response.error?.code === 'AUTHENTICATION_ERROR') {
      console.log('OHLC endpoint requires authentication');
      return {
        success: false,
        data: [],
        error: 'Authentication required'
      };
    }
    
    return {
      success: response.success,
      data: response.data?.ohlc || response.data || []
    };
  },

  // Get real-time market data from Redis cache
  async getMarketWatch(segment = 'ALL', params = {}) {
    const query = new URLSearchParams(params).toString();
    const response = await api.get(`/market/segment/${segment}${query ? `?${query}` : ''}`);
    
    if (!response.success && response.error?.code === 'AUTHENTICATION_ERROR') {
      console.log('Market watch endpoint requires authentication');
      return {
        success: false,
        data: { instruments: [], pagination: { total: 0 } },
        error: 'Authentication required'
      };
    }
    
    return {
      success: response.success,
      data: response.data || { instruments: [], pagination: { total: 0 } }
    };
  },
};

export { instrumentService };
export default instrumentService;
