import React, { useState, useEffect } from 'react';
import { X, ShoppingCart, User, Calendar, DollarSign, Eye, Phone, MapPin } from 'lucide-react';
import { customerService, checkupService, superAdminService } from '../utils/database';
import { useStore } from '../contexts/StoreContext';
import CheckupDisplay from './CheckupDisplay';

const OrderDetails = ({ order, onClose }) => {
  const { currentStore, isSuperAdmin } = useStore();
  const [customer, setCustomer] = useState(null);
  const [checkup, setCheckup] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadOrderDetails();
  }, [order]);

  const loadOrderDetails = async () => {
    try {
      // Load customer details
      if (isSuperAdmin) {
        // For super admin, get all customers and find the one with matching ID
        const allCustomers = await superAdminService.getAllCustomers();
        const foundCustomer = allCustomers.find(c => c.id === order.customer_id);
        setCustomer(foundCustomer);
      } else {
        // For regular store users, get customers from current store
        const customers = await customerService.getAll(currentStore.id);
        const foundCustomer = customers.find(c => c.id === order.customer_id);
        setCustomer(foundCustomer);
      }

      // Load checkup details if linked
      if (order.checkup_id) {
        if (isSuperAdmin) {
          // For super admin, get all checkups and find the one with matching ID
          const allCheckups = await superAdminService.getAllCheckups();
          const foundCheckup = allCheckups.find(c => c.id === order.checkup_id);
          setCheckup(foundCheckup);
        } else {
          // For regular store users, get checkups for this customer from current store
          const checkups = await checkupService.getByCustomerId(order.customer_id, currentStore.id);
          const foundCheckup = checkups.find(c => c.id === order.checkup_id);
          setCheckup(foundCheckup);
        }
      }
    } catch (error) {
      console.error('Error loading order details:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatCurrency = (amount) => {
    return `Rs. ${amount?.toFixed(2) || '0.00'}`;
  };

  const statusColors = {
    pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    processing: 'bg-blue-100 text-blue-800 border-blue-200',
    ready: 'bg-green-100 text-green-800 border-green-200',
    delivered: 'bg-gray-100 text-gray-800 border-gray-200',
    cancelled: 'bg-red-100 text-red-800 border-red-200'
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 no_margin_top no-margin-top">
        <div className="bg-white rounded-lg p-8">
          <div className="animate-spin h-8 w-8 border-2 border-primary-600 border-t-transparent rounded-full mx-auto" />
          <p className="mt-4 text-gray-600">Loading order details...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 no_margin_top no-margin-top">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-5xl max-h-[98vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-primary-50">
          <div className="flex items-center space-x-3">
            <ShoppingCart className="h-6 w-6 text-primary-600" />
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Order Details</h2>
              <p className="text-sm text-gray-600">Order ID: #{order.id}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 p-2 hover:bg-gray-100 rounded-full"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="p-2 sm:p-6 overflow-y-auto max-h-[calc(95vh-162px)] space-y-6">
          {/* Order Summary */}
          <div className="bg-white border border-gray-200 rounded-lg p-3 sm:p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <ShoppingCart className="h-5 w-5 mr-2" />
              Order Summary
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Calendar className="h-4 w-4 text-gray-500" />
                  <span className="text-sm font-medium text-gray-700">Order Date</span>
                </div>
                <p className="text-lg font-semibold">{formatDate(order.order_date)}</p>
              </div>

              {order.expected_delivery_date && (
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <Calendar className="h-4 w-4 text-blue-500" />
                    <span className="text-sm font-medium text-gray-700">Expected Delivery</span>
                  </div>
                  <p className="text-lg font-semibold text-blue-600">{formatDate(order.expected_delivery_date)}</p>
                </div>
              )}

              {order.delivered_date && order.status === 'delivered' && (
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <Calendar className="h-4 w-4 text-green-500" />
                    <span className="text-sm font-medium text-gray-700">Delivered Date</span>
                  </div>
                  <p className="text-lg font-semibold text-green-600">{formatDate(order.delivered_date)}</p>
                </div>
              )}

              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <DollarSign className="h-4 w-4 text-gray-500" />
                  <span className="text-sm font-medium text-gray-700">Total Amount</span>
                </div>
                <p className="text-lg font-semibold text-green-600">{formatCurrency(order.total_amount)}</p>
              </div>

              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-medium text-gray-700">Status</span>
                </div>
                <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium border ${statusColors[order.status]}`}>
                  {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                </span>
              </div>
            </div>

            {/* Delivery Status for Delivered Orders */}
            {order.status === 'delivered' && (
              <div className="mt-6 pt-6 border-t border-gray-200">
                <h4 className="font-semibold text-gray-900 mb-4 flex items-center">
                  <Calendar className="h-5 w-5 mr-2 text-green-600" />
                  Delivery Status
                </h4>
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-center space-x-2 mb-3">
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    <span className="font-medium text-green-900">Order Delivered Successfully</span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    {order.expected_delivery_date && (
                      <div>
                        <span className="text-green-700">Expected Date: </span>
                        <span className="font-medium">{formatDate(order.expected_delivery_date)}</span>
                      </div>
                    )}
                    {order.delivered_date && (
                      <div>
                        <span className="text-green-700">Actual Delivery: </span>
                        <span className="font-medium">{formatDate(order.delivered_date)}</span>
                      </div>
                    )}
                    {order.expected_delivery_date && order.delivered_date && (
                      <div className="md:col-span-2">
                        {new Date(order.delivered_date) <= new Date(order.expected_delivery_date) ? (
                          <span className="text-green-600 text-sm font-medium">✓ Delivered on time</span>
                        ) : (
                          <span className="text-orange-600 text-sm font-medium">⚠ Delivered late</span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Product Details */}
            {(order.frame || order.lenses) && (
              <div className="mt-6 pt-6 border-t border-gray-200">
                <h4 className="font-semibold text-gray-900 mb-3">Product Details</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {order.frame && (
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <span className="text-sm font-medium text-gray-700">Frame:</span>
                      <p className="text-lg font-semibold">{order.frame}</p>
                    </div>
                  )}
                  {order.lenses && (
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <span className="text-sm font-medium text-gray-700">Lenses:</span>
                      <p className="text-lg font-semibold">{order.lenses}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Order Notes */}
            {order.notes && (
              <div className="mt-6 pt-6 border-t border-gray-200">
                <h4 className="font-semibold text-gray-900 mb-3">Order Notes</h4>
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <p className="text-gray-800 whitespace-pre-wrap">{order.notes}</p>
                </div>
              </div>
            )}

            {/* Payment Details */}
            <div className="mt-6 pt-6 border-t border-gray-200">
              <h4 className="font-semibold text-gray-900 mb-3">Payment Details</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <span className="text-sm font-medium text-blue-700">Total Amount</span>
                  <p className="text-xl font-bold text-blue-900">{formatCurrency(order.total_amount)}</p>
                </div>
                <div className="bg-green-50 p-4 rounded-lg">
                  <span className="text-sm font-medium text-green-700">Advance Paid</span>
                  <p className="text-xl font-bold text-green-900">{formatCurrency(order.advance_amount)}</p>
                </div>
                <div className={`p-4 rounded-lg ${order.balance_amount > 0 ? 'bg-red-50' : 'bg-gray-50'}`}>
                  <span className={`text-sm font-medium ${order.balance_amount > 0 ? 'text-red-700' : 'text-gray-700'}`}>
                    Balance Due
                  </span>
                  <p className={`text-xl font-bold ${order.balance_amount > 0 ? 'text-red-900' : 'text-gray-900'}`}>
                    {formatCurrency(order.balance_amount)}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Customer Information */}
          {customer && (
            <div className="bg-white border border-gray-200 rounded-lg p-3 sm:p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <User className="h-5 w-5 mr-2" />
                Customer Information
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex items-center space-x-3">
                    <User className="h-5 w-5 text-gray-500" />
                    <div>
                      <span className="text-sm font-medium text-gray-700">Name</span>
                      <p className="text-lg font-semibold">{customer.name}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    <Phone className="h-5 w-5 text-gray-500" />
                    <div>
                      <span className="text-sm font-medium text-gray-700">Phone</span>
                      <p className="text-lg font-semibold">{customer.phone}</p>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-4">
                  {customer.address && (
                    <div className="flex items-start space-x-3">
                      <MapPin className="h-5 w-5 text-gray-500 mt-1" />
                      <div>
                        <span className="text-sm font-medium text-gray-700">Address</span>
                        <p className="text-lg">{customer.address}</p>
                      </div>
                    </div>
                  )}
                  
                  {customer.remarks && (
                    <div className="mt-4">
                      <span className="text-sm font-medium text-gray-700">Customer Remarks</span>
                      <div className="mt-2 p-3 bg-gray-50 rounded-lg">
                        <p className="text-gray-900 whitespace-pre-wrap">{customer.remarks}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Linked Checkup Details */}
          {checkup ? (
            <div className="bg-white border border-gray-200 rounded-lg p-3 sm:p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <Eye className="h-5 w-5 mr-2" />
                Prescription Details (from linked checkup)
              </h3>
              <div className="bg-green-50 p-4 rounded-lg mb-4">
                <p className="text-green-800 text-sm">
                  <strong>✓ This order is linked to a checkup.</strong> The prescription details below were used for the glasses.
                </p>
              </div>
              <CheckupDisplay checkup={checkup} showHeader={true} compact={false} />
            </div>
          ) : order.checkup_id ? (
            <div className="bg-white border border-gray-200 rounded-lg p-3 sm:p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <Eye className="h-5 w-5 mr-2" />
                Prescription Details
              </h3>
              <div className="bg-yellow-50 p-4 rounded-lg">
                <p className="text-yellow-800 text-sm">
                  <strong>⚠ Linked checkup not found.</strong> This order was linked to a checkup, but the checkup details are not available.
                </p>
              </div>
            </div>
          ) : (
            <div className="bg-white border border-gray-200 rounded-lg p-3 sm:p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <Eye className="h-5 w-5 mr-2" />
                Prescription Details
              </h3>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-gray-600 text-sm">
                  <strong>ℹ No checkup linked.</strong> This order was not linked to any specific checkup. The prescription may have been provided separately or from previous records.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end p-6 border-t border-gray-200 bg-gray-50">
          <button
            onClick={onClose}
            className="btn-primary"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default OrderDetails;
