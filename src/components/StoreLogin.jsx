import React, { useState, useEffect } from 'react';
import { Eye, Lock, Store, Shield, AlertCircle, CheckCircle } from 'lucide-react';
import authService from '../services/authService';
import { useStore } from '../contexts/StoreContext';
import SuperAdminLogin from './SuperAdminLogin';

const StoreLogin = () => {
  const [stores, setStores] = useState([]);
  const [selectedStore, setSelectedStore] = useState(null);
  const [pin, setPin] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [step, setStep] = useState('select'); // 'select' or 'authenticate'
  const [showSuperAdminLogin, setShowSuperAdminLogin] = useState(false);
  const { login } = useStore();

  const handleSuperAdminSuccess = (session) => {
    // Redirect to super admin interface or reload with super admin privileges
    window.location.reload();
  };

  useEffect(() => {
    loadStores();
  }, []);

  const loadStores = async () => {
    try {
      setLoading(true);
      const result = await authService.getAllStores();
      
      if (result.success) {
        setStores(result.stores);
      } else {
        setError(result.message);
      }
    } catch (error) {
      setError('Failed to load stores');
    } finally {
      setLoading(false);
    }
  };

  const handleStoreSelect = (store) => {
    setSelectedStore(store);
    setStep('authenticate');
    setError('');
    setPin('');
  };

  const handleBack = () => {
    setStep('select');
    setSelectedStore(null);
    setPin('');
    setError('');
  };

  const handlePinSubmit = async (e) => {
    e.preventDefault();
    
    if (!selectedStore || !pin) {
      setError('Please enter your PIN');
      return;
    }

    try {
      setLoading(true);
      setError('');

      const result = await authService.authenticateStore(selectedStore.id, pin);
      
      if (result.success) {
        login(result.store);
      } else {
        setError(result.message);
        setPin('');
      }
    } catch (error) {
      setError('Authentication failed');
      setPin('');
    } finally {
      setLoading(false);
    }
  };

  const handlePinChange = (e) => {
    const value = e.target.value.replace(/\D/g, ''); // Only allow digits
    if (value.length <= 10) {
      setPin(value);
    }
  };

  if (loading && stores.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 to-primary-100 flex items-center justify-center">
        <div className="bg-white rounded-lg p-8 shadow-lg">
          <div className="flex items-center justify-center space-x-3">
            <Eye className="h-8 w-8 text-primary-600 animate-pulse" />
            <div className="text-xl font-semibold text-gray-900">Loading stores...</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-primary-100 flex items-center justify-center p-4">
      <div className="w-full max-w-4xl">
        {/* Header */}
        <div className="text-center mb-6 sm:mb-8">
          <div className="flex items-center justify-center space-x-2 sm:space-x-3 mb-4">
            <Eye className="h-10 w-10 sm:h-12 sm:w-12 text-primary-600" />
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Kashmir Optical</h1>
              <p className="text-primary-600 text-sm sm:text-base">Management System</p>
            </div>
          </div>
          <p className="text-gray-600 text-base sm:text-lg">
            {step === 'select' ? 'Select your store to continue' : 'Enter your PIN to access the store'}
          </p>

          {/* Super Admin Access Button */}
          <button
            onClick={() => setShowSuperAdminLogin(true)}
            className="mt-4 inline-flex items-center space-x-2 text-sm text-gray-500 hover:text-red-600 transition-colors"
          >
            <Shield className="h-4 w-4" />
            <span>Super Admin Access</span>
          </button>
        </div>

        {error && (
          <div className="max-w-md mx-auto mb-6 bg-red-50 border border-red-200 rounded-lg p-4 flex items-center space-x-3">
            <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0" />
            <span className="text-red-700">{error}</span>
          </div>
        )}

        {step === 'select' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 max-w-full sm:max-w-6xl mx-auto">
            {stores.map((store) => (
              <div
                key={store.id}
                onClick={() => handleStoreSelect(store)}
                className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer transform hover:scale-105 border border-gray-200 hover:border-primary-300"
              >
                <div className="p-4">
                  <div className="flex items-center space-x-3 sm:space-x-4 mb-4">
                    <div className="bg-primary-100 rounded-lg flex-shrink-0">
                      <Store className="h-6 w-6 sm:h-8 sm:w-8 text-primary-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg sm:text-xl font-semibold text-gray-900 truncate">{store.name}</h3>
                      <p className="text-gray-600 text-xs sm:text-sm">Click to access</p>
                    </div>
                  </div>
                  
                  <div className="space-y-2 text-sm text-gray-600">
                    {store.address && (
                      <p className="flex items-start space-x-2">
                        <span className="text-gray-400">📍</span>
                        <span>{store.address}</span>
                      </p>
                    )}
                    {store.phone && (
                      <p className="flex items-center space-x-2">
                        <span className="text-gray-400">📞</span>
                        <span>{store.phone}</span>
                      </p>
                    )}
                    {store.email && (
                      <p className="flex items-center space-x-2">
                        <span className="text-gray-400">✉️</span>
                        <span>{store.email}</span>
                      </p>
                    )}
                  </div>
                  
                  <div className="mt-4 pt-4 border-t border-gray-100">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-500">
                        Created {new Date(store.created_at).toLocaleDateString()}
                      </span>
                      <div className="flex items-center space-x-1 text-primary-600">
                        <Shield className="h-4 w-4" />
                        <span className="text-xs font-medium">Secure Access</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {step === 'authenticate' && selectedStore && (
          <div className="max-w-md mx-auto">
            <div className="bg-white rounded-xl shadow-lg p-6 sm:p-8">
              {/* Selected Store Info */}
              <div className="text-center mb-6">
                <div className="p-3 sm:p-4 bg-primary-100 rounded-lg inline-block mb-4">
                  <Store className="h-10 w-10 sm:h-12 sm:w-12 text-primary-600" />
                </div>
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900">{selectedStore.name}</h2>
                <p className="text-gray-600 text-sm sm:text-base">{selectedStore.address}</p>
              </div>

              {/* PIN Form */}
              <form onSubmit={handlePinSubmit} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Store PIN
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                      type="password"
                      value={pin}
                      onChange={handlePinChange}
                      placeholder="Enter store PIN"
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-lg tracking-widest text-center"
                      autoFocus
                      maxLength={10}
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Enter the 4-10 digit PIN for this store
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 sm:space-x-3">
                  <button
                    type="button"
                    onClick={handleBack}
                    className="flex-1 py-3 px-4 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors order-2 sm:order-1"
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    disabled={loading || !pin}
                    className="flex-1 py-3 px-4 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center space-x-2 order-1 sm:order-2"
                  >
                    {loading ? (
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <>
                        <CheckCircle className="h-5 w-5" />
                        <span>Access Store</span>
                      </>
                    )}
                  </button>
                </div>
              </form>

              {/* Security Notice */}
              <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                <div className="flex items-start space-x-3">
                  <Shield className="h-5 w-5 text-gray-600 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-gray-600">
                    <p className="font-medium mb-1">Secure Access</p>
                    <p>Your session will remain active for 24 hours. You can logout anytime from the main interface.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {stores.length === 0 && !loading && (
          <div className="max-w-md mx-auto">
            <div className="bg-white rounded-xl shadow-lg p-8 text-center">
              <Store className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-gray-900 mb-2">No Stores Available</h2>
              <p className="text-gray-600 mb-4">
                No stores have been configured yet. Please contact your administrator to set up stores.
              </p>
              <button
                onClick={loadStores}
                className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
              >
                Refresh
              </button>
            </div>
          </div>
        )}

        {/* Super Admin Login Modal */}
        <SuperAdminLogin
          isOpen={showSuperAdminLogin}
          onClose={() => setShowSuperAdminLogin(false)}
          onSuccess={handleSuperAdminSuccess}
        />
      </div>
    </div>
  );
};

export default StoreLogin;
