// Super Admin Authentication Service
// This service handles authentication for super administrators who can manage stores

class SuperAdminService {
  constructor() {
    // Super admin credentials from environment variables
    // Note: In a production environment, consider server-side authentication instead
    this.SUPER_ADMIN_USERNAME = import.meta.env.VITE_SUPER_ADMIN_USERNAME || 'superadmin';
    this.SUPER_ADMIN_PASSWORD = import.meta.env.VITE_SUPER_ADMIN_PASSWORD || 'optical@admin2024';
    this.sessionTimeout = 2 * 60 * 60 * 1000; // 2 hours in milliseconds
  }

  /**
   * Authenticate super admin with username and password
   * @param {string} username - Super admin username
   * @param {string} password - Super admin password
   * @returns {Object} Authentication result
   */
  async authenticate(username, password) {
    try {
      // Validate credentials
      if (username === this.SUPER_ADMIN_USERNAME && password === this.SUPER_ADMIN_PASSWORD) {
        const session = this.createSession();
        return {
          success: true,
          session: session,
          message: 'Super admin authentication successful'
        };
      } else {
        return {
          success: false,
          session: null,
          message: 'Invalid super admin credentials'
        };
      }
    } catch (error) {
      return {
        success: false,
        session: null,
        message: error.message || 'Super admin authentication failed'
      };
    }
  }

  /**
   * Create a super admin session
   * @returns {Object} Session object
   */
  createSession() {
    const session = {
      username: this.SUPER_ADMIN_USERNAME,
      role: 'super_admin',
      timestamp: new Date().getTime(),
      expiresAt: new Date().getTime() + this.sessionTimeout
    };

    localStorage.setItem('superAdminSession', JSON.stringify(session));
    return session;
  }

  /**
   * Get stored super admin session
   * @returns {Object|null} Session object or null if invalid/expired
   */
  getStoredSession() {
    try {
      const sessionData = localStorage.getItem('superAdminSession');

      if (!sessionData) {
        return null;
      }

      const session = JSON.parse(sessionData);
      const now = new Date().getTime();

      // Check if session has expired
      if (now > session.expiresAt) {
        this.clearSession();
        return null;
      }

      return session;
    } catch (error) {
      console.error('Error retrieving super admin session:', error);
      this.clearSession();
      return null;
    }
  }

  /**
   * Clear super admin session
   */
  clearSession() {
    localStorage.removeItem('superAdminSession');
  }

  /**
   * Check if super admin session is valid
   * @returns {boolean} True if session is valid
   */
  isSessionValid() {
    const session = this.getStoredSession();
    return session !== null && session.role === 'super_admin';
  }

  /**
   * Get current super admin info
   * @returns {Object|null} Super admin info or null
   */
  getCurrentSuperAdmin() {
    const session = this.getStoredSession();
    return session ? {
      username: session.username,
      role: session.role,
      loginTime: new Date(session.timestamp)
    } : null;
  }

  /**
   * Refresh super admin session
   * @returns {boolean} True if session was refreshed successfully
   */
  refreshSession() {
    const session = this.getStoredSession();
    
    if (!session) {
      return false;
    }

    // Create a new session with extended expiration
    this.createSession();
    return true;
  }

  /**
   * Get session time remaining
   * @returns {number} Time remaining in milliseconds
   */
  getSessionTimeRemaining() {
    const session = this.getStoredSession();
    
    if (!session) {
      return 0;
    }

    const now = new Date().getTime();
    const remaining = session.expiresAt - now;
    
    return Math.max(0, remaining);
  }

  /**
   * Format session time remaining for display
   * @returns {string} Formatted time remaining
   */
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

  /**
   * Logout super admin
   */
  logout() {
    this.clearSession();
  }

  /**
   * Check if user has super admin privileges
   * @returns {boolean} True if user is authenticated as super admin
   */
  hasSuperAdminPrivileges() {
    return this.isSessionValid();
  }

  /**
   * Validate super admin credentials format
   * @param {string} username - Username to validate
   * @param {string} password - Password to validate
   * @returns {Object} Validation result
   */
  validateCredentials(username, password) {
    if (!username || !password) {
      return { valid: false, message: 'Username and password are required' };
    }

    if (username.length < 3) {
      return { valid: false, message: 'Username must be at least 3 characters' };
    }

    if (password.length < 6) {
      return { valid: false, message: 'Password must be at least 6 characters' };
    }

    return { valid: true, message: 'Credentials format is valid' };
  }
}

// Create a singleton instance
const superAdminService = new SuperAdminService();
export default superAdminService;
