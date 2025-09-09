import React, { useState, useEffect } from 'react';
import { X, Save, ShoppingCart, Search, User, Calendar, DollarSign, Eye } from 'lucide-react';
import { orderService, customerService, checkupService } from '../utils/database';
import { useStore } from '../contexts/StoreContext';
import { getCurrentDateForInput, formatDateWithShortMonth } from '../utils/dateUtils';
import DatePicker from './DatePicker';

const OrderForm = ({ order, onClose }) => {
  const { currentStore } = useStore();
  const [formData, setFormData] = useState({
    customer_id: '',
    checkup_id: '',
    order_date: getCurrentDateForInput(),
    expected_delivery_date: '',
    delivered_date: '',
    frame: '',
    lenses: '',
    total_amount: '',
    advance_amount: '',
    balance_amount: '',
    status: 'pending',
    notes: ''
  });
  const [customers, setCustomers] = useState([]);
  const [checkups, setCheckups] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [customerSearch, setCustomerSearch] = useState('');
  const [filteredCustomers, setFilteredCustomers] = useState([]);
  const [showCustomerList, setShowCustomerList] = useState(false);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadCustomers();
  }, []);

  useEffect(() => {
    if (order) {
      setFormData({
        customer_id: order.customer_id || '',
        checkup_id: order.checkup_id || '',
        order_date: order.order_date || getCurrentDateForInput(),
        expected_delivery_date: order.expected_delivery_date || '',
        delivered_date: order.delivered_date || '',
        frame: order.frame || '',
        lenses: order.lenses || '',
        total_amount: order.total_amount || '',
        advance_amount: order.advance_amount || '',
        balance_amount: order.balance_amount || '',
        status: order.status || 'pending',
        notes: order.notes || ''
      });
      
      if (order.customer_id) {
        const customer = customers.find(c => c.id === order.customer_id);
        if (customer) {
          setSelectedCustomer(customer);
          setCustomerSearch(customer.name);
          loadCustomerCheckups(customer.id);
        }
      }
    }
  }, [order, customers]);

  useEffect(() => {
    filterCustomers();
  }, [customers, customerSearch]);

  useEffect(() => {
    calculateBalance();
  }, [formData.total_amount, formData.advance_amount]);

  const loadCustomers = async () => {
    if (!currentStore) return;
    try {
      const customerList = await customerService.getAll(currentStore.id);
      setCustomers(customerList);
    } catch (error) {
      console.error('Error loading customers:', error);
    }
  };

  const loadCustomerCheckups = async (customerId) => {
    if (!currentStore) return;
    try {
      const customerCheckups = await checkupService.getByCustomerId(customerId, currentStore.id);
      setCheckups(customerCheckups);
    } catch (error) {
      console.error('Error loading checkups:', error);
    }
  };

  const filterCustomers = () => {
    // Don't show dropdown when editing an order
    if (order) {
      setFilteredCustomers([]);
      setShowCustomerList(false);
      return;
    }

    if (!customerSearch) {
      setFilteredCustomers([]);
      setShowCustomerList(false);
      return;
    }

    const filtered = customers.filter(customer =>
      customer.name.toLowerCase().includes(customerSearch.toLowerCase()) ||
      customer.phone.includes(customerSearch)
    );
    setFilteredCustomers(filtered);
    setShowCustomerList(filtered.length > 0);
  };

  const handleCustomerSelect = (customer) => {
    setSelectedCustomer(customer);
    setCustomerSearch(customer.name);
    setShowCustomerList(false);
    setFormData(prev => ({ ...prev, customer_id: customer.id, checkup_id: '' }));
    loadCustomerCheckups(customer.id);
  };

  const calculateBalance = () => {
    const total = parseFloat(formData.total_amount) || 0;
    const advance = parseFloat(formData.advance_amount) || 0;
    const balance = total - advance;
    setFormData(prev => ({ ...prev, balance_amount: balance.toString() }));
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!selectedCustomer) {
      newErrors.customer = 'Please select a customer';
    }
    
    if (!formData.order_date) {
      newErrors.order_date = 'Order date is required';
    }
    
    if (!formData.total_amount || parseFloat(formData.total_amount) <= 0) {
      newErrors.total_amount = 'Total amount must be greater than 0';
    }

    if (formData.advance_amount && parseFloat(formData.advance_amount) > parseFloat(formData.total_amount)) {
      newErrors.advance_amount = 'Advance amount cannot be greater than total amount';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    if (!currentStore) {
      setErrors({ general: 'No store selected. Please login to a store first.' });
      return;
    }

    setLoading(true);

    try {
      const orderData = {
        ...formData,
        customer_id: selectedCustomer.id,
        total_amount: parseFloat(formData.total_amount),
        advance_amount: parseFloat(formData.advance_amount) || 0,
        balance_amount: parseFloat(formData.balance_amount) || 0
      };

      if (order) {
        // Update existing order
        await orderService.update(order.id, orderData, currentStore.id);
      } else {
        await orderService.create(orderData, currentStore.id);
      }
      
      onClose();
    } catch (error) {
      console.error('Error saving order:', error);
      setErrors({ general: 'Error saving order. Please try again.' });
    } finally {
      setLoading(false);
    }
  };



  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 no_margin_top">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[95vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <ShoppingCart className="h-6 w-6 text-primary-600" />
            <h2 className="text-xl font-semibold text-gray-900">
              {order ? 'Edit Order' : 'Create New Order'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto max-h-[calc(95vh-140px)] space-y-6">
          {errors.general && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              {errors.general}
            </div>
          )}

          {/* Customer Selection */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
              <User className="h-5 w-5 mr-2" />
              Customer Selection
            </h3>
            
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <input
                type="text"
                placeholder={order ? "Customer selected for this order" : "Search customer by name or phone..."}
                value={customerSearch}
                onChange={(e) => setCustomerSearch(e.target.value)}
                className={`input-field pl-10 ${errors.customer ? 'border-red-300 focus:ring-red-500' : ''}`}
                disabled={!!order}
                readOnly={!!order}
              />
              {errors.customer && <p className="text-red-500 text-sm mt-1">{errors.customer}</p>}
              
              {/* Customer dropdown - only show when not editing */}
              {showCustomerList && !order && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                  {filteredCustomers.map((customer) => (
                    <button
                      key={customer.id}
                      type="button"
                      onClick={() => handleCustomerSelect(customer)}
                      className="w-full text-left p-3 hover:bg-gray-100 border-b border-gray-100 last:border-b-0"
                    >
                      <div className="font-medium">{customer.name}</div>
                      <div className="text-sm text-gray-600">{customer.phone}</div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Selected Customer Info */}
            {selectedCustomer && (
              <div className="p-4 bg-primary-50 rounded-lg">
                <h4 className="font-medium text-primary-900 mb-2">Selected Customer:</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
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

            {/* Checkup Selection */}
            {checkups.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <Eye className="h-4 w-4 inline mr-1" />
                  Link to Checkup (Optional)
                </label>
                <select
                  name="checkup_id"
                  value={formData.checkup_id}
                  onChange={handleChange}
                  className="input-field"
                >
                  <option value="">No checkup linked</option>
                  {checkups.map((checkup) => (
                    <option key={checkup.id} value={checkup.id}>
                      {selectedCustomer.name} - {formatDateWithShortMonth(checkup.date)}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Order Details */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Order Details</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <Calendar className="h-4 w-4 inline mr-1" />
                  Order Date *
                </label>
                <DatePicker
                  name="order_date"
                  value={formData.order_date}
                  onChange={handleChange}
                  className={errors.order_date ? 'border-red-300 focus:ring-red-500' : ''}
                  placeholder="dd/mm/yyyy"
                  required
                />
                {errors.order_date && <p className="text-red-500 text-sm mt-1">{errors.order_date}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <Calendar className="h-4 w-4 inline mr-1" />
                  Expected Delivery Date
                </label>
                <DatePicker
                  name="expected_delivery_date"
                  value={formData.expected_delivery_date}
                  onChange={handleChange}
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
                  value={formData.delivered_date}
                  onChange={handleChange}
                  placeholder="dd/mm/yyyy"
                  disabled={formData.status !== 'delivered'}
                />
                {formData.status !== 'delivered' && (
                  <p className="text-xs text-gray-500 mt-1">Only available when status is "Delivered"</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Frame Details
                </label>
                <input
                  type="text"
                  name="frame"
                  value={formData.frame}
                  onChange={handleChange}
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
                  value={formData.lenses}
                  onChange={handleChange}
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
                value={formData.status}
                onChange={handleChange}
                className="input-field"
              >
                <option value="pending">Pending</option>
                <option value="processing">Processing</option>
                <option value="ready">Ready</option>
                <option value="delivered">Delivered</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Order Notes
              </label>
              <textarea
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                className="input-field"
                placeholder="Add any special instructions or notes for this order..."
                rows={3}
              />
            </div>
          </div>

          {/* Pricing */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
              <DollarSign className="h-5 w-5 mr-2" />
              Pricing Details
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Total Amount (Rs.) *
                </label>
                <input
                  type="number"
                  name="total_amount"
                  value={formData.total_amount}
                  onChange={handleChange}
                  className={`input-field ${errors.total_amount ? 'border-red-300 focus:ring-red-500' : ''}`}
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
                  value={formData.advance_amount}
                  onChange={handleChange}
                  className={`input-field ${errors.advance_amount ? 'border-red-300 focus:ring-red-500' : ''}`}
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
                  value={formData.balance_amount}
                  onChange={handleChange}
                  className="input-field bg-gray-50"
                  placeholder="0.00"
                  step="0.01"
                  readOnly
                />
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-3 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary flex-1"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-primary flex-1 flex items-center justify-center space-x-2"
              disabled={loading}
            >
              {loading ? (
                <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  <span>{order ? 'Update Order' : 'Create Order'}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default OrderForm;
