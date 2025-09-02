import { storeService } from '../utils/database';
import superAdminService from './superAdminService';

export class AuthService {
  constructor() {
    this.sessionTimeout = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
  }

  async authenticateStore(storeId, pin) {
    try {
      const store = await storeService.authenticate(storeId, pin);
      
      if (!store) {
        throw new Error('Invalid store ID or PIN');
      }

      return {
        success: true,
        store: store,
        message: 'Authentication successful'
      };
    } catch (error) {
      return {
        success: false,
        store: null,
        message: error.message || 'Authentication failed'
      };
    }
  }

  async getAllStores() {
    try {
      const stores = await storeService.getAll();
      return {
        success: true,
        stores: stores,
        message: 'Stores retrieved successfully'
      };
    } catch (error) {
      return {
        success: false,
        stores: [],
        message: error.message || 'Failed to retrieve stores'
      };
    }
  }

  createSession(store) {
    const session = {
      storeId: store.id,
      storeName: store.name,
      timestamp: new Date().getTime(),
      expiresAt: new Date().getTime() + this.sessionTimeout
    };

    localStorage.setItem('storeSession', JSON.stringify(session));
    localStorage.setItem('currentStore', JSON.stringify(store));

    return session;
  }

  getStoredSession() {
    try {
      const sessionData = localStorage.getItem('storeSession');
      const storeData = localStorage.getItem('currentStore');

      if (!sessionData || !storeData) {
        return null;
      }

      const session = JSON.parse(sessionData);
      const store = JSON.parse(storeData);
      const now = new Date().getTime();

      // Check if session has expired
      if (now > session.expiresAt) {
        this.clearSession();
        return null;
      }

      return {
        session,
        store
      };
    } catch (error) {
      console.error('Error retrieving stored session:', error);
      this.clearSession();
      return null;
    }
  }

  clearSession() {
    localStorage.removeItem('storeSession');
    localStorage.removeItem('currentStore');
  }

  isSessionValid() {
    const storedSession = this.getStoredSession();
    return storedSession !== null;
  }

  getCurrentStore() {
    const storedSession = this.getStoredSession();
    return storedSession ? storedSession.store : null;
  }

  async validatePin(pin) {
    // Basic PIN validation rules
    if (!pin) {
      return { valid: false, message: 'PIN is required' };
    }

    if (pin.length < 4) {
      return { valid: false, message: 'PIN must be at least 4 characters' };
    }

    if (pin.length > 10) {
      return { valid: false, message: 'PIN cannot exceed 10 characters' };
    }

    return { valid: true, message: 'PIN is valid' };
  }

  async refreshSession() {
    const storedData = this.getStoredSession();
    
    if (!storedData) {
      return false;
    }

    // Create a new session with extended expiration
    this.createSession(storedData.store);
    return true;
  }

  getSessionTimeRemaining() {
    const storedSession = this.getStoredSession();
    
    if (!storedSession) {
      return 0;
    }

    const now = new Date().getTime();
    const remaining = storedSession.session.expiresAt - now;
    
    return Math.max(0, remaining);
  }

  formatSessionTimeRemaining() {
    const remaining = this.getSessionTimeRemaining();

    if (remaining === 0) {
      return 'Session expired';
    }

    const hours = Math.floor(remaining / (1000 * 60 * 60));
    const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));

    if (hours > 0) {
      return `${hours}h ${minutes}m remaining`;
    } else {
      return `${minutes}m remaining`;
    }
  }

  // Super Admin Authentication Methods

  /**
   * Authenticate super admin
   * @param {string} username - Super admin username
   * @param {string} password - Super admin password
   * @returns {Object} Authentication result
   */
  async authenticateSuperAdmin(username, password) {
    return await superAdminService.authenticate(username, password);
  }

  /**
   * Check if current user is super admin
   * @returns {boolean} True if user has super admin privileges
   */
  isSuperAdmin() {
    return superAdminService.hasSuperAdminPrivileges();
  }

  /**
   * Get current super admin session
   * @returns {Object|null} Super admin session or null
   */
  getSuperAdminSession() {
    return superAdminService.getStoredSession();
  }

  /**
   * Get current super admin info
   * @returns {Object|null} Super admin info or null
   */
  getCurrentSuperAdmin() {
    return superAdminService.getCurrentSuperAdmin();
  }

  /**
   * Logout super admin
   */
  logoutSuperAdmin() {
    superAdminService.logout();
  }

  /**
   * Check authentication type and status
   * @returns {Object} Authentication status information
   */
  getAuthenticationStatus() {
    const isSuperAdmin = this.isSuperAdmin();
    const isStoreAuthenticated = this.isSessionValid();
    const currentStore = this.getCurrentStore();
    const currentSuperAdmin = this.getCurrentSuperAdmin();

    return {
      isSuperAdmin,
      isStoreAuthenticated,
      currentStore,
      currentSuperAdmin,
      hasAnyAuth: isSuperAdmin || isStoreAuthenticated
    };
  }

  /**
   * Clear all sessions (store and super admin)
   */
  clearAllSessions() {
    this.clearSession(); // Clear store session
    this.logoutSuperAdmin(); // Clear super admin session
  }

  /**
   * Check if user can manage stores (super admin only)
   * @returns {boolean} True if user can manage stores
   */
  canManageStores() {
    return this.isSuperAdmin();
  }

  /**
   * Validate super admin credentials format
   * @param {string} username - Username to validate
   * @param {string} password - Password to validate
   * @returns {Object} Validation result
   */
  validateSuperAdminCredentials(username, password) {
    return superAdminService.validateCredentials(username, password);
  }

  /**
   * Get super admin session time remaining
   * @returns {string} Formatted time remaining
   */
  getSuperAdminSessionTimeRemaining() {
    return superAdminService.formatSessionTimeRemaining();
  }

  /**
   * Refresh super admin session
   * @returns {boolean} True if session was refreshed
   */
  refreshSuperAdminSession() {
    return superAdminService.refreshSession();
  }
}

// Create a singleton instance
const authService = new AuthService();
export default authService;
