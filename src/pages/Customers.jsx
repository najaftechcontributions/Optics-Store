import React, { useState, useEffect } from 'react';
import { Search, Plus, Edit, Eye, Phone, MapPin, Users } from 'lucide-react';
import { customerService, superAdminService } from '../utils/database';
import { useStore } from '../contexts/StoreContext';
import CustomerForm from '../components/CustomerForm';
import CustomerDetails from '../components/CustomerDetails';
import { showInfo } from '../utils/sweetAlert';

const Customers = () => {
  const { currentStore, isSuperAdmin } = useStore();
  const [customers, setCustomers] = useState([]);
  const [filteredCustomers, setFilteredCustomers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    loadCustomers();
  }, []);

  useEffect(() => {
    filterCustomers();
  }, [customers, searchTerm]);

  const loadCustomers = async () => {
    if (!currentStore && !isSuperAdmin) return;
    try {
      let customerList;
      if (isSuperAdmin) {
        customerList = await superAdminService.getAllCustomers();
      } else {
        customerList = await customerService.getAll(currentStore.id);
      }
      setCustomers(customerList);
    } catch (error) {
      console.error('Error loading customers:', error);
    }
  };

  const filterCustomers = () => {
    if (!searchTerm) {
      setFilteredCustomers(customers);
      return;
    }

    const filtered = customers.filter(customer =>
      customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.phone.includes(searchTerm) ||
      (isSuperAdmin && customer.store_name && customer.store_name.toLowerCase().includes(searchTerm.toLowerCase()))
    );
    setFilteredCustomers(filtered);
  };

  const handleAddCustomer = () => {
    if (isSuperAdmin) {
      showInfo(
        'Access Restricted',
        'Super admin cannot add customers. Please login to a specific store to add customers.'
      );
      return;
    }
    setEditingCustomer(null);
    setShowForm(true);
  };

  const handleEditCustomer = (customer) => {
    if (isSuperAdmin) {
      showInfo(
        'Access Restricted',
        'Super admin cannot edit customers. Please login to a specific store to edit customers.'
      );
      return;
    }
    setEditingCustomer(customer);
    setShowForm(true);
  };

  const handleViewCustomer = (customer) => {
    setSelectedCustomer(customer);
    setShowDetails(true);
  };

  const handleFormClose = () => {
    setShowForm(false);
    setEditingCustomer(null);
    loadCustomers();
  };

  const handleDetailsClose = () => {
    setShowDetails(false);
    setSelectedCustomer(null);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Customer Management</h1>
          <p className="text-gray-600">
            {isSuperAdmin ? 'View customers across all stores' : 'Manage customer information and records'}
          </p>
        </div>
        {!isSuperAdmin && (
          <button
            onClick={handleAddCustomer}
            className="btn-primary flex items-center justify-center space-x-2 w-full sm:w-auto"
          >
            <Plus className="h-4 w-4" />
            <span>Add Customer</span>
          </button>
        )}
      </div>

      {/* Search */}
      <div className="card">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
          <input
            type="text"
            placeholder={isSuperAdmin ? "Search by name, phone, or store..." : "Search by name or phone number..."}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input-field pl-10"
          />
        </div>
      </div>

      {/* Customer List */}
      <div className="card">
        <div className="space-y-4">
          <h2 className="text-base sm:text-lg font-semibold text-gray-900">
            {isSuperAdmin ? 'All Customers' : 'Customers'} ({filteredCustomers.length})
          </h2>
          
          {filteredCustomers.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Users className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>No customers found</p>
              {searchTerm && (
                <p className="text-sm">Try adjusting your search terms</p>
              )}
            </div>
          ) : (
            <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
              {filteredCustomers.map((customer) => (
                <div
                  key={customer.id}
                  className="border border-gray-200 rounded-lg p-3 sm:p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-900 truncate">{customer.name}</h3>
                      {isSuperAdmin && customer.store_name && (
                        <p className="text-xs text-blue-600 font-medium mt-1">{customer.store_name}</p>
                      )}
                    </div>
                    <div className="flex space-x-1 ml-2">
                      <button
                        onClick={() => handleViewCustomer(customer)}
                        className="p-1 text-gray-400 hover:text-primary-600"
                        title="View Details"
                      >
                        <Eye className="h-3 w-3 sm:h-4 sm:w-4" />
                      </button>
                      {!isSuperAdmin && (
                        <button
                          onClick={() => handleEditCustomer(customer)}
                          className="p-1 text-gray-400 hover:text-primary-600"
                          title="Edit Customer"
                        >
                          <Edit className="h-3 w-3 sm:h-4 sm:w-4" />
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2 text-xs sm:text-sm text-gray-600">
                    <div className="flex items-center space-x-2">
                      <Phone className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                      <span className="truncate">{customer.phone}</span>
                    </div>
                    {customer.address && (
                      <div className="flex items-center space-x-2">
                        <MapPin className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                        <span className="truncate">{customer.address}</span>
                      </div>
                    )}
                    {customer.ipd && (
                      <div className="text-xs text-gray-500">
                        IPD: {customer.ipd} {customer.bridge && `| Bridge: ${customer.bridge}`}
                      </div>
                    )}
                  </div>

                  <div className="mt-3 pt-3 border-t border-gray-100 text-xs text-gray-500">
                    Added: {new Date(customer.created_at).toLocaleDateString()}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Customer Form Modal */}
      {showForm && !isSuperAdmin && (
        <CustomerForm
          customer={editingCustomer}
          onClose={handleFormClose}
          onSave={loadCustomers}
        />
      )}

      {/* Customer Details Modal */}
      {showDetails && selectedCustomer && (
        <CustomerDetails
          customer={selectedCustomer}
          onClose={handleDetailsClose}
        />
      )}
    </div>
  );
};

export default Customers;
