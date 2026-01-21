import api from './api';

const userService = {
  async getDashboard() {
    const response = await api.get('/users/dashboard');
    return {
      success: response.success,
      data: response.data
    };
  },

  async getProfile() {
    // Profile is in auth routes, not user routes
    const response = await api.get('/auth/profile');
    return {
      success: response.success,
      data: response.data?.user || response.data
    };
  },

  async updateProfile(data) {
    // Profile update is in auth routes, not user routes
    const response = await api.put('/auth/profile', data);
    return {
      success: response.success,
      data: response.data?.user || response.data
    };
  },

  async getUser(id) {
    const response = await api.get(`/users/${id}`);
    return {
      success: response.success,
      data: response.data?.user || response.data
    };
  },

  async getBalanceHistory() {
    try {
      // Get current user's ledger
      const response = await api.get('/auth/profile');
      if (response.success && response.data?.user?.id) {
        const userId = response.data.user.id;
        const ledgerResponse = await api.get(`/users/${userId}/ledger`);
        
        console.log('Ledger response:', ledgerResponse);
        
        if (ledgerResponse.success) {
          // The backend returns paginated data, so we need to extract the entries
          const entries = ledgerResponse.data || [];
          return {
            success: true,
            data: Array.isArray(entries) ? entries : []
          };
        } else {
          console.log('Ledger request failed:', ledgerResponse.error);
          return {
            success: false,
            data: []
          };
        }
      }
      return {
        success: false,
        data: []
      };
    } catch (error) {
      console.error('Error fetching balance history:', error);
      return {
        success: false,
        data: []
      };
    }
  },

  async depositFunds(amount, remarks) {
    try {
      // Get current user's profile to get the user ID
      const profileResponse = await api.get('/auth/profile');
      console.log('Profile response for deposit:', profileResponse);
      
      if (!profileResponse.success || !profileResponse.data?.user?.id) {
        throw new Error('Unable to get user profile. Please log in again.');
      }

      const userId = profileResponse.data.user.id;
      const userRole = profileResponse.data.user.role;
      
      console.log('Attempting deposit for user:', userId, 'role:', userRole);
      
      // Try to call the balance adjustment endpoint
      const response = await api.post(`/users/${userId}/balance`, {
        amount: parseFloat(amount),
        type: 'CREDIT',
        description: remarks || 'Deposit funds',
        category: 'DEPOSIT'
      });

      console.log('Deposit response:', response);

      // Handle API response
      if (response.success) {
        return {
          success: true,
          data: response.data
        };
      } else {
        // Handle specific error cases
        let errorMessage = 'Deposit failed';
        
        if (response.error) {
          if (response.error.code === 'VALIDATION_ERROR') {
            if (response.error.details && response.error.details.id) {
              errorMessage = 'Invalid user ID format. Please contact support.';
            } else {
              errorMessage = response.error.message || 'Invalid input data';
            }
          } else if (response.error.code === 'FORBIDDEN_ERROR') {
            errorMessage = 'You do not have permission to perform this action. Please contact support to add funds to your account.';
          } else if (response.error.code === 'AUTHENTICATION_ERROR') {
            errorMessage = 'Please log in again to continue.';
          } else {
            errorMessage = response.error.message || 'Deposit failed';
          }
        }
        
        return {
          success: false,
          error: errorMessage
        };
      }
    } catch (error) {
      console.error('Deposit error:', error);
      return {
        success: false,
        error: error.message || 'Deposit failed'
      };
    }
  },

  async withdrawFunds(amount, remarks) {
    try {
      // Get current user's profile to get the user ID
      const profileResponse = await api.get('/auth/profile');
      console.log('Profile response for withdrawal:', profileResponse);
      
      if (!profileResponse.success || !profileResponse.data?.user?.id) {
        throw new Error('Unable to get user profile. Please log in again.');
      }

      const userId = profileResponse.data.user.id;
      const userRole = profileResponse.data.user.role;
      
      console.log('Attempting withdrawal for user:', userId, 'role:', userRole);
      
      // Try to call the balance adjustment endpoint
      const response = await api.post(`/users/${userId}/balance`, {
        amount: parseFloat(amount),
        type: 'DEBIT',
        description: remarks || 'Withdraw funds',
        category: 'WITHDRAWAL'
      });

      console.log('Withdrawal response:', response);

      // Handle API response
      if (response.success) {
        return {
          success: true,
          data: response.data
        };
      } else {
        // Handle specific error cases
        let errorMessage = 'Withdrawal failed';
        
        if (response.error) {
          if (response.error.code === 'VALIDATION_ERROR') {
            if (response.error.details && response.error.details.id) {
              errorMessage = 'Invalid user ID format. Please contact support.';
            } else {
              errorMessage = response.error.message || 'Invalid input data';
            }
          } else if (response.error.code === 'FORBIDDEN_ERROR') {
            errorMessage = 'You do not have permission to perform this action. Please contact support to withdraw funds from your account.';
          } else if (response.error.code === 'AUTHENTICATION_ERROR') {
            errorMessage = 'Please log in again to continue.';
          } else {
            errorMessage = response.error.message || 'Withdrawal failed';
          }
        }
        
        return {
          success: false,
          error: errorMessage
        };
      }
    } catch (error) {
      console.error('Withdrawal error:', error);
      return {
        success: false,
        error: error.message || 'Withdrawal failed'
      };
    }
  },

  // Update balance after simulated trade
  async updateBalanceAfterTrade(amount, side, symbol) {
    try {
      const profileResponse = await api.get('/auth/profile');
      if (!profileResponse.success || !profileResponse.data?.user?.id) {
        throw new Error('Unable to get user profile');
      }

      const userId = profileResponse.data.user.id;
      const type = side === 'BUY' ? 'DEBIT' : 'CREDIT';
      const description = side === 'BUY' 
        ? `Bought ${symbol}` 
        : `Sold ${symbol}`;

      const response = await api.post(`/users/${userId}/balance`, {
        amount: parseFloat(Math.abs(amount)),
        type: type,
        description: description,
        category: 'TRADE'
      });

      if (response.success) {
        return {
          success: true,
          data: response.data
        };
      } else {
        // If balance update fails (e.g., permission issue), return error but don't crash
        console.log('Balance update failed:', response.error);
        return {
          success: false,
          error: response.error?.message || 'Balance update failed'
        };
      }
    } catch (error) {
      console.error('Trade balance update error:', error);
      return {
        success: false,
        error: error.message || 'Balance update failed'
      };
    }
  },

  // Get current balance from dashboard
  async getBalance() {
    try {
      const response = await api.get('/users/dashboard');
      if (response.success && response.data) {
        return {
          success: true,
          balance: response.data.balance || 0,
          availableMargin: response.data.availableMargin || 0,
          lockedMargin: response.data.lockedMargin || 0,
          equity: response.data.balance || 0, // For display purposes
          freeMargin: response.data.availableMargin || 0, // For display purposes
        };
      }
      return {
        success: false,
        balance: 0,
        availableMargin: 0,
        lockedMargin: 0,
      };
    } catch (error) {
      console.error('Error fetching balance:', error);
      return {
        success: false,
        balance: 0,
        availableMargin: 0,
        lockedMargin: 0,
      };
    }
  },
};

export { userService };
export default userService;
