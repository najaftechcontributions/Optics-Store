import React, { useState, useEffect } from 'react';
import { Search, Plus, Eye, Calendar, User, ArrowLeft, FileText, Clock } from 'lucide-react';
import { customerService, checkupService, superAdminService } from '../utils/database';
import { useStore } from '../contexts/StoreContext';
import { formatDateWithShortMonth } from '../utils/dateUtils';
import CheckupForm from '../components/CheckupForm';
import CheckupDisplay from '../components/CheckupDisplay';
import { showInfo, showDeleteConfirmation, showError } from '../utils/sweetAlert';

const Checkups = () => {
  const { currentStore, isSuperAdmin } = useStore();
  const [customers, setCustomers] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [customerCheckups, setCustomerCheckups] = useState([]);
  const [allCheckups, setAllCheckups] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingCheckup, setEditingCheckup] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredCustomers, setFilteredCustomers] = useState([]);
  const [filteredCheckups, setFilteredCheckups] = useState([]);
  const [viewMode, setViewMode] = useState('list'); // 'list' or 'customer'

  useEffect(() => {
    if (isSuperAdmin) {
      loadAllCheckups();
    } else {
      loadCustomers();
    }
  }, [isSuperAdmin]);

  useEffect(() => {
    if (isSuperAdmin) {
      filterCheckups();
    } else {
      filterCustomers();
    }
  }, [customers, allCheckups, searchTerm, isSuperAdmin]);

  const loadCustomers = async () => {
    if (!currentStore) return;
    try {
      const customerList = await customerService.getAll(currentStore.id);
      setCustomers(customerList);
    } catch (error) {
      console.error('Error loading customers:', error);
    }
  };

  const loadAllCheckups = async () => {
    try {
      const checkupList = await superAdminService.getAllCheckups();
      setAllCheckups(checkupList);
    } catch (error) {
      console.error('Error loading checkups:', error);
    }
  };

  const filterCustomers = () => {
    if (!searchTerm) {
      setFilteredCustomers(customers);
      return;
    }

    const filtered = customers.filter(customer =>
      customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.phone.includes(searchTerm)
    );
    setFilteredCustomers(filtered);
  };

  const filterCheckups = () => {
    if (!searchTerm) {
      setFilteredCheckups(allCheckups);
      return;
    }

    const filtered = allCheckups.filter(checkup =>
      checkup.customer_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      checkup.customer_phone?.includes(searchTerm) ||
      checkup.store_name?.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredCheckups(filtered);
  };

  const loadCustomerCheckups = async (customerId) => {
    if (!currentStore) return;
    try {
      const checkups = await checkupService.getByCustomerId(customerId, currentStore.id);
      setCustomerCheckups(checkups);
    } catch (error) {
      console.error('Error loading customer checkups:', error);
      setCustomerCheckups([]);
    }
  };

  const handleSelectCustomer = (customer) => {
    setSelectedCustomer(customer);
    loadCustomerCheckups(customer.id);
    setViewMode('customer');
    setShowForm(false);
  };

  const handleFormClose = () => {
    setShowForm(false);
    setEditingCheckup(null);
    if (selectedCustomer) {
      loadCustomerCheckups(selectedCustomer.id); // Refresh checkups after save
    }
  };

  const handleEditCheckup = (checkup) => {
    setEditingCheckup(checkup);
    setShowForm(true);
  };

  const handleDeleteCheckup = async (checkup) => {
    if (isSuperAdmin) {
      showInfo(
        'Access Restricted',
        'Super admin cannot delete checkups. Please login to a specific store to delete checkups.'
      );
      return;
    }

    const confirmed = await showDeleteConfirmation(
      `checkup from ${formatDateWithShortMonth(checkup.date)}`,
      'This action cannot be undone.'
    );

    if (confirmed) {
      try {
        await checkupService.delete(checkup.id, currentStore.id);
        loadCustomerCheckups(selectedCustomer.id); // Refresh checkups after delete
      } catch (error) {
        console.error('Error deleting checkup:', error);
        if (error.message && error.message.includes('Cannot delete checkup')) {
          showError(
            'Cannot Delete Checkup',
            error.message
          );
        } else {
          showError(
            'Delete Failed',
            'Error deleting checkup. Please try again.'
          );
        }
      }
    }
  };

  const handleBackToList = () => {
    setViewMode('list');
    setSelectedCustomer(null);
    setCustomerCheckups([]);
    setShowForm(false);
  };


  if (viewMode === 'customer' && selectedCustomer) {
    return (
      <div className="space-y-6">
        {/* Header with Back Button */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <button
            onClick={handleBackToList}
            className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors self-start"
          >
            <ArrowLeft className="h-4 w-4 sm:h-5 sm:w-5" />
            <span className="text-sm sm:text-base">Back to Customers</span>
          </button>
          <div className="flex-1">
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Customer Checkups</h1>
            <p className="text-gray-600 text-sm sm:text-base">View and manage eye examination records</p>
          </div>
        </div>

        {/* Customer Info Card */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center">
              <User className="h-5 w-5 mr-2" />
              Customer Information
            </h2>
            {!isSuperAdmin && (
              <button
                onClick={() => {
                  if (showForm) {
                    setShowForm(false);
                    setEditingCheckup(null);
                  } else {
                    setEditingCheckup(null);
                    setShowForm(true);
                  }
                }}
                className="btn-primary flex items-center space-x-2 w-full sm:w-auto justify-center"
              >
                <Plus className="h-4 w-4" />
                <span>{showForm ? 'Cancel' : 'New Checkup'}</span>
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 p-3 sm:p-4 bg-gray-50 rounded-lg text-sm sm:text-base">
            <div>
              <span className="font-medium text-gray-700">Name:</span>
              <span className="ml-2">{selectedCustomer.name}</span>
            </div>
            <div>
              <span className="font-medium text-gray-700">Phone:</span>
              <span className="ml-2">{selectedCustomer.phone}</span>
            </div>
            <div className="md:col-span-2">
              <span className="font-medium text-gray-700">Address:</span>
              <span className="ml-2">{selectedCustomer.address || 'Not provided'}</span>
            </div>
            {selectedCustomer.remarks && (
              <div className="md:col-span-2">
                <span className="font-medium text-gray-700">Remarks:</span>
                <span className="ml-2">{selectedCustomer.remarks}</span>
              </div>
            )}
          </div>
        </div>

        {/* New/Edit Checkup Form */}
        {showForm && (
          <CheckupForm
            customer={selectedCustomer}
            checkup={editingCheckup}
            onClose={handleFormClose}
          />
        )}

        {/* Previous Checkups */}
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <FileText className="h-5 w-5 mr-2" />
            Previous Checkups ({customerCheckups.length})
          </h2>

          {customerCheckups.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Eye className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>No previous checkups found</p>
              <p className="text-sm">This customer hasn't had any eye examinations yet.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {customerCheckups.map((checkup) => (
                <CheckupDisplay
                  key={checkup.id}
                  checkup={checkup}
                  showActions={!isSuperAdmin}
                  onEdit={!isSuperAdmin ? handleEditCheckup : undefined}
                  onDelete={!isSuperAdmin ? handleDeleteCheckup : undefined}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Eye Checkups</h1>
          <p className="text-gray-600 text-sm sm:text-base">
            {isSuperAdmin ? 'View checkups across all stores' : 'Perform eye examinations and record measurements'}
          </p>
        </div>
      </div>

      {isSuperAdmin ? (
        /* Super Admin - All Checkups View */
        <div className="card">
          <h2 className="text-base sm:text-lg font-semibold text-gray-900 mb-4">All Checkups</h2>

          {/* Search */}
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            <input
              type="text"
              placeholder="Search by customer name, phone, or store..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input-field pl-10"
            />
          </div>

          {/* Checkups List */}
          {filteredCheckups.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Eye className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>No checkups found</p>
              {searchTerm && (
                <p className="text-sm">Try adjusting your search terms</p>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {filteredCheckups.map((checkup) => (
                <div key={checkup.id} className="border border-gray-200 rounded-lg p-3 sm:p-4">
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3 mb-3">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-900 text-sm sm:text-base truncate">{checkup.customer_name}</h3>
                      <p className="text-xs sm:text-sm text-gray-600">{checkup.customer_phone}</p>
                      {checkup.store_name && (
                        <p className="text-xs text-blue-600 font-medium mt-1">{checkup.store_name}</p>
                      )}
                    </div>
                    <div className="text-xs sm:text-sm text-gray-500">
                      <span className="flex items-center space-x-1">
                        <Calendar className="h-3 w-3 sm:h-4 sm:w-4" />
                        <span>{formatDateWithShortMonth(checkup.date)}</span>
                      </span>
                      {checkup.tested_by && (
                        <p className="mt-1">Tested by: {checkup.tested_by}</p>
                      )}
                    </div>
                  </div>

                  <CheckupDisplay
                    checkup={checkup}
                    showActions={false}
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        /* Store User - Customer Selection */
        <div className="card">
          <h2 className="text-base sm:text-lg font-semibold text-gray-900 mb-4">Select Customer for Checkup</h2>

          {/* Search */}
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            <input
              type="text"
              placeholder="Search customer by name or phone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input-field pl-10"
            />
          </div>

          {/* Customer List */}
          {filteredCustomers.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <User className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>No customers found</p>
              {searchTerm && (
                <p className="text-sm">Try adjusting your search terms</p>
              )}
            </div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {filteredCustomers.map((customer) => (
                <button
                  key={customer.id}
                  onClick={() => handleSelectCustomer(customer)}
                  className="text-left p-3 sm:p-4 border border-gray-200 rounded-lg hover:border-primary-500 hover:shadow-md transition-all"
                >
                  <div className="flex items-center space-x-3">
                    <div className="bg-primary-100 p-2 rounded-full flex-shrink-0">
                      <User className="h-4 w-4 sm:h-5 sm:w-5 text-primary-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-gray-900 text-sm sm:text-base truncate">{customer.name}</h3>
                      <p className="text-xs sm:text-sm text-gray-600">{customer.phone}</p>
                      <p className="text-xs text-gray-500">
                        Customer since {formatDateWithShortMonth(customer.created_at)}
                      </p>
                    </div>
                    <Eye className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400 flex-shrink-0" />
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Checkups;
