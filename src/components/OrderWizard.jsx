import React, { useState, useEffect } from 'react';
import {
  X, Save, User, Eye, ShoppingCart, Search, Plus,
  ChevronRight, ChevronLeft, Check, Calendar, Phone,
  MapPin, DollarSign, Package, FileText
} from 'lucide-react';
import { customerService, checkupService, orderService, storeService } from '../utils/database';
import { useStore } from '../contexts/StoreContext';
import { getCurrentDateForInput, getCurrentTimestamp, formatDate } from '../utils/dateUtils';
import CheckupDisplay from './CheckupDisplay';
import DatePicker from './DatePicker';

const OrderWizard = ({ onClose }) => {
  const { currentStore, logout } = useStore();
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [customerSearch, setCustomerSearch] = useState('');
  const [customers, setCustomers] = useState([]);
  const [filteredCustomers, setFilteredCustomers] = useState([]);
  const [showNewCustomerForm, setShowNewCustomerForm] = useState(false);
  const [completedCheckup, setCompletedCheckup] = useState(null);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  // New customer form data
  const [newCustomerData, setNewCustomerData] = useState({
    name: '',
    phone: '',
    address: '',
    remarks: ''
  });

  // Checkup form data
  const [checkupData, setCheckupData] = useState({
    date: getCurrentDateForInput(),
    right_eye_spherical_dv: '',
    right_eye_cylindrical_dv: '',
    right_eye_axis_dv: '',
    right_eye_add: '',
    right_eye_spherical_nv: '',
    right_eye_cylindrical_nv: '',
    right_eye_axis_nv: '',
    left_eye_spherical_dv: '',
    left_eye_cylindrical_dv: '',
    left_eye_axis_dv: '',
    left_eye_add: '',
    left_eye_spherical_nv: '',
    left_eye_cylindrical_nv: '',
    left_eye_axis_nv: '',
    ipd_bridge: '',
    tested_by: ''
  });

  // Order form data
  const [orderData, setOrderData] = useState({
    order_date: getCurrentDateForInput(),
    expected_delivery_date: '',
    delivered_date: '',
    frame: '',
    lenses: '',
    total_amount: '',
    advance_amount: '',
    balance_amount: '',
    status: 'pending'
  });

  useEffect(() => {
    loadCustomers();
  }, []);

  useEffect(() => {
    filterCustomers();
  }, [customers, customerSearch]);

  useEffect(() => {
    calculateBalance();
  }, [orderData.total_amount, orderData.advance_amount]);

  const loadCustomers = async () => {
    if (!currentStore) return;
    try {
      const customerList = await customerService.getAll(currentStore.id);
      setCustomers(customerList);
    } catch (error) {
      console.error('Error loading customers:', error);
    }
  };

  const filterCustomers = () => {
    if (!customerSearch) {
      setFilteredCustomers([]);
      return;
    }

    const filtered = customers.filter(customer =>
      customer.name.toLowerCase().includes(customerSearch.toLowerCase()) ||
      customer.phone.includes(customerSearch)
    );
    setFilteredCustomers(filtered);
  };

  const calculateBalance = () => {
    const total = parseFloat(orderData.total_amount) || 0;
    const advance = parseFloat(orderData.advance_amount) || 0;
    const balance = total - advance;
    setOrderData(prev => ({ ...prev, balance_amount: balance.toString() }));
  };

  const handleCustomerSelect = (customer) => {
    setSelectedCustomer(customer);
    setCustomerSearch(customer.name);
    setShowNewCustomerForm(false);
  };

  const handleNewCustomerChange = (e) => {
    const { name, value } = e.target;
    setNewCustomerData(prev => ({ ...prev, [name]: value }));
  };

  const handleCheckupChange = (e) => {
    const { name, value } = e.target;
    setCheckupData(prev => ({ ...prev, [name]: value }));
  };

  const handleOrderChange = (e) => {
    const { name, value } = e.target;
    setOrderData(prev => ({ ...prev, [name]: value }));
  };

  const validateStep = (step) => {
    const newErrors = {};

    if (step === 1) {
      if (!selectedCustomer && !showNewCustomerForm) {
        newErrors.customer = 'Please select a customer or create a new one';
      }
      if (showNewCustomerForm) {
        if (!newCustomerData.name.trim()) {
          newErrors.name = 'Name is required';
        }
        if (!newCustomerData.phone.trim()) {
          newErrors.phone = 'Phone number is required';
        }
      }
    } else if (step === 2) {
      if (!checkupData.date) {
        newErrors.checkup_date = 'Examination date is required';
      }
    } else if (step === 3) {
      if (!orderData.total_amount || parseFloat(orderData.total_amount) <= 0) {
        newErrors.total_amount = 'Total amount must be greater than 0';
      }
      if (orderData.advance_amount && parseFloat(orderData.advance_amount) > parseFloat(orderData.total_amount)) {
        newErrors.advance_amount = 'Advance amount cannot be greater than total amount';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const proceedToNextStep = async () => {
    if (!validateStep(currentStep)) {
      return;
    }

    setLoading(true);

    try {
      if (currentStep === 1) {
        // Step 1: Handle customer creation/selection
        let customer = selectedCustomer;

        if (showNewCustomerForm) {
          if (!currentStore) {
            throw new Error('No store selected');
          }

          // Validate that the store still exists in the database
          const storeExists = await storeService.getById(currentStore.id);
          if (!storeExists) {
            throw new Error('Store no longer exists. Please log in again.');
          }

          // Check if a customer with this phone number already exists in the store
          if (newCustomerData.phone.trim()) {
            const existingCustomer = await customerService.findByPhone(newCustomerData.phone.trim(), currentStore.id);
            if (existingCustomer) {
              throw new Error(`A customer with phone number "${newCustomerData.phone}" already exists: ${existingCustomer.name}. Please select the existing customer or use a different phone number.`);
            }
          }

          const result = await customerService.create(newCustomerData, currentStore.id);
          customer = {
            ...newCustomerData,
            id: result.lastInsertRowid,
            store_id: currentStore.id,
            created_at: getCurrentTimestamp(),
            updated_at: getCurrentTimestamp()
          };
          setSelectedCustomer(customer);
          setShowNewCustomerForm(false);
          setNewCustomerData({ name: '', phone: '', address: '', remarks: '' });
          loadCustomers(); // Refresh customer list
        }

        setCurrentStep(2);
      } else if (currentStep === 2) {
        // Step 2: Create checkup
        if (!currentStore) {
          throw new Error('No store selected');
        }
        if (!selectedCustomer?.id) {
          throw new Error('No customer selected');
        }

        const checkupResult = await checkupService.create({
          ...checkupData,
          customer_id: selectedCustomer.id
        }, currentStore.id);

        console.log('Checkup created with result:', checkupResult);

        const newCheckup = {
          ...checkupData,
          id: checkupResult.lastInsertRowid,
          customer_id: selectedCustomer.id,
          store_id: currentStore.id,
          created_at: getCurrentTimestamp()
        };

        console.log('Setting completed checkup:', newCheckup);
        setCompletedCheckup(newCheckup);
        setCurrentStep(3);
      } else if (currentStep === 3) {
        // Step 3: Create order
        if (!currentStore) {
          throw new Error('No store selected');
        }
        if (!selectedCustomer?.id) {
          throw new Error('No customer selected');
        }

        console.log('Creating order with data:', {
          customer_id: selectedCustomer.id,
          checkup_id: completedCheckup?.id,
          store_id: currentStore.id,
          orderData: orderData
        });

        const orderResult = await orderService.create({
          ...orderData,
          customer_id: selectedCustomer.id,
          checkup_id: completedCheckup?.id,
          total_amount: parseFloat(orderData.total_amount),
          advance_amount: parseFloat(orderData.advance_amount) || 0,
          balance_amount: parseFloat(orderData.balance_amount) || 0
        }, currentStore.id);

        // Show success message briefly before closing
        if (orderResult.lastInsertRowid) {
          console.log('Order created successfully with ID:', orderResult.lastInsertRowid);
        }

        onClose();
      }
    } catch (error) {
      console.error('Error in wizard step:', error);

      if (error.message === 'Store no longer exists. Please log in again.') {
        // Store was deleted, log out user and close wizard
        logout();
        onClose();
        alert('Your store session has expired or the store was deleted. Please log in again.');
        return;
      }

      if (error.message.includes('FOREIGN KEY constraint failed')) {
        setErrors({ general: 'Database error: Invalid store reference. Please log out and log back in.' });
      } else {
        setErrors({ general: error.message || 'An error occurred. Please try again.' });
      }
    } finally {
      setLoading(false);
    }
  };

  const goToPreviousStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const renderStepIndicator = () => {
    const steps = [
      { number: 1, title: 'Customer', icon: User },
      { number: 2, title: 'Checkup', icon: Eye },
      { number: 3, title: 'Order', icon: ShoppingCart }
    ];

    return (
      <div className="flex items-center justify-center sm:space-x-4 mb-8">
        {steps.map((step, index) => {
          const Icon = step.icon;
          const isActive = currentStep === step.number;
          const isCompleted = currentStep > step.number;
          
          return (
            <React.Fragment key={step.number}>
              <div className={`flex items-center space-x-2 ${isActive ? 'text-primary-600' : isCompleted ? 'text-green-600' : 'text-gray-400'}`}>
                <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 ${
                  isActive ? 'border-primary-600 bg-primary-50' : 
                  isCompleted ? 'border-green-600 bg-green-50' : 
                  'border-gray-300 bg-gray-50'
                }`}>
                  {isCompleted ? (
                    <Check className="h-5 w-5" />
                  ) : (
                    <Icon className="h-5 w-5" />
                  )}
                </div>
                <span className={`font-medium ${isActive ? 'text-primary-900' : isCompleted ? 'text-green-900' : 'text-gray-500'}`}>
                  {step.title}
                </span>
              </div>
              {index < steps.length - 1 && (
                <ChevronRight className="h-5 w-5 text-gray-300" />
              )}
            </React.Fragment>
          );
        })}
      </div>
    );
  };

  const renderStep1 = () => (
    <div className="space-y-6">
      <h3 className="text-xl font-semibold text-gray-900 text-center">Select or Create Customer</h3>
      
      {!showNewCustomerForm ? (
        <>
          {/* Search existing customers */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            <input
              type="text"
              placeholder="Search customer by name or phone..."
              value={customerSearch}
              onChange={(e) => setCustomerSearch(e.target.value)}
              className="input-field pl-10"
            />
          </div>

          {/* Customer list */}
          {filteredCustomers.length > 0 && (
            <div className="max-h-60 overflow-y-auto border border-gray-200 rounded-lg">
              {filteredCustomers.map((customer) => (
                <button
                  key={customer.id}
                  onClick={() => handleCustomerSelect(customer)}
                  className={`w-full text-left p-4 border-b border-gray-100 last:border-b-0 hover:bg-gray-50 transition-colors ${
                    selectedCustomer?.id === customer.id ? 'bg-primary-50 border-primary-200' : ''
                  }`}
                >
                  <div className="font-medium text-gray-900">{customer.name}</div>
                  <div className="text-sm text-gray-600">{customer.phone}</div>
                  {customer.address && (
                    <div className="text-xs text-gray-500 mt-1">{customer.address}</div>
                  )}
                </button>
              ))}
            </div>
          )}

          {/* Selected customer display */}
          {selectedCustomer && (
            <div className="p-4 bg-primary-50 rounded-lg border border-primary-200">
              <h4 className="font-medium text-primary-900 mb-2">Selected Customer:</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-primary-700">Name: </span>
                  <span className="font-medium">{selectedCustomer.name}</span>
                </div>
                <div>
                  <span className="text-primary-700">Phone: </span>
                  <span className="font-medium">{selectedCustomer.phone}</span>
                </div>
                {selectedCustomer.address && (
                  <div className="md:col-span-2">
                    <span className="text-primary-700">Address: </span>
                    <span className="font-medium">{selectedCustomer.address}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="text-center">
            <button
              onClick={() => setShowNewCustomerForm(true)}
              className="btn-secondary flex items-center space-x-2 mx-auto"
            >
              <Plus className="h-4 w-4" />
              <span>Create New Customer</span>
            </button>
          </div>
        </>
      ) : (
        <>
          {/* New customer form */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-lg font-medium text-gray-900">Create New Customer</h4>
              <button
                onClick={() => {
                setShowNewCustomerForm(false);
                setNewCustomerData({ name: '', phone: '', address: '', remarks: '' });
              }}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <User className="h-4 w-4 inline mr-1" />
                  Full Name *
                </label>
                <input
                  type="text"
                  name="name"
                  value={newCustomerData.name}
                  onChange={handleNewCustomerChange}
                  className={`input-field ${errors.name ? 'border-red-300' : ''}`}
                  placeholder="Enter customer name"
                />
                {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <Phone className="h-4 w-4 inline mr-1" />
                  Phone Number *
                </label>
                <input
                  type="text"
                  name="phone"
                  value={newCustomerData.phone}
                  onChange={handleNewCustomerChange}
                  className={`input-field ${errors.phone ? 'border-red-300' : ''}`}
                  placeholder="Enter phone number"
                />
                {errors.phone && <p className="text-red-500 text-sm mt-1">{errors.phone}</p>}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <MapPin className="h-4 w-4 inline mr-1" />
                Address
              </label>
              <textarea
                name="address"
                value={newCustomerData.address}
                onChange={handleNewCustomerChange}
                rows={2}
                className="input-field"
                placeholder="Enter customer address"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <FileText className="h-4 w-4 inline mr-1" />
                Remarks
              </label>
              <textarea
                name="remarks"
                value={newCustomerData.remarks}
                onChange={handleNewCustomerChange}
                rows={3}
                className="input-field"
                placeholder="Enter any additional notes or remarks about the customer"
              />
            </div>
          </div>
        </>
      )}

      {errors.customer && <p className="text-red-500 text-sm text-center">{errors.customer}</p>}
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-6">
      <h3 className="text-xl font-semibold text-gray-900 text-center">Eye Examination</h3>
      
      {/* Customer info recap */}
      <div className="p-4 bg-gray-50 rounded-lg">
        <h4 className="font-medium text-gray-900 mb-2 flex items-center">
          <User className="h-5 w-5 mr-2" />
          Customer: {selectedCustomer?.name}
        </h4>
        <div className="text-sm text-gray-600">
          Phone: {selectedCustomer?.phone}
        </div>
      </div>

      {/* Eye examination form */}
      <div className="space-y-6">
        {/* Date and examiner */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <Calendar className="h-4 w-4 inline mr-1" />
              Examination Date *
            </label>
            <DatePicker
              name="date"
              value={checkupData.date}
              onChange={handleCheckupChange}
              className={errors.checkup_date ? 'border-red-300' : ''}
              placeholder="dd/mm/yyyy"
              required
            />
            {errors.checkup_date && <p className="text-red-500 text-sm mt-1">{errors.checkup_date}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tested By
            </label>
            <input
              type="text"
              name="tested_by"
              value={checkupData.tested_by}
              onChange={handleCheckupChange}
              className="input-field"
              required
              placeholder="Enter examiner name"
            />
          </div>
        </div>

        {/* Eye examination grid */}
        <div className="border-2 border-gray-900 rounded-lg overflow-hidden">
          {/* Header */}
          <div className="grid grid-cols-7 bg-gray-100 border-b-2 border-gray-900">
            <div className="p-3 border-r border-gray-900 font-bold text-center hidden sm:flex items-center justify-center">Serial #</div>
            <div className="p-3 border-r border-gray-900 font-bold text-center flex sm:hidden items-center justify-center">#</div>
            <div className="col-span-3 border-r-2 border-gray-900 text-center">
              <div className="p-2 border-b border-gray-900 font-bold text-lg">RIGHT EYE</div>
              <div className="grid grid-cols-3">
                <div className="p-2 border-r border-gray-900 font-semibold">SPH</div>
                <div className="p-2 border-r border-gray-900 font-semibold">CYL</div>
                <div className="p-2 font-semibold">AXIS</div>
              </div>
            </div>
            <div className="col-span-3 text-center">
              <div className="p-2 border-b border-gray-900 font-bold text-lg">LEFT EYE</div>
              <div className="grid grid-cols-3">
                <div className="p-2 border-r border-gray-900 font-semibold">SPH</div>
                <div className="p-2 border-r border-gray-900 font-semibold">CYL</div>
                <div className="p-2 font-semibold">AXIS</div>
              </div>
            </div>
          </div>

          {/* D.V Row */}
          <div className="grid grid-cols-7 border-b border-gray-900">
            <div className="p-3 border-r border-gray-900 font-semibold bg-gray-50 flex items-center">D.V</div>
            <div className="p-2 border-r border-gray-900">
              <input
                type="text"
                name="right_eye_spherical_dv"
                value={checkupData.right_eye_spherical_dv}
                onChange={handleCheckupChange}
                className="w-full p-1 border border-gray-300 rounded text-center"
                placeholder="-"
              />
            </div>
            <div className="p-2 border-r border-gray-900">
              <input
                type="text"
                name="right_eye_cylindrical_dv"
                value={checkupData.right_eye_cylindrical_dv}
                onChange={handleCheckupChange}
                className="w-full p-1 border border-gray-300 rounded text-center"
                placeholder="-"
              />
            </div>
            <div className="p-2 border-r-2 border-gray-900">
              <input
                type="text"
                name="right_eye_axis_dv"
                value={checkupData.right_eye_axis_dv}
                onChange={handleCheckupChange}
                className="w-full p-1 border border-gray-300 rounded text-center"
                placeholder="-"
              />
            </div>
            <div className="p-2 border-r border-gray-900">
              <input
                type="text"
                name="left_eye_spherical_dv"
                value={checkupData.left_eye_spherical_dv}
                onChange={handleCheckupChange}
                className="w-full p-1 border border-gray-300 rounded text-center"
                placeholder="-"
              />
            </div>
            <div className="p-2 border-r border-gray-900">
              <input
                type="text"
                name="left_eye_cylindrical_dv"
                value={checkupData.left_eye_cylindrical_dv}
                onChange={handleCheckupChange}
                className="w-full p-1 border border-gray-300 rounded text-center"
                placeholder="-"
              />
            </div>
            <div className="p-2">
              <input
                type="text"
                name="left_eye_axis_dv"
                value={checkupData.left_eye_axis_dv}
                onChange={handleCheckupChange}
                className="w-full p-1 border border-gray-300 rounded text-center"
                placeholder="-"
              />
            </div>
          </div>

          {/* N.V Row */}
          <div className="grid grid-cols-7 border-b border-gray-900">
            <div className="p-3 border-r border-gray-900 font-semibold bg-gray-50 flex items-center">N.V</div>
            <div className="p-2 border-r border-gray-900">
              <input
                type="text"
                name="right_eye_spherical_nv"
                value={checkupData.right_eye_spherical_nv}
                onChange={handleCheckupChange}
                className="w-full p-1 border border-gray-300 rounded text-center"
                placeholder="-"
              />
            </div>
            <div className="p-2 border-r border-gray-900">
              <input
                type="text"
                name="right_eye_cylindrical_nv"
                value={checkupData.right_eye_cylindrical_nv}
                onChange={handleCheckupChange}
                className="w-full p-1 border border-gray-300 rounded text-center"
                placeholder="-"
              />
            </div>
            <div className="p-2 border-r-2 border-gray-900">
              <input
                type="text"
                name="right_eye_axis_nv"
                value={checkupData.right_eye_axis_nv}
                onChange={handleCheckupChange}
                className="w-full p-1 border border-gray-300 rounded text-center"
                placeholder="-"
              />
            </div>
            <div className="p-2 border-r border-gray-900">
              <input
                type="text"
                name="left_eye_spherical_nv"
                value={checkupData.left_eye_spherical_nv}
                onChange={handleCheckupChange}
                className="w-full p-1 border border-gray-300 rounded text-center"
                placeholder="-"
              />
            </div>
            <div className="p-2 border-r border-gray-900">
              <input
                type="text"
                name="left_eye_cylindrical_nv"
                value={checkupData.left_eye_cylindrical_nv}
                onChange={handleCheckupChange}
                className="w-full p-1 border border-gray-300 rounded text-center"
                placeholder="-"
              />
            </div>
            <div className="p-2">
              <input
                type="text"
                name="left_eye_axis_nv"
                value={checkupData.left_eye_axis_nv}
                onChange={handleCheckupChange}
                className="w-full p-1 border border-gray-300 rounded text-center"
                placeholder="-"
              />
            </div>
          </div>
          {/* ADD Section */}
          <div className="grid grid-cols-7">
            <div className="p-3 border-r border-gray-900 font-semibold bg-gray-50 flex items-center">ADD</div>
            <div className="p-2 border-r border-gray-900 col-span-3">
              <input
                type="text"
                name="right_eye_add"
                value={checkupData.right_eye_add}
                onChange={handleCheckupChange}
                placeholder="ADD value"
                className="w-full p-1 border border-gray-300 rounded text-center"
              />
            </div>
            <div className="p-2 col-span-3">
              <input
                type="text"
                name="left_eye_add"
                value={checkupData.left_eye_add}
                onChange={handleCheckupChange}
                placeholder="ADD value"
                className="w-full p-1 border border-gray-300 rounded text-center"
              />
            </div>
          </div>
        </div>


        {/* IPD Bridge details */}
        <div className="p-4 border-2 border-gray-900 rounded-lg bg-gray-50">
          <h4 className="font-bold text-left text-lg mb-3">IPD BRIDGE</h4>
          <textarea
            name="ipd_bridge"
            value={checkupData.ipd_bridge}
            onChange={handleCheckupChange}
            rows={3}
            className="w-full p-3 border border-gray-300 rounded"
            placeholder="Enter IPD Bridge details..."
          />
        </div>
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-6">
      <h3 className="text-xl font-semibold text-gray-900 text-center">Create Order</h3>
      
      {/* Customer and checkup recap */}
      <div className="space-y-4">
        <div className="p-4 bg-gray-50 rounded-lg">
          <h4 className="font-medium text-gray-900 mb-2 flex items-center">
            <User className="h-5 w-5 mr-2" />
            Customer: {selectedCustomer?.name}
          </h4>
          <div className="text-sm text-gray-600">
            Phone: {selectedCustomer?.phone}
          </div>
        </div>

        {completedCheckup && (
          <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
            <h4 className="font-medium text-green-900 mb-2 flex items-center">
              <Eye className="h-5 w-5 mr-2" />
              Eye Examination Completed
            </h4>
            <div className="text-sm text-green-800">
              Date: {formatDate(completedCheckup.date)}
              {completedCheckup.tested_by && ` | Tested by: ${completedCheckup.tested_by}`}
            </div>
          </div>
        )}
      </div>

      {/* Order form */}
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <Calendar className="h-4 w-4 inline mr-1" />
              Order Date *
            </label>
            <DatePicker
              name="order_date"
              value={orderData.order_date}
              onChange={handleOrderChange}
              placeholder="dd/mm/yyyy"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <Calendar className="h-4 w-4 inline mr-1" />
              Expected Delivery Date
            </label>
            <DatePicker
              name="expected_delivery_date"
              value={orderData.expected_delivery_date}
              onChange={handleOrderChange}
              placeholder="dd/mm/yyyy"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <Calendar className="h-4 w-4 inline mr-1" />
              Delivered Date
            </label>
            <DatePicker
              name="delivered_date"
              value={orderData.delivered_date}
              onChange={handleOrderChange}
              placeholder="dd/mm/yyyy"
              disabled={orderData.status !== 'delivered'}
            />
            {orderData.status !== 'delivered' && (
              <p className="text-xs text-gray-500 mt-1">Only available when status is "Delivered"</p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <Package className="h-4 w-4 inline mr-1" />
              Frame Details
            </label>
            <input
              type="text"
              name="frame"
              value={orderData.frame}
              onChange={handleOrderChange}
              className="input-field"
              placeholder="Enter frame details"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Lenses Details
            </label>
            <input
              type="text"
              name="lenses"
              value={orderData.lenses}
              onChange={handleOrderChange}
              className="input-field"
              placeholder="Enter lenses details"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Order Status
          </label>
          <select
            name="status"
            value={orderData.status}
            onChange={handleOrderChange}
            className="input-field"
          >
            <option value="pending">Pending</option>
            <option value="processing">Processing</option>
            <option value="ready">Ready</option>
            <option value="delivered">Delivered</option>
          </select>
        </div>

        <div className="space-y-4">
          <h4 className="text-lg font-semibold text-gray-900 flex items-center">
            <DollarSign className="h-5 w-5 mr-2" />
            Pricing Details
          </h4>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Total Amount (Rs.) *
              </label>
              <input
                type="number"
                name="total_amount"
                value={orderData.total_amount}
                onChange={handleOrderChange}
                className={`input-field ${errors.total_amount ? 'border-red-300' : ''}`}
                placeholder="0.00"
                step="0.01"
                min="0"
              />
              {errors.total_amount && <p className="text-red-500 text-sm mt-1">{errors.total_amount}</p>}
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Advance Amount (Rs.)
              </label>
              <input
                type="number"
                name="advance_amount"
                value={orderData.advance_amount}
                onChange={handleOrderChange}
                className={`input-field ${errors.advance_amount ? 'border-red-300' : ''}`}
                placeholder="0.00"
                step="0.01"
                min="0"
              />
              {errors.advance_amount && <p className="text-red-500 text-sm mt-1">{errors.advance_amount}</p>}
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Balance Amount (Rs.)
              </label>
              <input
                type="number"
                name="balance_amount"
                value={orderData.balance_amount}
                onChange={handleOrderChange}
                className="input-field bg-gray-50"
                placeholder="0.00"
                step="0.01"
                readOnly
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 no_margin_top">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[95vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Complete Order Wizard</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="p-2 sm:p-6 overflow-y-auto max-h-[calc(95vh-200px)]">
          {/* Step indicator */}
          {renderStepIndicator()}

          {/* Error display */}
          {errors.general && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
              {errors.general}
            </div>
          )}

          {/* Step content */}
          {currentStep === 1 && renderStep1()}
          {currentStep === 2 && renderStep2()}
          {currentStep === 3 && renderStep3()}

          {/* Navigation buttons */}
          <div className="flex justify-between items-center pt-6 border-t border-gray-200 mt-8">
            <button
              onClick={goToPreviousStep}
              disabled={currentStep === 1}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                currentStep === 1 
                  ? 'text-gray-400 cursor-not-allowed' 
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <ChevronLeft className="h-4 w-4" />
              <span>Previous</span>
            </button>

            <button
              onClick={proceedToNextStep}
              disabled={loading}
              className="btn-primary flex items-center space-x-2"
            >
              {loading ? (
                <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
              ) : (
                <>
                  <span>{currentStep === 3 ? 'Complete Order' : 'Next'}</span>
                  {currentStep < 3 && <ChevronRight className="h-4 w-4" />}
                  {currentStep === 3 && <Save className="h-4 w-4" />}
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderWizard;
