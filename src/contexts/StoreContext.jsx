import React, { createContext, useContext, useState, useEffect } from 'react';
import authService from '../services/authService';

const StoreContext = createContext();

export const useStore = () => {
  const context = useContext(StoreContext);
  if (!context) {
    throw new Error('useStore must be used within a StoreProvider');
  }
  return context;
};

export const StoreProvider = ({ children }) => {
  const [currentStore, setCurrentStore] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [currentSuperAdmin, setCurrentSuperAdmin] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check authentication status for both store and super admin
    const checkAuthStatus = () => {
      try {
        // Check store session
        const storedStore = localStorage.getItem('currentStore');
        const storeSession = localStorage.getItem('storeSession');

        if (storedStore && storeSession) {
          const store = JSON.parse(storedStore);
          const session = JSON.parse(storeSession);

          // Check if session is still valid (24 hours)
          const now = new Date().getTime();
          if (now - session.timestamp < 24 * 60 * 60 * 1000) {
            setCurrentStore(store);
            setIsAuthenticated(true);
          } else {
            // Session expired, clear storage
            localStorage.removeItem('currentStore');
            localStorage.removeItem('storeSession');
            setCurrentStore(null);
            setIsAuthenticated(false);
          }
        }

        // Check super admin session
        const superAdminAuth = authService.getAuthenticationStatus();
        if (superAdminAuth.isSuperAdmin) {
          setIsSuperAdmin(true);
          setCurrentSuperAdmin(superAdminAuth.currentSuperAdmin);
        } else {
          setIsSuperAdmin(false);
          setCurrentSuperAdmin(null);
        }
      } catch (error) {
        console.error('Error checking authentication status:', error);
        // Clear all sessions on error
        localStorage.removeItem('currentStore');
        localStorage.removeItem('storeSession');
        authService.logoutSuperAdmin();
        setCurrentStore(null);
        setIsAuthenticated(false);
        setIsSuperAdmin(false);
        setCurrentSuperAdmin(null);
      }

      setLoading(false);
    };

    checkAuthStatus();

    // Set up periodic session check (every 5 minutes)
    const sessionCheckInterval = setInterval(checkAuthStatus, 5 * 60 * 1000);

    return () => clearInterval(sessionCheckInterval);
  }, []);

  const login = (store) => {
    setCurrentStore(store);
    setIsAuthenticated(true);
    
    // Store session in localStorage
    localStorage.setItem('currentStore', JSON.stringify(store));
    localStorage.setItem('storeSession', JSON.stringify({
      storeId: store.id,
      timestamp: new Date().getTime()
    }));
  };

  const logout = () => {
    setCurrentStore(null);
    setIsAuthenticated(false);

    // Clear stored session
    localStorage.removeItem('currentStore');
    localStorage.removeItem('storeSession');
  };

  const switchStore = (store) => {
    login(store);
  };

  const loginSuperAdmin = (session) => {
    setIsSuperAdmin(true);
    setCurrentSuperAdmin({
      username: session.username,
      role: session.role,
      loginTime: new Date(session.timestamp)
    });
  };

  const logoutSuperAdmin = () => {
    authService.logoutSuperAdmin();
    setIsSuperAdmin(false);
    setCurrentSuperAdmin(null);
  };

  const logoutAll = () => {
    // Logout from both store and super admin
    logout();
    logoutSuperAdmin();
  };

  const canManageStores = () => {
    return isSuperAdmin;
  };

  const getAuthStatus = () => {
    return {
      isAuthenticated,
      isStoreAuthenticated: isAuthenticated, // Add explicit mapping for Layout.jsx
      isSuperAdmin,
      currentStore,
      currentSuperAdmin,
      hasAnyAuth: isAuthenticated || isSuperAdmin,
      canManageStores: isSuperAdmin
    };
  };

  const value = {
    // Store authentication
    currentStore,
    isAuthenticated,
    login,
    logout,
    switchStore,

    // Super admin authentication
    isSuperAdmin,
    currentSuperAdmin,
    loginSuperAdmin,
    logoutSuperAdmin,

    // Combined methods
    logoutAll,
    canManageStores,
    getAuthStatus,

    // Loading state
    loading
  };

  return (
    <StoreContext.Provider value={value}>
      {children}
    </StoreContext.Provider>
  );
};
