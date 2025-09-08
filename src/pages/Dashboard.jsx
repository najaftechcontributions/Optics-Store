import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, Eye, ShoppingCart, DollarSign, Calendar, TrendingUp, Zap, ExternalLink } from 'lucide-react';
import { customerService, orderService } from '../utils/database';
import { useStore } from '../contexts/StoreContext';
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek } from 'date-fns';
import OrderWizard from '../components/OrderWizard';
import OrderDetails from '../components/OrderDetails';

const Dashboard = () => {
  const navigate = useNavigate();
  const { currentStore } = useStore();
  const [stats, setStats] = useState({
    totalCustomers: 0,
    todayOrders: 0,
    weeklyRevenue: 0,
    monthlyRevenue: 0,
    pendingOrders: 0
  });
  const [recentOrders, setRecentOrders] = useState([]);
  const [showOrderWizard, setShowOrderWizard] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showOrderDetails, setShowOrderDetails] = useState(false);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    if (!currentStore) return;
    try {
      // Get customer count
      const customers = await customerService.getAll(currentStore.id);
      const totalCustomers = customers.length;

      // Get orders data
      const orders = await orderService.getAll(currentStore.id);
      const today = new Date();
      const todayStr = format(today, 'yyyy-MM-dd');

      // Calculate stats
      const todayOrders = orders.filter(order =>
        order.order_date.startsWith(todayStr)
      ).length;

      const weekStart = format(startOfWeek(today), 'yyyy-MM-dd');
      const weekEnd = format(endOfWeek(today), 'yyyy-MM-dd');
      const weeklyRevenue = orders
        .filter(order => order.order_date >= weekStart && order.order_date <= weekEnd)
        .reduce((sum, order) => sum + (order.total_amount || 0), 0);

      const monthStart = format(startOfMonth(today), 'yyyy-MM-dd');
      const monthEnd = format(endOfMonth(today), 'yyyy-MM-dd');
      const monthlyRevenue = orders
        .filter(order => order.order_date >= monthStart && order.order_date <= monthEnd)
        .reduce((sum, order) => sum + (order.total_amount || 0), 0);

      const pendingOrders = orders.filter(order => order.status === 'pending').length;

      setStats({
        totalCustomers,
        todayOrders,
        weeklyRevenue,
        monthlyRevenue,
        pendingOrders
      });

      // Get recent orders (last 5)
      setRecentOrders(orders.slice(0, 5));
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    }
  };

  const handleOrderWizardClose = () => {
    setShowOrderWizard(false);
    loadDashboardData(); // Refresh dashboard data after wizard completion
  };

  const handleOrderClick = (order) => {
    setSelectedOrder(order);
    setShowOrderDetails(true);
  };

  const handleOrderDetailsClose = () => {
    setShowOrderDetails(false);
    setSelectedOrder(null);
  };

  const formatCurrency = (amount) => {
    return `Rs. ${amount?.toFixed(2) || '0.00'}`;
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const statCards = [
    {
      title: 'Total Customers',
      value: stats.totalCustomers,
      icon: Users,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50'
    },
    {
      title: 'Today\'s Orders',
      value: stats.todayOrders,
      icon: ShoppingCart,
      color: 'text-green-600',
      bgColor: 'bg-green-50'
    },
    {
      title: 'Weekly Revenue',
      value: formatCurrency(stats.weeklyRevenue),
      icon: TrendingUp,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50'
    },
    {
      title: 'Monthly Revenue',
      value: formatCurrency(stats.monthlyRevenue),
      icon: DollarSign,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-50'
    },
    {
      title: 'Pending Orders',
      value: stats.pendingOrders,
      icon: Calendar,
      color: 'text-red-600',
      bgColor: 'bg-red-50'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="bg-gradient-to-r from-primary-600 to-primary-700 rounded-lg text-white p-6">
        <div className="flex items-center space-x-3">
          <Eye className="h-10 w-10" />
          <div>
            <h1 className="text-2xl font-bold">{import.meta.env.VITE_STORE_NAME_FULL || 'Kashmir Optical Centre'}</h1>
            <p className="text-primary-100">Management Dashboard</p>
          </div>
        </div>
        <p className="mt-4 text-primary-100">
          Welcome to your optical store management system. Monitor your business performance and manage customers efficiently.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        {statCards.map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.title} className="card">
              <div className="flex items-center">
                <div className={`p-3 rounded-lg ${stat.bgColor}`}>
                  <Icon className={`h-6 w-6 ${stat.color}`} />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                  <p className="text-2xl font-semibold text-gray-900">{stat.value}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Recent Orders */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Orders</h2>
          {recentOrders.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <ShoppingCart className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>No orders yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {recentOrders.map((order) => (
                <div
                  key={order.id}
                  onClick={() => handleOrderClick(order)}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 hover:shadow-md transition-all cursor-pointer group"
                >
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <p className="font-medium text-gray-900 group-hover:text-primary-600">{order.customer_name}</p>
                      <ExternalLink className="h-3 w-3 text-gray-400 group-hover:text-primary-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                    <p className="text-sm text-gray-600">{formatDate(order.order_date)}</p>
                    {order.checkup_id && (
                      <div className="flex items-center space-x-1 mt-1">
                        <Eye className="h-3 w-3 text-green-600" />
                        <span className="text-xs text-green-600 font-medium">Linked to checkup</span>
                      </div>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-gray-900">{formatCurrency(order.total_amount)}</p>
                    <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${
                      order.status === 'completed' ? 'bg-green-100 text-green-800' :
                      order.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {order.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>

          {/* Featured Action - Order Wizard */}
          <div className="mb-4">
            <button
              onClick={() => setShowOrderWizard(true)}
              className="w-full flex items-center justify-center p-4 bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 text-white rounded-lg transition-all transform hover:scale-105 shadow-lg"
            >
              <Zap className="h-6 w-6 mr-3" />
              <div className="text-left">
                <div className="font-semibold text-lg">Complete Order Wizard</div>
                <div className="text-primary-100 text-sm">Customer → Checkup → Order</div>
              </div>
            </button>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => navigate('/customers')}
              className="flex flex-col items-center p-4 bg-primary-50 hover:bg-primary-100 rounded-lg transition-colors"
            >
              <Users className="h-8 w-8 text-primary-600 mb-2" />
              <span className="text-sm font-medium text-primary-700">Add Customer</span>
            </button>
            <button
              onClick={() => navigate('/checkups')}
              className="flex flex-col items-center p-4 bg-green-50 hover:bg-green-100 rounded-lg transition-colors"
            >
              <Eye className="h-8 w-8 text-green-600 mb-2" />
              <span className="text-sm font-medium text-green-700">New Checkup</span>
            </button>
            <button
              onClick={() => navigate('/orders')}
              className="flex flex-col items-center p-4 bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors"
            >
              <ShoppingCart className="h-8 w-8 text-purple-600 mb-2" />
              <span className="text-sm font-medium text-purple-700">Create Order</span>
            </button>
            <button
              onClick={() => navigate('/reports')}
              className="flex flex-col items-center p-4 bg-yellow-50 hover:bg-yellow-100 rounded-lg transition-colors"
            >
              <DollarSign className="h-8 w-8 text-yellow-600 mb-2" />
              <span className="text-sm font-medium text-yellow-700">Sales Report</span>
            </button>
          </div>
        </div>
      </div>

      {/* Order Wizard Modal */}
      {showOrderWizard && (
        <OrderWizard onClose={handleOrderWizardClose} />
      )}

      {/* Order Details Modal */}
      {showOrderDetails && selectedOrder && (
        <OrderDetails order={selectedOrder} onClose={handleOrderDetailsClose} />
      )}
    </div>
  );
};

export default Dashboard;
