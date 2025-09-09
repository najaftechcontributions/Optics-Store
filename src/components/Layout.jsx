import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Eye, Users, FileText, ShoppingCart, BarChart3, Menu, Settings, LogOut, Store, Shield, ChevronDown } from 'lucide-react';
import { useStore } from '../contexts/StoreContext';
import { formatDateWithWeekday } from '../utils/dateUtils';
import { showLogoutConfirmation } from '../utils/sweetAlert';

const Layout = ({ children }) => {
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = React.useState(false);
  const [showLogoutMenu, setShowLogoutMenu] = React.useState(false);
  const { currentStore, isSuperAdmin, currentSuperAdmin, logout, logoutSuperAdmin, logoutAll, getAuthStatus } = useStore();
  const logoutMenuRef = React.useRef(null);

  // Close logout menu when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (event) => {
      if (logoutMenuRef.current && !logoutMenuRef.current.contains(event.target)) {
        setShowLogoutMenu(false);
      }
    };

    if (showLogoutMenu) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showLogoutMenu]);

  const allNavigation = [
    { name: 'Settings', href: '/', icon: Settings, adminOnly: true },
    { name: 'Dashboard', href: '/dashboard', icon: BarChart3 },
    { name: 'Customers', href: '/customers', icon: Users },
    { name: 'Checkups', href: '/checkups', icon: Eye },
    { name: 'Orders', href: '/orders', icon: ShoppingCart },
    { name: 'Reports', href: '/reports', icon: FileText },
  ];

  // Filter navigation based on user role
  const navigation = allNavigation.filter(item => !item.adminOnly || isSuperAdmin);

  const handleStoreLogout = async () => {
    const confirmed = await showLogoutConfirmation('store');
    if (confirmed) {
      logout();
      setShowLogoutMenu(false);
    }
  };

  const handleSuperAdminLogout = async () => {
    const confirmed = await showLogoutConfirmation('super admin');
    if (confirmed) {
      logoutSuperAdmin();
      setShowLogoutMenu(false);
    }
  };

  const handleLogoutAll = async () => {
    const confirmed = await showLogoutConfirmation('everything');
    if (confirmed) {
      logoutAll();
      setShowLogoutMenu(false);
    }
  };

  const authStatus = getAuthStatus();

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transform transition-transform duration-200 ease-in-out lg:translate-x-0 lg:static lg:inset-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="h-16 px-4 bg-primary-600">
          <div className="flex items-center space-x-2 h-full">
            <Eye className="h-8 w-8 text-white" />
            <div className="text-white flex-1">
              <h1 className="font-bold text-lg">{currentStore?.name || import.meta.env.VITE_STORE_NAME || 'Kashmir Optical'}</h1>
              <p className="text-xs text-primary-100">Management System</p>
            </div>
          </div>
        </div>
        {/* Current Store Status */}
        {currentStore && (
          <div className="px-2 py-2 bg-primary-700 text-white text-xs">
            <div className="flex items-center space-x-2">
              <Store className="h-3 w-3" />
              <span className="truncate">{currentStore.name}</span>
            </div>
          </div>
        )}

        {/* Super Admin Status */}
        {isSuperAdmin && currentSuperAdmin && (
          <div className="px-2 py-2 bg-red-600 text-white text-xs">
            <div className="flex items-center space-x-2">
              <Shield className="h-3 w-3" />
              <span className="truncate">Super Admin: {currentSuperAdmin.username}</span>
            </div>
          </div>
        )}
        <nav className="mt-8 px-2 sm:px-4 flex-1">
          <ul className="space-y-2">
            {navigation.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.href;

              return (
                <li key={item.name}>
                  <Link
                    to={item.href}
                    className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${isActive
                        ? 'bg-primary-50 text-primary-700 border-r-2 border-primary-600'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                      }`}
                    onClick={() => setSidebarOpen(false)}
                  >
                    <Icon className="h-5 w-5" />
                    <span className="font-medium">{item.name}</span>
                  </Link>
                </li>
              );
            })}
          </ul>

          {/* Logout Section */}
          <div className="mt-auto pb-4 relative" ref={logoutMenuRef}>
            {authStatus.isSuperAdmin && authStatus.isStoreAuthenticated ? (
              /* Multiple logout options when both super admin and store are logged in */
              <div>
                <button
                  onClick={() => setShowLogoutMenu(!showLogoutMenu)}
                  className="w-full flex items-center justify-between px-4 py-3 rounded-lg text-gray-600 hover:bg-red-50 hover:text-red-700 transition-colors"
                >
                  <div className="flex items-center space-x-3">
                    <LogOut className="h-5 w-5" />
                    <span className="font-medium">Logout Options</span>
                  </div>
                  <ChevronDown className={`h-4 w-4 transition-transform ${showLogoutMenu ? 'rotate-180' : ''}`} />
                </button>

                {showLogoutMenu && (
                  <div className="mt-2 bg-white border border-gray-200 rounded-lg shadow-lg py-1">
                    <button
                      onClick={handleStoreLogout}
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                    >
                      Logout Store Only
                    </button>
                    <button
                      onClick={handleSuperAdminLogout}
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                    >
                      Logout Super Admin Only
                    </button>
                    <button
                      onClick={handleLogoutAll}
                      className="w-full text-left px-4 py-2 text-sm text-red-700 hover:bg-red-50"
                    >
                      Logout Everything
                    </button>
                  </div>
                )}
              </div>
            ) : authStatus.isSuperAdmin ? (
              /* Super admin only logout */
              <button
                onClick={handleSuperAdminLogout}
                className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-gray-600 hover:bg-red-50 hover:text-red-700 transition-colors"
              >
                <LogOut className="h-5 w-5" />
                <span className="font-medium">Logout Super Admin</span>
              </button>
            ) : authStatus.isStoreAuthenticated ? (
              /* Store only logout */
              <button
                onClick={handleStoreLogout}
                className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-gray-600 hover:bg-red-50 hover:text-red-700 transition-colors"
              >
                <LogOut className="h-5 w-5" />
                <span className="font-medium">Logout Store</span>
              </button>
            ) : null}
          </div>
        </nav>
      </div>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="fixed inset-0 bg-black opacity-50" onClick={() => setSidebarOpen(false)} />
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 lg:ml-0 w-full">
        {/* Top bar */}
        <div className="bg-white shadow-sm border-b border-gray-200">
          <div className="flex items-center justify-between h-16 px-4">
            <button
              className="lg:hidden p-2 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu className="h-6 w-6" />
            </button>

            <div className="flex items-center space-x-4">
              <h2 className="text-lg sm:text-xl font-semibold text-gray-900">
                {navigation.find(nav => nav.href === location.pathname)?.name || 'Dashboard'}
              </h2>
            </div>

            <div className="flex items-center space-x-4">
              {/* Super Admin Status Badge */}
              {isSuperAdmin && currentSuperAdmin && (
                <div className="hidden md:flex items-center space-x-2 px-3 py-1 bg-red-50 border border-red-200 rounded-lg">
                  <Shield className="h-4 w-4 text-red-600" />
                  <span className="text-sm font-medium text-red-700">Super Admin</span>
                </div>
              )}

              {/* Current Store Badge */}
              {currentStore && (
                <div className="hidden md:flex items-center space-x-2 px-3 py-1 bg-primary-50 border border-primary-200 rounded-lg">
                  <Store className="h-4 w-4 text-primary-600" />
                  <span className="text-sm font-medium text-primary-700">{currentStore.name}</span>
                </div>
              )}

              {/* Date */}
              <div className="text-xs sm:text-sm text-gray-500 hidden md:block">
                {formatDateWithWeekday(new Date())}
              </div>
            </div>
          </div>
        </div>

        {/* Page content */}
        <main className="p-4 sm:p-6">
          {children}
        </main>
      </div>
    </div>
  );
};

export default Layout;
