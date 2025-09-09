import React, { useState, useEffect } from 'react';
import { Download, Database, FileText, AlertCircle, CheckCircle, Info, Loader, HardDrive, Users, FileCheck, ShoppingCart } from 'lucide-react';
import backupService from '../services/backupService';
import { useStore } from '../contexts/StoreContext';
import { showSuccess, showError } from '../utils/sweetAlert';

const BackupManager = () => {
  const { currentStore, isSuperAdmin, canManageStores } = useStore();
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState(null);
  const [selectedFormat, setSelectedFormat] = useState('sql');
  const [scope, setScope] = useState('all'); // 'current' or 'all'

  useEffect(() => {
    loadStats();
  }, [currentStore, isSuperAdmin]);

  const loadStats = async () => {
    try {
      if (isSuperAdmin && scope === 'all') {
        const allStats = await backupService.getAllBackupStats();
        setStats(allStats);
      } else if (currentStore) {
        const storeStats = await backupService.getBackupStats(currentStore.id);
        setStats(storeStats);
      }
    } catch (error) {
      console.error('Error loading backup stats:', error);
    }
  };

  const handleExport = async () => {
    if (!canManageStores()) {
      showError('Access Denied', 'Super admin privileges required for database backup operations.');
      return;
    }

    if (scope === 'current' && !currentStore) {
      showError('No Store Selected', 'Please select a store to backup.');
      return;
    }

    try {
      setLoading(true);
      
      let result;
      if (scope === 'all' && isSuperAdmin) {
        result = await backupService.exportAllData(selectedFormat);
      } else {
        result = await backupService.exportStoreData(currentStore.id, selectedFormat);
      }

      if (result.success) {
        // Handle different formats
        if (selectedFormat === 'sql') {
          backupService.downloadFile(result.data, result.filename, 'text/sql');
          showSuccess(
            'Backup Created',
            `Database backup has been downloaded as ${result.filename}`
          );
        } else if (selectedFormat === 'csv') {
          await backupService.downloadCSVAsZip(result.data, result.filename);
          showSuccess(
            'Backup Created',
            'CSV files have been downloaded. Check your downloads folder for multiple CSV files.'
          );
        }
      } else {
        showError('Export Failed', result.error || 'Failed to create backup');
      }
    } catch (error) {
      console.error('Error during export:', error);
      showError('Export Error', error.message || 'An error occurred during backup export');
    } finally {
      setLoading(false);
    }
  };

  const formatStats = (stats) => {
    if (!stats) return [];
    
    if (scope === 'all') {
      return [
        { label: 'Stores', value: stats.stores, icon: HardDrive },
        { label: 'Customers', value: stats.customers, icon: Users },
        { label: 'Checkups', value: stats.checkups, icon: FileCheck },
        { label: 'Orders', value: stats.orders, icon: ShoppingCart }
      ];
    } else {
      return [
        { label: 'Customers', value: stats.customers, icon: Users },
        { label: 'Checkups', value: stats.checkups, icon: FileCheck },
        { label: 'Orders', value: stats.orders, icon: ShoppingCart }
      ];
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
      <div className="flex items-center space-x-3 mb-6">
        <div className="p-2 bg-blue-100 rounded-lg">
          <Database className="h-6 w-6 text-blue-600" />
        </div>
        <div>
          <h3 className="text-xl font-semibold text-gray-900">Database Backup</h3>
          <p className="text-gray-600">Export your store data for backup or migration purposes</p>
        </div>
      </div>

      {/* Access Control Notice */}
      {!canManageStores() && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
          <div className="flex items-start space-x-3">
            <AlertCircle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="font-medium text-yellow-800">Super Admin Access Required</h4>
              <p className="text-yellow-700 text-sm mt-1">
                Database backup operations require super administrator privileges. 
                Contact your system administrator to request access.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Scope Selection (Super Admin Only) */}
      {isSuperAdmin && (
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-3">Backup Scope</label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <label className={`relative flex items-center p-4 border rounded-lg cursor-pointer transition-colors ${
              scope === 'all' 
                ? 'border-primary-500 bg-primary-50' 
                : 'border-gray-200 hover:border-gray-300'
            }`}>
              <input
                type="radio"
                name="scope"
                value="all"
                checked={scope === 'all'}
                onChange={(e) => {
                  setScope(e.target.value);
                  loadStats();
                }}
                className="sr-only"
              />
              <div className="flex-1">
                <div className="flex items-center space-x-3">
                  <Database className="h-5 w-5 text-gray-600" />
                  <div>
                    <p className="font-medium text-gray-900">All Stores</p>
                    <p className="text-sm text-gray-600">Backup complete database with all store data</p>
                  </div>
                </div>
              </div>
              {scope === 'all' && (
                <CheckCircle className="h-5 w-5 text-primary-600" />
              )}
            </label>
          </div>
        </div>
      )}

      {/* Data Statistics */}
      {stats && (
        <div className="mb-6">
          <h4 className="text-sm font-medium text-gray-700 mb-3">Data Overview</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {formatStats(stats).map(({ label, value, icon: Icon }) => (
              <div key={label} className="bg-gray-50 rounded-lg p-4 text-center">
                <Icon className="h-6 w-6 text-gray-600 mx-auto mb-2" />
                <p className="text-2xl font-bold text-gray-900">{value.toLocaleString()}</p>
                <p className="text-sm text-gray-600">{label}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Format Selection */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-3">Export Format</label>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <label className={`relative flex items-center p-4 border rounded-lg cursor-pointer transition-colors ${
            selectedFormat === 'sql' 
              ? 'border-primary-500 bg-primary-50' 
              : 'border-gray-200 hover:border-gray-300'
          }`}>
            <input
              type="radio"
              name="format"
              value="sql"
              checked={selectedFormat === 'sql'}
              onChange={(e) => setSelectedFormat(e.target.value)}
              className="sr-only"
            />
            <div className="flex-1">
              <div className="flex items-center space-x-3">
                <Database className="h-5 w-5 text-gray-600" />
                <div>
                  <p className="font-medium text-gray-900">SQL Database</p>
                  <p className="text-sm text-gray-600">Complete backup with structure and data</p>
                </div>
              </div>
              <div className="mt-2 text-xs text-gray-500">
                • Best for database restoration<br/>
                • Includes table structure<br/>
                • Preserves all relationships
              </div>
            </div>
            {selectedFormat === 'sql' && (
              <CheckCircle className="h-5 w-5 text-primary-600" />
            )}
          </label>

          <label className={`relative flex items-center p-4 border rounded-lg cursor-pointer transition-colors ${
            selectedFormat === 'csv' 
              ? 'border-primary-500 bg-primary-50' 
              : 'border-gray-200 hover:border-gray-300'
          }`}>
            <input
              type="radio"
              name="format"
              value="csv"
              checked={selectedFormat === 'csv'}
              onChange={(e) => setSelectedFormat(e.target.value)}
              className="sr-only"
            />
            <div className="flex-1">
              <div className="flex items-center space-x-3">
                <FileText className="h-5 w-5 text-gray-600" />
                <div>
                  <p className="font-medium text-gray-900">CSV Files</p>
                  <p className="text-sm text-gray-600">Spreadsheet-compatible format</p>
                </div>
              </div>
              <div className="mt-2 text-xs text-gray-500">
                • Excel compatible<br/>
                • Easy to analyze<br/>
                • Multiple files (one per table)
              </div>
            </div>
            {selectedFormat === 'csv' && (
              <CheckCircle className="h-5 w-5 text-primary-600" />
            )}
          </label>
        </div>
      </div>

      {/* Information Box */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <div className="flex items-start space-x-3">
          <Info className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-blue-700">
            <p className="font-medium mb-1">Backup Information</p>
            <ul className="space-y-1 list-disc list-inside ml-4">
              <li>SQL format includes complete database structure and is recommended for restoration</li>
              <li>CSV format provides spreadsheet-compatible files for analysis and reporting</li>
              <li>Backups include all current data but not deleted records</li>
              <li>For security, store backups in a secure location</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Export Button */}
      <div className="flex justify-center">
        <button
          onClick={handleExport}
          disabled={loading || !canManageStores() || (scope === 'current' && !currentStore)}
          className={`flex items-center space-x-3 px-6 py-3 rounded-lg font-medium transition-colors ${
            loading || !canManageStores() || (scope === 'current' && !currentStore)
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : 'bg-primary-600 text-white hover:bg-primary-700'
          }`}
        >
          {loading ? (
            <>
              <Loader className="h-5 w-5 animate-spin" />
              <span>Creating Backup...</span>
            </>
          ) : (
            <>
              <Download className="h-5 w-5" />
              <span>
                {selectedFormat === 'sql' ? 'Download SQL Backup' : 'Download CSV Files'}
              </span>
            </>
          )}
        </button>
      </div>

      {/* Export Tips */}
      <div className="mt-6 pt-6 border-t border-gray-200">
        <h4 className="text-sm font-medium text-gray-700 mb-3">Backup Tips</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
          <div>
            <p className="font-medium text-gray-900 mb-1">Regular Backups</p>
            <p>Schedule regular backups to protect against data loss. Weekly or monthly backups are recommended.</p>
          </div>
          <div>
            <p className="font-medium text-gray-900 mb-1">Secure Storage</p>
            <p>Store backup files in a secure, offline location. Consider cloud storage with encryption.</p>
          </div>
          <div>
            <p className="font-medium text-gray-900 mb-1">Test Restoration</p>
            <p>Periodically test backup restoration to ensure data integrity and backup validity.</p>
          </div>
          <div>
            <p className="font-medium text-gray-900 mb-1">Version Control</p>
            <p>Keep multiple backup versions with timestamps to track changes over time.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BackupManager;
