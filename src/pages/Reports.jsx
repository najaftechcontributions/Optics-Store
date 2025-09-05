import React, { useState, useEffect } from 'react';
import { Calendar, DollarSign, TrendingUp, FileText, Download, BarChart3, Store, ChevronDown } from 'lucide-react';
import { orderService, superAdminService, storeService } from '../utils/database';
import { useStore } from '../contexts/StoreContext';
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, startOfDay, endOfDay } from 'date-fns';

const Reports = () => {
  const { currentStore, isSuperAdmin } = useStore();
  const [reportType, setReportType] = useState('daily');
  const [startDate, setStartDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [endDate, setEndDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [reportData, setReportData] = useState([]);
  const [reportMode, setReportMode] = useState('consolidated'); // 'consolidated' or 'by_store'
  const [availableStores, setAvailableStores] = useState([]);
  const [selectedStores, setSelectedStores] = useState([]);
  const [showStoreDropdown, setShowStoreDropdown] = useState(false);
  const [summary, setSummary] = useState({
    totalOrders: 0,
    totalSales: 0,
    totalAdvance: 0,
    totalBalance: 0,
    averageOrderValue: 0
  });
  const [loading, setLoading] = useState(false);
  const [storesLoading, setStoresLoading] = useState(false);

  useEffect(() => {
    generateReport();
  }, [reportType, startDate, endDate, reportMode, selectedStores]);

  // Load available stores for super admin
  useEffect(() => {
    if (isSuperAdmin) {
      loadStores();
    }
  }, [isSuperAdmin]);

  // Handle clicking outside store dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showStoreDropdown && !event.target.closest('.store-dropdown-container')) {
        setShowStoreDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showStoreDropdown]);

  useEffect(() => {
    // Set default date range based on report type
    const today = new Date();
    switch (reportType) {
      case 'daily':
        setStartDate(format(today, 'yyyy-MM-dd'));
        setEndDate(format(today, 'yyyy-MM-dd'));
        break;
      case 'weekly':
        setStartDate(format(startOfWeek(today), 'yyyy-MM-dd'));
        setEndDate(format(endOfWeek(today), 'yyyy-MM-dd'));
        break;
      case 'monthly':
        setStartDate(format(startOfMonth(today), 'yyyy-MM-dd'));
        setEndDate(format(endOfMonth(today), 'yyyy-MM-dd'));
        break;
      default:
        break;
    }
  }, [reportType]);

  const loadStores = async () => {
    if (!isSuperAdmin) return;
    setStoresLoading(true);
    try {
      const stores = await storeService.getAll();
      setAvailableStores(stores);
      // Initially select all stores
      setSelectedStores(stores.map(store => store.id));
    } catch (error) {
      console.error('Error loading stores:', error);
    } finally {
      setStoresLoading(false);
    }
  };

  const generateReport = async () => {
    if (!currentStore && !isSuperAdmin) return;
    setLoading(true);
    try {
      let salesData;

      if (isSuperAdmin) {
        // If no stores are selected, show empty data
        if (selectedStores.length === 0) {
          setReportData([]);
          setSummary({
            totalOrders: 0,
            totalSales: 0,
            totalAdvance: 0,
            totalBalance: 0,
            averageOrderValue: 0
          });
          return;
        }

        // Get individual orders for all selected stores
        if (selectedStores.length === availableStores.length) {
          salesData = await superAdminService.getAllStoresIndividualOrdersReport(startDate, endDate);
        } else {
          salesData = await superAdminService.getSelectedStoresIndividualOrdersReport(startDate, endDate, selectedStores);
        }
      } else {
        salesData = await orderService.getIndividualOrdersReport(startDate, endDate, currentStore.id);
      }

      setReportData(salesData || []);

      // Calculate summary from individual orders
      const safeData = salesData || [];
      const totalOrders = safeData.length;
      const totalSales = safeData.reduce((sum, item) => sum + (item.total_amount || 0), 0);
      const totalAdvance = safeData.reduce((sum, item) => sum + (item.advance_amount || 0), 0);
      const totalBalance = safeData.reduce((sum, item) => sum + (item.balance_amount || 0), 0);
      const averageOrderValue = totalOrders > 0 ? totalSales / totalOrders : 0;

      setSummary({
        totalOrders,
        totalSales,
        totalAdvance,
        totalBalance,
        averageOrderValue
      });
    } catch (error) {
      console.error('Error generating report:', error);
      setReportData([]);
      setSummary({
        totalOrders: 0,
        totalSales: 0,
        totalAdvance: 0,
        totalBalance: 0,
        averageOrderValue: 0
      });
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return `Rs. ${amount?.toFixed(2) || '0.00'}`;
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const exportReport = () => {
    const headers = isSuperAdmin
      ? ['Order ID', 'Store', 'Date', 'Customer', 'Phone', 'Frame', 'Lenses', 'Total Amount', 'Advance', 'Balance', 'Status']
      : ['Order ID', 'Date', 'Customer', 'Phone', 'Frame', 'Lenses', 'Total Amount', 'Advance', 'Balance', 'Status'];

    const csvContent = [
      headers.join(','),
      ...reportData.map(row => {
        if (isSuperAdmin) {
          return [
            row.id || '',
            row.store_name || 'Unknown Store',
            row.order_date,
            row.customer_name || '',
            row.customer_phone || '',
            row.frame || '',
            row.lenses || '',
            row.total_amount || 0,
            row.advance_amount || 0,
            row.balance_amount || 0,
            row.status || ''
          ].join(',');
        } else {
          return [
            row.id || '',
            row.order_date,
            row.customer_name || '',
            row.customer_phone || '',
            row.frame || '',
            row.lenses || '',
            row.total_amount || 0,
            row.advance_amount || 0,
            row.balance_amount || 0,
            row.status || ''
          ].join(',');
        }
      })
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;

    let prefix;
    if (isSuperAdmin) {
      if (selectedStores.length === availableStores.length) {
        prefix = 'all-stores';
      } else if (selectedStores.length === 1) {
        const selectedStore = availableStores.find(store => store.id === selectedStores[0]);
        prefix = selectedStore?.name || 'selected-store';
      } else {
        prefix = `${selectedStores.length}-stores`;
      }
    } else {
      prefix = currentStore?.name || 'store';
    }

    a.download = `${prefix}-orders-report-${startDate}-to-${endDate}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const handleStoreSelection = (storeId) => {
    setSelectedStores(prev => {
      if (prev.includes(storeId)) {
        return prev.filter(id => id !== storeId);
      } else {
        return [...prev, storeId];
      }
    });
  };

  const selectAllStores = () => {
    setSelectedStores(availableStores.map(store => store.id));
  };

  const deselectAllStores = () => {
    setSelectedStores([]);
  };

  const getSelectedStoreNames = () => {
    if (selectedStores.length === 0) return 'No stores selected';
    if (selectedStores.length === availableStores.length) return 'All stores';
    if (selectedStores.length === 1) {
      const store = availableStores.find(s => s.id === selectedStores[0]);
      return store?.name || 'Unknown store';
    }
    return `${selectedStores.length} stores selected`;
  };

  const summaryCards = [
    {
      title: 'Total Orders',
      value: summary.totalOrders,
      icon: BarChart3,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50'
    },
    {
      title: 'Total Sales',
      value: formatCurrency(summary.totalSales),
      icon: DollarSign,
      color: 'text-green-600',
      bgColor: 'bg-green-50'
    },
    {
      title: 'Total Advance',
      value: formatCurrency(summary.totalAdvance),
      icon: TrendingUp,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50'
    },
    {
      title: 'Pending Balance',
      value: formatCurrency(summary.totalBalance),
      icon: FileText,
      color: 'text-red-600',
      bgColor: 'bg-red-50'
    },
    {
      title: 'Avg Order Value',
      value: formatCurrency(summary.averageOrderValue),
      icon: TrendingUp,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-50'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Sales Reports</h1>
          <p className="text-gray-600">
            {isSuperAdmin
              ? `Analyze performance ${selectedStores.length === availableStores.length
                  ? 'across all stores'
                  : selectedStores.length === 1
                    ? `for ${availableStores.find(s => s.id === selectedStores[0])?.name || 'selected store'}`
                    : `across ${selectedStores.length} selected stores`}`
              : 'Analyze your business performance and revenue'}
          </p>
        </div>
        <button
          onClick={exportReport}
          className="btn-primary flex items-center space-x-2"
          disabled={loading || reportData.length === 0}
        >
          <Download className="h-4 w-4" />
          <span>Export CSV</span>
        </button>
      </div>

      {/* Report Configuration */}
      <div className="card">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Report Configuration</h2>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          {/* Report Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Report Type
            </label>
            <select
              value={reportType}
              onChange={(e) => setReportType(e.target.value)}
              className="input-field"
            >
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
              <option value="custom">Custom Range</option>
            </select>
          </div>



          {/* Store Selection for Super Admin */}
          {isSuperAdmin && (
            <div className="relative store-dropdown-container">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <Store className="h-4 w-4 inline mr-1" />
                Store Filter
              </label>
              <button
                type="button"
                onClick={() => setShowStoreDropdown(!showStoreDropdown)}
                className="input-field flex items-center justify-between w-full cursor-pointer"
                disabled={storesLoading}
              >
                <span className="truncate">
                  {storesLoading ? 'Loading...' : getSelectedStoreNames()}
                </span>
                <ChevronDown className="h-4 w-4 text-gray-400" />
              </button>

              {showStoreDropdown && (
                <div className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-auto">
                  <div className="p-2 border-b border-gray-200 space-y-1">
                    <button
                      type="button"
                      onClick={selectAllStores}
                      className="w-full text-left px-2 py-1 text-xs text-blue-600 hover:bg-blue-50 rounded"
                    >
                      Select All
                    </button>
                    <button
                      type="button"
                      onClick={deselectAllStores}
                      className="w-full text-left px-2 py-1 text-xs text-red-600 hover:bg-red-50 rounded"
                    >
                      Deselect All
                    </button>
                  </div>
                  <div className="max-h-48 overflow-y-auto">
                    {availableStores.map((store) => (
                      <label
                        key={store.id}
                        className="flex items-center px-3 py-2 hover:bg-gray-50 cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={selectedStores.includes(store.id)}
                          onChange={() => handleStoreSelection(store.id)}
                          className="mr-2 h-4 w-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                        />
                        <span className="text-sm text-gray-900">{store.name}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Start Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <Calendar className="h-4 w-4 inline mr-1" />
              Start Date
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="input-field"
            />
          </div>

          {/* End Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <Calendar className="h-4 w-4 inline mr-1" />
              End Date
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="input-field"
            />
          </div>

          {/* Generate Button */}
          <div className="flex items-end">
            <button
              onClick={generateReport}
              className="btn-primary w-full flex items-center justify-center space-x-2"
              disabled={loading || (isSuperAdmin && selectedStores.length === 0)}
            >
              {loading ? (
                <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
              ) : (
                <>
                  <BarChart3 className="h-4 w-4" />
                  <span>Generate</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        {summaryCards.map((card) => {
          const Icon = card.icon;
          return (
            <div key={card.title} className="card">
              <div className="flex items-center">
                <div className={`p-2 sm:p-3 rounded-lg ${card.bgColor}`}>
                  <Icon className={`h-5 w-5 sm:h-6 sm:w-6 ${card.color}`} />
                </div>
                <div className="ml-3 sm:ml-4 flex-1 min-w-0">
                  <p className="text-xs sm:text-sm font-medium text-gray-600">{card.title}</p>
                  <p className="text-sm sm:text-lg font-semibold text-gray-900 truncate">{card.value}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Report Data Table */}
      <div className="card">
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-gray-900">
            Order Details ({reportData.length} {reportData.length === 1 ? 'order' : 'orders'})
          </h2>

          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin h-8 w-8 border-2 border-primary-600 border-t-transparent rounded-full mx-auto mb-4" />
              <p className="text-gray-500">Generating report...</p>
            </div>
          ) : reportData.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <FileText className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>No orders found for the selected period</p>
              <p className="text-sm">Try adjusting your date range</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Order ID
                    </th>
                    {isSuperAdmin && (
                      <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Store
                      </th>
                    )}
                    <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Customer
                    </th>
                    <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Frame
                    </th>
                    <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Total
                    </th>
                    <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Advance
                    </th>
                    <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Balance
                    </th>
                    <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {reportData.map((row, index) => (
                    <tr key={row.id || index} className="hover:bg-gray-50">
                      <td className="px-3 sm:px-6 py-2 sm:py-4 whitespace-nowrap text-xs sm:text-sm font-mono text-gray-900">
                        #{row.id || 'N/A'}
                      </td>
                      {isSuperAdmin && (
                        <td className="px-3 sm:px-6 py-2 sm:py-4 whitespace-nowrap text-xs sm:text-sm font-medium text-gray-900">
                          {row.store_name || 'Unknown Store'}
                        </td>
                      )}
                      <td className="px-3 sm:px-6 py-2 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-900">
                        {formatDate(row.order_date)}
                      </td>
                      <td className="px-3 sm:px-6 py-2 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-900">
                        <div>
                          <div className="font-medium">{row.customer_name || 'N/A'}</div>
                          <div className="text-gray-500">{row.customer_phone || 'N/A'}</div>
                        </div>
                      </td>
                      <td className="px-3 sm:px-6 py-2 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-900">
                        <div>
                          <div className="font-medium">{row.frame || 'N/A'}</div>
                          <div className="text-gray-500 text-xs">{row.lenses || 'N/A'}</div>
                        </div>
                      </td>
                      <td className="px-3 sm:px-6 py-2 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-900 font-medium">
                        {formatCurrency(row.total_amount)}
                      </td>
                      <td className="px-3 sm:px-6 py-2 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-green-600">
                        {formatCurrency(row.advance_amount)}
                      </td>
                      <td className="px-3 sm:px-6 py-2 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-red-600">
                        {formatCurrency(row.balance_amount)}
                      </td>
                      <td className="px-3 sm:px-6 py-2 sm:py-4 whitespace-nowrap text-xs sm:text-sm">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          row.status === 'delivered' ? 'bg-green-100 text-green-800' :
                          row.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                          row.status === 'processing' ? 'bg-blue-100 text-blue-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {row.status || 'pending'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Reports;
