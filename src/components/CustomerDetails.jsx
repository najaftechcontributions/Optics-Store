import React, { useState, useEffect } from 'react';
import { X, Eye, ShoppingCart, Calendar, Phone, MapPin, User } from 'lucide-react';
import { checkupService, orderService, superAdminService } from '../utils/database';
import { useStore } from '../contexts/StoreContext';
import CheckupDisplay from './CheckupDisplay';

const CustomerDetails = ({ customer, onClose }) => {
  const { currentStore, isSuperAdmin } = useStore();
  const [checkups, setCheckups] = useState([]);
  const [orders, setOrders] = useState([]);
  const [activeTab, setActiveTab] = useState('info');

  useEffect(() => {
    if (customer) {
      loadCustomerData();
    }
  }, [customer]);

  const loadCustomerData = async () => {
    try {
      let customerCheckups = [];
      let customerOrders = [];

      if (isSuperAdmin) {
        // For super admin, get all checkups and orders then filter by customer ID
        const allCheckups = await superAdminService.getAllCheckups();
        const allOrders = await superAdminService.getAllOrders();
        customerCheckups = allCheckups.filter(checkup => checkup.customer_id === customer.id);
        customerOrders = allOrders.filter(order => order.customer_id === customer.id);
      } else {
        // For regular store access, use store ID
        const storeId = customer.store_id || currentStore?.id;
        if (storeId) {
          customerCheckups = await checkupService.getByCustomerId(customer.id, storeId);
          customerOrders = await orderService.getByCustomerId(customer.id, storeId);
        }
      }

      setCheckups(customerCheckups);
      setOrders(customerOrders);
    } catch (error) {
      console.error('Error loading customer data:', error);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatCurrency = (amount) => {
    return `Rs. ${amount?.toFixed(2) || '0.00'}`;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 no_margin_top">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <User className="h-8 w-8 text-primary-600" />
            <div>
              <h2 className="text-xl font-semibold text-gray-900">{customer.name}</h2>
              <p className="text-gray-600">{customer.phone}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            {[
              { id: 'info', name: 'Information', icon: User },
              { id: 'checkups', name: 'Checkups', icon: Eye, count: checkups.length },
              { id: 'orders', name: 'Orders', icon: ShoppingCart, count: orders.length }
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center space-x-2 py-4 border-b-2 font-medium text-sm ${
                    activeTab === tab.id
                      ? 'border-primary-500 text-primary-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span>{tab.name}</span>
                  {tab.count !== undefined && (
                    <span className="ml-1 bg-gray-100 text-gray-600 px-2 py-1 rounded-full text-xs">
                      {tab.count}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
          {activeTab === 'info' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900">Contact Information</h3>
                  <div className="space-y-3">
                    <div className="flex items-center space-x-3">
                      <Phone className="h-5 w-5 text-gray-400" />
                      <span>{customer.phone}</span>
                    </div>
                    {customer.address && (
                      <div className="flex items-start space-x-3">
                        <MapPin className="h-5 w-5 text-gray-400 mt-0.5" />
                        <span>{customer.address}</span>
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900">Optical Measurements</h3>
                  <div className="space-y-3">
                    {customer.ipd && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">I.P.D:</span>
                        <span className="font-medium">{customer.ipd}</span>
                      </div>
                    )}
                    {customer.bridge && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Bridge:</span>
                        <span className="font-medium">{customer.bridge}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="pt-4 border-t border-gray-200 text-sm text-gray-500">
                <p>Customer since: {formatDate(customer.created_at)}</p>
                {customer.updated_at !== customer.created_at && (
                  <p>Last updated: {formatDate(customer.updated_at)}</p>
                )}
              </div>
            </div>
          )}

          {activeTab === 'checkups' && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">Eye Checkup History</h3>
              {checkups.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Eye className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p>No checkups recorded yet</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {checkups.map((checkup) => (
                    <CheckupDisplay key={checkup.id} checkup={checkup} />
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'orders' && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">Order History</h3>
              {orders.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <ShoppingCart className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p>No orders placed yet</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {orders.map((order) => (
                    <div key={order.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <div className="flex items-center space-x-2 mb-1">
                            <Calendar className="h-4 w-4 text-gray-400" />
                            <span className="font-medium">Order Date: {formatDate(order.order_date)}</span>
                          </div>
                          {order.delivered_date && (
                            <div className="text-sm text-gray-600">
                              Delivered: {formatDate(order.delivered_date)}
                            </div>
                          )}
                          {order.expected_delivery_date && !order.delivered_date && (
                            <div className="text-sm text-gray-600">
                              Expected: {formatDate(order.expected_delivery_date)}
                            </div>
                          )}
                        </div>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          order.status === 'completed' ? 'bg-green-100 text-green-800' :
                          order.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {order.status}
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                        {order.frame && (
                          <div>
                            <span className="text-sm text-gray-600">Frame: </span>
                            <span className="font-medium">{order.frame}</span>
                          </div>
                        )}
                        {order.lenses && (
                          <div>
                            <span className="text-sm text-gray-600">Lenses: </span>
                            <span className="font-medium">{order.lenses}</span>
                          </div>
                        )}
                      </div>
                      
                      <div className="flex justify-between items-center pt-3 border-t border-gray-100">
                        <div className="text-sm space-x-4">
                          <span>Total: <span className="font-medium">{formatCurrency(order.total_amount)}</span></span>
                          <span>Advance: <span className="font-medium">{formatCurrency(order.advance_amount)}</span></span>
                          <span>Balance: <span className="font-medium text-red-600">{formatCurrency(order.balance_amount)}</span></span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CustomerDetails;
