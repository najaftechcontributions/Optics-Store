import React, { useState, useEffect } from 'react';
import { Search, Plus, ShoppingCart, Eye, Calendar, DollarSign, Edit, Trash2 } from 'lucide-react';
import { orderService, customerService, superAdminService } from '../utils/database';
import { useStore } from '../contexts/StoreContext';
import { getCurrentDateForInput, formatDateWithShortMonth } from '../utils/dateUtils';
import OrderForm from '../components/OrderForm';
import OrderDetails from '../components/OrderDetails';
import { showInfo, showDeleteConfirmation } from '../utils/sweetAlert';

const Orders = () => {
  const { currentStore, isSuperAdmin } = useStore();
  const [orders, setOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showForm, setShowForm] = useState(false);
  const [editingOrder, setEditingOrder] = useState(null);
  const [viewingOrder, setViewingOrder] = useState(null);

  useEffect(() => {
    loadOrders();
  }, []);

  useEffect(() => {
    filterOrders();
  }, [orders, searchTerm, statusFilter]);

  const loadOrders = async () => {
    if (!currentStore && !isSuperAdmin) return;
    try {
      let orderList;
      if (isSuperAdmin) {
        orderList = await superAdminService.getAllOrders();
      } else {
        orderList = await orderService.getAll(currentStore.id);
      }
      setOrders(orderList);
    } catch (error) {
      console.error('Error loading orders:', error);
    }
  };

  const filterOrders = () => {
    let filtered = [...orders];

    if (searchTerm) {
      filtered = filtered.filter(order =>
        order.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.customer_phone.includes(searchTerm) ||
        order.id.toString().includes(searchTerm) ||
        (isSuperAdmin && order.store_name && order.store_name.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(order => order.status === statusFilter);
    }

    setFilteredOrders(filtered);
  };

  const handleAddOrder = () => {
    if (isSuperAdmin) {
      showInfo(
        'Access Restricted',
        'Super admin cannot add orders. Please login to a specific store to add orders.'
      );
      return;
    }
    setEditingOrder(null);
    setShowForm(true);
  };

  const handleEditOrder = (order) => {
    if (isSuperAdmin) {
      showInfo(
        'Access Restricted',
        'Super admin cannot edit orders. Please login to a specific store to edit orders.'
      );
      return;
    }
    setEditingOrder(order);
    setShowForm(true);
  };

  const handleFormClose = () => {
    setShowForm(false);
    setEditingOrder(null);
    loadOrders();
  };

  const handleViewOrder = (order) => {
    setViewingOrder(order);
  };

  const handleViewClose = () => {
    setViewingOrder(null);
  };

  const handleStatusUpdate = async (orderId, newStatus) => {
    if (isSuperAdmin) {
      showInfo(
        'Access Restricted',
        'Super admin cannot update order status. Please login to a specific store to update orders.'
      );
      return;
    }

    try {
      const orderToUpdate = orders.find(o => o.id === orderId);
      if (!orderToUpdate) return;

      let updateData = { ...orderToUpdate, status: newStatus };

      // Auto-set delivered date when status changes to delivered
      if (newStatus === 'delivered' && !orderToUpdate.delivered_date) {
        updateData.delivered_date = getCurrentDateForInput();
      }

      // Clear delivered date if status changes away from delivered
      if (newStatus !== 'delivered' && orderToUpdate.delivered_date) {
        updateData.delivered_date = null;
      }

      await orderService.update(orderId, updateData, currentStore.id);
      loadOrders();
    } catch (error) {
      console.error('Error updating order status:', error);
    }
  };

  const handleDeleteOrder = async (order) => {
    if (isSuperAdmin) {
      showInfo(
        'Access Restricted',
        'Super admin cannot delete orders. Please login to a specific store to delete orders.'
      );
      return;
    }

    const confirmed = await showDeleteConfirmation(
      `Order #${order.id}`,
      `Are you sure you want to delete this order for ${order.customer_name}? This action cannot be undone.`
    );

    if (confirmed) {
      try {
        await orderService.delete(order.id, currentStore.id);
        loadOrders();
        showInfo('Success', 'Order deleted successfully', 'success');
      } catch (error) {
        console.error('Error deleting order:', error);
        showInfo('Error', 'Failed to delete order. Please try again.', 'error');
      }
    }
  };



  const formatCurrency = (amount) => {
    return `Rs. ${amount?.toFixed(2) || '0.00'}`;
  };

  const statusColors = {
    pending: 'bg-yellow-100 text-yellow-800',
    processing: 'bg-blue-100 text-blue-800',
    ready: 'bg-green-100 text-green-800',
    delivered: 'bg-gray-100 text-gray-800',
    cancelled: 'bg-red-100 text-red-800'
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Order Management</h1>
          <p className="text-gray-600">
            {isSuperAdmin ? 'View orders across all stores' : 'Manage customer orders and track delivery status'}
          </p>
        </div>
        {!isSuperAdmin && (
          <button
            onClick={handleAddOrder}
            className="btn-primary flex items-center justify-center space-x-2 w-full sm:w-auto"
          >
            <Plus className="h-4 w-4" />
            <span>New Order</span>
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="card">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            <input
              type="text"
              placeholder={isSuperAdmin ? "Search by order ID, customer, phone, or store..." : "Search by order ID, customer name, or phone..."}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input-field pl-10"
            />
          </div>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="input-field"
          >
            <option value="all">All Orders</option>
            <option value="pending">Pending</option>
            <option value="processing">Processing</option>
            <option value="ready">Ready</option>
            <option value="delivered">Delivered</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      {/* Orders List */}
      <div className="card">
        <div className="space-y-4">
          <h2 className="text-base sm:text-lg font-semibold text-gray-900">
            {isSuperAdmin ? 'All Orders' : 'Orders'} ({filteredOrders.length})
          </h2>
          
          {filteredOrders.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <ShoppingCart className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>No orders found</p>
              {searchTerm && (
                <p className="text-sm">Try adjusting your search terms</p>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {filteredOrders.map((order) => (
                <div
                  key={order.id}
                  className="border border-gray-200 rounded-lg p-4 sm:p-6 hover:shadow-md transition-shadow"
                >
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4 mb-4">
                    <div className="flex items-start space-x-3 sm:space-x-4 flex-1 min-w-0">
                      <div className="bg-primary-100 p-2 sm:p-3 rounded-full flex-shrink-0">
                        <ShoppingCart className="h-5 w-5 sm:h-6 sm:w-6 text-primary-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold text-gray-900 text-base sm:text-lg truncate">{order.customer_name}</h3>
                          <span className="text-xs font-mono bg-gray-100 text-gray-600 px-2 py-1 rounded">#{order.id}</span>
                        </div>
                        <p className="text-gray-600 text-sm sm:text-base">{order.customer_phone}</p>
                        {isSuperAdmin && order.store_name && (
                          <p className="text-xs sm:text-sm text-blue-600 font-medium mt-1">{order.store_name}</p>
                        )}
                        <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-4 mt-1 text-xs sm:text-sm text-gray-500 space-y-1 sm:space-y-0">
                          <span className="flex items-center space-x-1">
                            <Calendar className="h-3 w-3 sm:h-4 sm:w-4" />
                            <span>Ordered: {formatDateWithShortMonth(order.order_date)}</span>
                          </span>
                          {order.expected_delivery_date && (
                            <span className="flex items-center space-x-1">
                              <Calendar className="h-3 w-3 sm:h-4 sm:w-4 text-blue-500" />
                              <span>Expected: {formatDateWithShortMonth(order.expected_delivery_date)}</span>
                            </span>
                          )}
                          {order.delivered_date && order.status === 'delivered' && (
                            <span className="flex items-center space-x-1">
                              <Calendar className="h-3 w-3 sm:h-4 sm:w-4 text-green-500" />
                              <span>Delivered: {formatDateWithShortMonth(order.delivered_date)}</span>
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2 flex-shrink-0">
                      <select
                        value={order.status}
                        onChange={(e) => handleStatusUpdate(order.id, e.target.value)}
                        disabled={isSuperAdmin}
                        className={`px-2 sm:px-3 py-1 rounded-full text-xs font-medium border-0 focus:ring-2 focus:ring-primary-500 ${statusColors[order.status]} ${isSuperAdmin ? 'opacity-60 cursor-not-allowed' : ''}`}
                      >
                        <option value="pending">Pending</option>
                        <option value="processing">Processing</option>
                        <option value="ready">Ready</option>
                        <option value="delivered">Delivered</option>
                        <option value="cancelled">Cancelled</option>
                      </select>
                      <button
                        onClick={() => handleViewOrder(order)}
                        className="p-1 text-gray-400 hover:text-blue-600"
                        title="View Details"
                      >
                        <Eye className="h-3 w-3 sm:h-4 sm:w-4" />
                      </button>
                      {!isSuperAdmin && (
                        <>
                          <button
                            onClick={() => handleEditOrder(order)}
                            className="p-1 text-gray-400 hover:text-primary-600"
                            title="Edit Order"
                          >
                            <Edit className="h-3 w-3 sm:h-4 sm:w-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteOrder(order)}
                            className="p-1 text-gray-400 hover:text-red-600"
                            title="Delete Order"
                          >
                            <Trash2 className="h-3 w-3 sm:h-4 sm:w-4" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-4">
                    {order.frame && (
                      <div>
                        <span className="text-sm text-gray-600">Frame:</span>
                        <p className="font-medium">{order.frame}</p>
                      </div>
                    )}
                    {order.lenses && (
                      <div>
                        <span className="text-sm text-gray-600">Lenses:</span>
                        <p className="font-medium">{order.lenses}</p>
                      </div>
                    )}
                    <div>
                      <span className="text-xs sm:text-sm text-gray-600">Total Amount:</span>
                      <p className="font-medium text-sm sm:text-lg">{formatCurrency(order.total_amount)}</p>
                    </div>
                    <div>
                      <span className="text-xs sm:text-sm text-gray-600">Balance:</span>
                      <p className={`font-medium text-sm sm:text-base ${order.balance_amount > 0 ? 'text-red-600' : 'text-green-600'}`}>
                        {formatCurrency(order.balance_amount)}
                      </p>
                    </div>
                  </div>

                  {/* Delivery Status Indicator */}
                  {(order.expected_delivery_date || order.delivered_date) && (
                    <div className="mb-4 p-3 rounded-lg border">
                      <div className="flex items-center justify-between">
                        <h4 className="text-sm font-medium text-gray-700">Delivery Status</h4>
                        {order.status === 'delivered' ? (
                          <span className="inline-flex items-center text-xs font-medium text-green-700 bg-green-100 px-2 py-1 rounded-full">
                            ✓ Delivered
                          </span>
                        ) : order.expected_delivery_date ? (
                          <span className="inline-flex items-center text-xs font-medium text-blue-700 bg-blue-100 px-2 py-1 rounded-full">
                            📅 Scheduled
                          </span>
                        ) : null}
                      </div>
                      <div className="mt-2 text-xs text-gray-600 space-y-1">
                        {order.expected_delivery_date && (
                          <div>Expected: {formatDateWithShortMonth(order.expected_delivery_date)}</div>
                        )}
                        {order.delivered_date && order.status === 'delivered' && (
                          <div className="text-green-600">Delivered: {formatDateWithShortMonth(order.delivered_date)}</div>
                        )}
                        {order.expected_delivery_date && order.delivered_date && order.status === 'delivered' && (
                          <div className={`font-medium ${
                            new Date(order.delivered_date) <= new Date(order.expected_delivery_date)
                              ? 'text-green-600' : 'text-orange-600'
                          }`}>
                            {new Date(order.delivered_date) <= new Date(order.expected_delivery_date)
                              ? '✓ On time' : '⚠ Late delivery'
                            }
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Order Notes */}
                  {order.notes && (
                    <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <h5 className="text-sm font-medium text-gray-700 mb-1">Notes:</h5>
                      <p className="text-sm text-gray-600 whitespace-pre-wrap">{order.notes}</p>
                    </div>
                  )}

                  <div className="flex justify-end pt-4 border-t border-gray-100">
                    <div className="flex space-x-2 text-xs sm:text-sm">
                      <span>Advance: <span className="font-medium">{formatCurrency(order.advance_amount)}</span></span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Order Form Modal */}
      {showForm && !isSuperAdmin && (
        <OrderForm
          order={editingOrder}
          onClose={handleFormClose}
        />
      )}

      {/* Order Details Modal */}
      {viewingOrder && (
        <OrderDetails
          order={viewingOrder}
          onClose={handleViewClose}
        />
      )}
    </div>
  );
};

export default Orders;
