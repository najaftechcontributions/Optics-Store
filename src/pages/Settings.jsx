import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Store, Save, X, Eye, EyeOff, AlertCircle, CheckCircle, Shield, Lock } from 'lucide-react';
import { storeService } from '../utils/database';
import { useStore } from '../contexts/StoreContext';
import { formatDate } from '../utils/dateUtils';
import SuperAdminLogin from '../components/SuperAdminLogin';
import { showDeleteConfirmation } from '../utils/sweetAlert';

const Settings = () => {
  const [stores, setStores] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingStore, setEditingStore] = useState(null);
  const [showPin, setShowPin] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showSuperAdminLogin, setShowSuperAdminLogin] = useState(false);
  const { currentStore, isSuperAdmin, currentSuperAdmin, loginSuperAdmin, logoutSuperAdmin, canManageStores } = useStore();

  const [formData, setFormData] = useState({
    name: '',
    address: '',
    phone: '',
    email: '',
    pin: ''
  });

  useEffect(() => {
    loadStores();
  }, [isSuperAdmin]);

  const loadStores = async () => {
    try {
      setLoading(true);
      setError(''); // Clear any previous errors

      // Use getAllWithPins for super admin to show PINs, regular getAll for store users
      const result = isSuperAdmin ? await storeService.getAllWithPins() : await storeService.getAll();
      console.log('Loaded stores:', result);

      setStores(result || []); // Ensure we always set an array
    } catch (error) {
      console.error('Error loading stores:', error);
      setError('Failed to load stores: ' + (error.message || 'Unknown error'));
      setStores([]); // Set empty array on error
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      address: '',
      phone: '',
      email: '',
      pin: ''
    });
    setEditingStore(null);
    setShowPin(false);
    setError('');
    setSuccess('');
  };

  const handleAddStore = () => {
    if (!canManageStores()) {
      setShowSuperAdminLogin(true);
      return;
    }
    resetForm();
    setShowModal(true);
  };

  const handleEditStore = (store) => {
    if (!canManageStores()) {
      setShowSuperAdminLogin(true);
      return;
    }
    setFormData({
      name: store.name || '',
      address: store.address || '',
      phone: store.phone || '',
      email: store.email || '',
      pin: ''
    });
    setEditingStore(store);
    setShowModal(true);
  };

  const handleDeleteStore = async (storeId) => {
    if (!canManageStores()) {
      setShowSuperAdminLogin(true);
      return;
    }

    if (currentStore && currentStore.id === storeId) {
      setError('Cannot delete the currently active store');
      return;
    }

    const store = stores.find(s => s.id === storeId);
    const storeName = store ? store.name : 'this store';

    const confirmed = await showDeleteConfirmation(
      storeName,
      'This will permanently remove all store data including customers, checkups, and orders. This action cannot be undone.'
    );

    if (!confirmed) {
      return;
    }

    try {
      setLoading(true);
      await storeService.delete(storeId);
      setSuccess('Store deleted successfully');
      loadStores();
    } catch (error) {
      setError('Failed to delete store');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      setError('Store name is required');
      return;
    }

    if (!formData.pin.trim()) {
      setError('PIN is required');
      return;
    }

    if (formData.pin.length < 4) {
      setError('PIN must be at least 4 characters');
      return;
    }

    try {
      setLoading(true);
      setError('');
      setSuccess('');

      if (editingStore) {
        const result = await storeService.update(editingStore.id, formData);
        console.log('Store update result:', result);
        setSuccess('Store updated successfully');
      } else {
        const result = await storeService.create(formData);
        console.log('Store create result:', result);
        setSuccess('Store created successfully');
      }

      setShowModal(false);
      resetForm();

      // Force refresh stores list with a slight delay to ensure DB operation completed
      setTimeout(async () => {
        try {
          await loadStores();
          console.log('Stores list refreshed successfully');
        } catch (refreshError) {
          console.error('Error refreshing stores:', refreshError);
          setError('Store saved but failed to refresh list. Please reload the page.');
        }
      }, 100);

    } catch (error) {
      console.error('Error saving store:', error);
      setError(error.message || 'Failed to save store');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handlePinChange = (e) => {
    const value = e.target.value.replace(/\D/g, ''); // Only allow digits
    if (value.length <= 10) {
      setFormData(prev => ({
        ...prev,
        pin: value
      }));
    }
  };

  const closeModal = () => {
    setShowModal(false);
    resetForm();
  };

  const handleSuperAdminLogin = (session) => {
    loginSuperAdmin(session);
    setSuccess('Super admin access granted');
  };

  const handleSuperAdminLogout = () => {
    logoutSuperAdmin();
    setSuccess('Super admin logged out successfully');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-col sm:flex-row gap-y-2 text-center sm:text-left">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Store Settings</h1>
          <p className="text-gray-600">Manage your optical stores and their access credentials</p>
        </div>
        <div className="flex items-center space-x-3">
          {isSuperAdmin && (
            <div className="text-nowrap flex items-center space-x-2 px-3 py-2 bg-red-100 border border-red-200 rounded-lg">
              <Shield className="h-4 w-4 text-red-600" />
              <span className="text-sm text-red-800 font-medium">Super Admin</span>
              <button
                onClick={handleSuperAdminLogout}
                className="text-nowrap text-red-600 hover:text-red-800 transition-colors"
                title="Logout Super Admin"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          )}
          <button
            onClick={handleAddStore}
            className={`text-nowrap flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
              canManageStores()
                ? 'bg-primary-600 text-white hover:bg-primary-700'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
            title={!canManageStores() ? 'Super admin access required' : 'Add new store'}
          >
            {!canManageStores() && <Lock className="h-4 w-4" />}
            <Plus className="h-5 w-5" />
            <span>Add Store</span>
          </button>
        </div>
      </div>

      {/* Alerts */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center space-x-3">
          <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0" />
          <span className="text-red-700">{error}</span>
          <button onClick={() => setError('')} className="ml-auto text-red-600 hover:text-red-800">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center space-x-3">
          <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0" />
          <span className="text-green-700">{success}</span>
          <button onClick={() => setSuccess('')} className="ml-auto text-green-600 hover:text-green-800">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Current Store Info */}
      {currentStore && (
        <div className="bg-primary-50 border border-primary-200 rounded-lg p-4">
          <div className="flex items-center space-x-3">
            <Store className="h-6 w-6 text-primary-600" />
            <div>
              <h3 className="font-semibold text-primary-900">Currently Active Store</h3>
              <p className="text-primary-700">{currentStore.name}</p>
            </div>
          </div>
        </div>
      )}

      {/* Super Admin Session Info */}
      {isSuperAdmin && currentSuperAdmin && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Shield className="h-6 w-6 text-red-600" />
              <div>
                <h3 className="font-semibold text-red-900">Super Admin Session Active</h3>
                <p className="text-red-700">
                  Logged in as {currentSuperAdmin.username} •
                  Session started {currentSuperAdmin.loginTime.toLocaleTimeString()}
                </p>
              </div>
            </div>
            <button
              onClick={handleSuperAdminLogout}
              className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700 transition-colors"
            >
              Logout
            </button>
          </div>
        </div>
      )}

      {/* Stores List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {stores.map((store) => (
          <div key={store.id} className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className={`p-2 rounded-lg ${
                  currentStore && currentStore.id === store.id 
                    ? 'bg-green-100' 
                    : 'bg-gray-100'
                }`}>
                  <Store className={`h-6 w-6 ${
                    currentStore && currentStore.id === store.id 
                      ? 'text-green-600' 
                      : 'text-gray-600'
                  }`} />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">{store.name}</h3>
                  {currentStore && currentStore.id === store.id && (
                    <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                      Active
                    </span>
                  )}
                </div>
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => handleEditStore(store)}
                  className={`p-2 rounded-lg transition-colors ${
                    canManageStores()
                      ? 'text-gray-600 hover:text-primary-600 hover:bg-primary-50'
                      : 'text-gray-400 cursor-not-allowed'
                  }`}
                  title={!canManageStores() ? 'Super admin access required' : 'Edit store'}
                >
                  <Edit className="h-4 w-4" />
                </button>
                <button
                  onClick={() => handleDeleteStore(store.id)}
                  disabled={!canManageStores() || (currentStore && currentStore.id === store.id)}
                  className={`p-2 rounded-lg transition-colors ${
                    !canManageStores()
                      ? 'text-gray-400 cursor-not-allowed'
                      : (currentStore && currentStore.id === store.id)
                      ? 'text-gray-400 cursor-not-allowed opacity-50'
                      : 'text-gray-600 hover:text-red-600 hover:bg-red-50'
                  }`}
                  title={
                    !canManageStores()
                      ? 'Super admin access required'
                      : (currentStore && currentStore.id === store.id)
                      ? 'Cannot delete active store'
                      : 'Delete store'
                  }
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="space-y-2 text-sm text-gray-600">
              {store.address && (
                <p className="flex items-start space-x-2">
                  <span>📍</span>
                  <span>{store.address}</span>
                </p>
              )}
              {store.phone && (
                <p className="flex items-center space-x-2">
                  <span>📞</span>
                  <span>{store.phone}</span>
                </p>
              )}
              {store.email && (
                <p className="flex items-center space-x-2">
                  <span>✉️</span>
                  <span>{store.email}</span>
                </p>
              )}
              {/* Show PIN only to super admin */}
              {isSuperAdmin && store.pin && (
                <p className="flex items-center space-x-2">
                  <span>🔐</span>
                  <span className="font-mono bg-gray-100 px-2 py-1 rounded text-xs">{store.pin}</span>
                </p>
              )}
            </div>

            <div className="mt-4 pt-4 border-t border-gray-100">
              <p className="text-xs text-gray-500">
                Created {formatDate(store.created_at)}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Add/Edit Store Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900">
                  {editingStore ? 'Edit Store' : 'Add New Store'}
                </h2>
                <button
                  onClick={closeModal}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Store Name *
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="Enter store name"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Address
                  </label>
                  <textarea
                    name="address"
                    value={formData.address}
                    onChange={handleInputChange}
                    placeholder="Enter store address"
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Phone
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    placeholder="Enter phone number"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="Enter email address"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Access PIN *
                  </label>
                  <div className="relative">
                    <input
                      type={showPin ? 'text' : 'password'}
                      name="pin"
                      value={formData.pin}
                      onChange={handlePinChange}
                      placeholder={editingStore ? 'Enter new PIN or leave blank to keep current' : 'Enter 4-10 digit PIN'}
                      className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      required={!editingStore}
                      maxLength={10}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPin(!showPin)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPin ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    {editingStore ? 'Leave blank to keep current PIN' : 'This PIN will be required to access the store'}
                  </p>
                </div>

                <div className="flex space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={closeModal}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center space-x-2"
                  >
                    {loading ? (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <>
                        <Save className="h-4 w-4" />
                        <span>{editingStore ? 'Update' : 'Create'}</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Loading State */}
      {loading && stores.length === 0 && (
        <div className="text-center py-12">
          <div className="inline-block w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-gray-600 mt-4">Loading stores...</p>
        </div>
      )}

      {/* Empty State */}
      {!loading && stores.length === 0 && (
        <div className="text-center py-12">
          <Store className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No stores yet</h3>
          <p className="text-gray-600 mb-4">Get started by creating your first store</p>
          <button
            onClick={handleAddStore}
            className={`px-4 py-2 rounded-lg transition-colors ${
              canManageStores()
                ? 'bg-primary-600 text-white hover:bg-primary-700'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            Add Your First Store
          </button>
          {!canManageStores() && (
            <p className="text-sm text-gray-500 mt-2">
              Super admin access required to manage stores
            </p>
          )}
        </div>
      )}

      {/* Access Restriction Notice for Regular Store Users */}
      {!isSuperAdmin && currentStore && stores.length > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <Lock className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-medium text-yellow-800">Store Management Restricted</h3>
              <p className="text-yellow-700 text-sm mt-1">
                You are logged in as a store user for "{currentStore.name}".
                Store management (creating, editing, deleting stores) requires super administrator privileges.
                Contact your system administrator to request super admin access.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Super Admin Login Modal */}
      <SuperAdminLogin
        isOpen={showSuperAdminLogin}
        onClose={() => setShowSuperAdminLogin(false)}
        onSuccess={handleSuperAdminLogin}
      />
    </div>
  );
};

export default Settings;
