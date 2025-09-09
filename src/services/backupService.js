// Database Backup Service
// This service handles exporting database data to various formats (SQL, CSV)

import { getDatabase } from '../utils/database';

class BackupService {
  constructor() {
    this.supportedFormats = ['sql', 'csv'];
  }

  /**
   * Export all database data for a specific store
   * @param {string} storeId - Store ID to export data for
   * @param {string} format - Export format ('sql' or 'csv')
   * @returns {Object} Export result with data and filename
   */
  async exportStoreData(storeId, format = 'sql') {
    try {
      if (!this.supportedFormats.includes(format.toLowerCase())) {
        throw new Error(`Unsupported export format: ${format}`);
      }

      const client = await getDatabase();
      
      // Get store information
      const storeResult = await client.execute({
        sql: 'SELECT * FROM stores WHERE id = ?',
        args: [storeId]
      });

      const store = storeResult.rows[0];
      if (!store) {
        throw new Error('Store not found');
      }

      // Export based on format
      let exportData;
      let filename;

      if (format.toLowerCase() === 'sql') {
        exportData = await this.exportToSQL(client, storeId, store);
        filename = `${this.sanitizeFilename(store.name)}_backup_${this.getTimestamp()}.sql`;
      } else if (format.toLowerCase() === 'csv') {
        exportData = await this.exportToCSV(client, storeId, store);
        filename = `${this.sanitizeFilename(store.name)}_backup_${this.getTimestamp()}.zip`;
      }

      return {
        success: true,
        data: exportData,
        filename: filename,
        storeName: store.name,
        timestamp: new Date().toISOString(),
        format: format.toLowerCase()
      };

    } catch (error) {
      console.error('Error exporting store data:', error);
      return {
        success: false,
        error: error.message || 'Failed to export store data'
      };
    }
  }

  /**
   * Export all database data (super admin only)
   * @param {string} format - Export format ('sql' or 'csv')
   * @returns {Object} Export result with data and filename
   */
  async exportAllData(format = 'sql') {
    try {
      if (!this.supportedFormats.includes(format.toLowerCase())) {
        throw new Error(`Unsupported export format: ${format}`);
      }

      const client = await getDatabase();

      let exportData;
      let filename;

      if (format.toLowerCase() === 'sql') {
        exportData = await this.exportAllToSQL(client);
        filename = `all_stores_backup_${this.getTimestamp()}.sql`;
      } else if (format.toLowerCase() === 'csv') {
        exportData = await this.exportAllToCSV(client);
        filename = `all_stores_backup_${this.getTimestamp()}.zip`;
      }

      return {
        success: true,
        data: exportData,
        filename: filename,
        timestamp: new Date().toISOString(),
        format: format.toLowerCase(),
        scope: 'all_stores'
      };

    } catch (error) {
      console.error('Error exporting all data:', error);
      return {
        success: false,
        error: error.message || 'Failed to export all data'
      };
    }
  }

  /**
   * Export store data to SQL format
   * @param {Object} client - Database client
   * @param {string} storeId - Store ID
   * @param {Object} store - Store information
   * @returns {string} SQL export data
   */
  async exportToSQL(client, storeId, store) {
    let sql = '';
    
    // Add header comment
    sql += `-- Database Backup for ${store.name}\n`;
    sql += `-- Generated on: ${new Date().toISOString()}\n`;
    sql += `-- Store ID: ${storeId}\n\n`;

    // Create tables structure (optional, as they should already exist)
    sql += this.getTableStructureSQL();

    // Export store data
    sql += `-- Store Data\n`;
    sql += this.generateInsertStatement('stores', [store]);
    sql += '\n';

    // Export customers
    const customersResult = await client.execute({
      sql: 'SELECT * FROM customers WHERE store_id = ? ORDER BY created_at',
      args: [storeId]
    });
    if (customersResult.rows.length > 0) {
      sql += `-- Customers Data\n`;
      sql += this.generateInsertStatement('customers', customersResult.rows);
      sql += '\n';
    }

    // Export checkups
    const checkupsResult = await client.execute({
      sql: 'SELECT * FROM checkups WHERE store_id = ? ORDER BY created_at',
      args: [storeId]
    });
    if (checkupsResult.rows.length > 0) {
      sql += `-- Checkups Data\n`;
      sql += this.generateInsertStatement('checkups', checkupsResult.rows);
      sql += '\n';
    }

    // Export orders
    const ordersResult = await client.execute({
      sql: 'SELECT * FROM orders WHERE store_id = ? ORDER BY created_at',
      args: [storeId]
    });
    if (ordersResult.rows.length > 0) {
      sql += `-- Orders Data\n`;
      sql += this.generateInsertStatement('orders', ordersResult.rows);
      sql += '\n';
    }

    return sql;
  }

  /**
   * Export all stores data to SQL format
   * @param {Object} client - Database client
   * @returns {string} SQL export data
   */
  async exportAllToSQL(client) {
    let sql = '';
    
    // Add header comment
    sql += `-- Complete Database Backup - All Stores\n`;
    sql += `-- Generated on: ${new Date().toISOString()}\n\n`;

    // Create tables structure
    sql += this.getTableStructureSQL();

    // Export all stores
    const storesResult = await client.execute('SELECT * FROM stores ORDER BY created_at');
    if (storesResult.rows.length > 0) {
      sql += `-- All Stores Data\n`;
      sql += this.generateInsertStatement('stores', storesResult.rows);
      sql += '\n';
    }

    // Export all customers
    const customersResult = await client.execute('SELECT * FROM customers ORDER BY store_id, created_at');
    if (customersResult.rows.length > 0) {
      sql += `-- All Customers Data\n`;
      sql += this.generateInsertStatement('customers', customersResult.rows);
      sql += '\n';
    }

    // Export all checkups
    const checkupsResult = await client.execute('SELECT * FROM checkups ORDER BY store_id, created_at');
    if (checkupsResult.rows.length > 0) {
      sql += `-- All Checkups Data\n`;
      sql += this.generateInsertStatement('checkups', checkupsResult.rows);
      sql += '\n';
    }

    // Export all orders
    const ordersResult = await client.execute('SELECT * FROM orders ORDER BY store_id, created_at');
    if (ordersResult.rows.length > 0) {
      sql += `-- All Orders Data\n`;
      sql += this.generateInsertStatement('orders', ordersResult.rows);
      sql += '\n';
    }

    return sql;
  }

  /**
   * Export store data to CSV format (returns multiple CSV files in a structure)
   * @param {Object} client - Database client
   * @param {string} storeId - Store ID
   * @param {Object} store - Store information
   * @returns {Object} CSV files data
   */
  async exportToCSV(client, storeId, store) {
    const csvFiles = {};

    // Store data
    csvFiles['store.csv'] = this.arrayToCSV([store]);

    // Customers data
    const customersResult = await client.execute({
      sql: 'SELECT * FROM customers WHERE store_id = ? ORDER BY created_at',
      args: [storeId]
    });
    if (customersResult.rows.length > 0) {
      csvFiles['customers.csv'] = this.arrayToCSV(customersResult.rows);
    }

    // Checkups data
    const checkupsResult = await client.execute({
      sql: 'SELECT * FROM checkups WHERE store_id = ? ORDER BY created_at',
      args: [storeId]
    });
    if (checkupsResult.rows.length > 0) {
      csvFiles['checkups.csv'] = this.arrayToCSV(checkupsResult.rows);
    }

    // Orders data
    const ordersResult = await client.execute({
      sql: 'SELECT * FROM orders WHERE store_id = ? ORDER BY created_at',
      args: [storeId]
    });
    if (ordersResult.rows.length > 0) {
      csvFiles['orders.csv'] = this.arrayToCSV(ordersResult.rows);
    }

    // Create readme file
    csvFiles['README.txt'] = this.generateCSVReadme(store);

    return csvFiles;
  }

  /**
   * Export all stores data to CSV format
   * @param {Object} client - Database client
   * @returns {Object} CSV files data
   */
  async exportAllToCSV(client) {
    const csvFiles = {};

    // All stores data
    const storesResult = await client.execute('SELECT * FROM stores ORDER BY created_at');
    if (storesResult.rows.length > 0) {
      csvFiles['stores.csv'] = this.arrayToCSV(storesResult.rows);
    }

    // All customers data
    const customersResult = await client.execute('SELECT * FROM customers ORDER BY store_id, created_at');
    if (customersResult.rows.length > 0) {
      csvFiles['customers.csv'] = this.arrayToCSV(customersResult.rows);
    }

    // All checkups data
    const checkupsResult = await client.execute('SELECT * FROM checkups ORDER BY store_id, created_at');
    if (checkupsResult.rows.length > 0) {
      csvFiles['checkups.csv'] = this.arrayToCSV(checkupsResult.rows);
    }

    // All orders data
    const ordersResult = await client.execute('SELECT * FROM orders ORDER BY store_id, created_at');
    if (ordersResult.rows.length > 0) {
      csvFiles['orders.csv'] = this.arrayToCSV(ordersResult.rows);
    }

    // Create readme file
    csvFiles['README.txt'] = this.generateAllDataCSVReadme();

    return csvFiles;
  }

  /**
   * Generate INSERT statements for a table
   * @param {string} tableName - Table name
   * @param {Array} rows - Array of row objects
   * @returns {string} SQL INSERT statements
   */
  generateInsertStatement(tableName, rows) {
    if (!rows || rows.length === 0) {
      return '';
    }

    let sql = '';
    const columns = Object.keys(rows[0]);
    
    for (const row of rows) {
      const values = columns.map(col => {
        const value = row[col];
        if (value === null || value === undefined) {
          return 'NULL';
        }
        if (typeof value === 'string') {
          return `'${value.replace(/'/g, "''")}'`; // Escape single quotes
        }
        return value;
      }).join(', ');

      sql += `INSERT INTO ${tableName} (${columns.join(', ')}) VALUES (${values});\n`;
    }

    return sql;
  }

  /**
   * Convert array of objects to CSV format
   * @param {Array} data - Array of objects
   * @returns {string} CSV formatted string
   */
  arrayToCSV(data) {
    if (!data || data.length === 0) {
      return '';
    }

    const headers = Object.keys(data[0]);
    const csvHeaders = headers.join(',');
    
    const csvRows = data.map(row => {
      return headers.map(header => {
        const value = row[header];
        if (value === null || value === undefined) {
          return '';
        }
        // Escape commas and quotes in CSV
        const stringValue = String(value);
        if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
          return `"${stringValue.replace(/"/g, '""')}"`;
        }
        return stringValue;
      }).join(',');
    });

    return [csvHeaders, ...csvRows].join('\n');
  }

  /**
   * Get table structure SQL (for backup restoration)
   * @returns {string} SQL table creation statements
   */
  getTableStructureSQL() {
    return `-- Table Structure (for reference)\n` +
           `-- Note: These tables should already exist in your database\n\n` +
           `/*\n` +
           `CREATE TABLE IF NOT EXISTS stores (\n` +
           `  id TEXT PRIMARY KEY,\n` +
           `  name TEXT NOT NULL,\n` +
           `  address TEXT,\n` +
           `  phone TEXT,\n` +
           `  email TEXT,\n` +
           `  pin TEXT NOT NULL,\n` +
           `  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,\n` +
           `  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP\n` +
           `);\n\n` +
           
           `CREATE TABLE IF NOT EXISTS customers (\n` +
           `  id TEXT PRIMARY KEY,\n` +
           `  store_id TEXT NOT NULL,\n` +
           `  name TEXT NOT NULL,\n` +
           `  phone TEXT,\n` +
           `  email TEXT,\n` +
           `  address TEXT,\n` +
           `  date_of_birth TEXT,\n` +
           `  remarks TEXT,\n` +
           `  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,\n` +
           `  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,\n` +
           `  FOREIGN KEY (store_id) REFERENCES stores (id)\n` +
           `);\n\n` +
           
           `CREATE TABLE IF NOT EXISTS checkups (\n` +
           `  id TEXT PRIMARY KEY,\n` +
           `  store_id TEXT NOT NULL,\n` +
           `  customer_id TEXT NOT NULL,\n` +
           `  date TEXT NOT NULL,\n` +
           `  right_eye_spherical_dv TEXT,\n` +
           `  right_eye_cylindrical_dv TEXT,\n` +
           `  right_eye_axis_dv TEXT,\n` +
           `  right_eye_add TEXT,\n` +
           `  right_eye_spherical_nv TEXT,\n` +
           `  right_eye_cylindrical_nv TEXT,\n` +
           `  right_eye_axis_nv TEXT,\n` +
           `  left_eye_spherical_dv TEXT,\n` +
           `  left_eye_cylindrical_dv TEXT,\n` +
           `  left_eye_axis_dv TEXT,\n` +
           `  left_eye_add TEXT,\n` +
           `  left_eye_spherical_nv TEXT,\n` +
           `  left_eye_cylindrical_nv TEXT,\n` +
           `  left_eye_axis_nv TEXT,\n` +
           `  ipd_bridge TEXT,\n` +
           `  tested_by TEXT,\n` +
           `  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,\n` +
           `  FOREIGN KEY (store_id) REFERENCES stores (id),\n` +
           `  FOREIGN KEY (customer_id) REFERENCES customers (id)\n` +
           `);\n\n` +
           
           `CREATE TABLE IF NOT EXISTS orders (\n` +
           `  id TEXT PRIMARY KEY,\n` +
           `  store_id TEXT NOT NULL,\n` +
           `  customer_id TEXT NOT NULL,\n` +
           `  checkup_id TEXT,\n` +
           `  order_date TEXT NOT NULL,\n` +
           `  expected_delivery_date TEXT,\n` +
           `  delivered_date TEXT,\n` +
           `  frame TEXT,\n` +
           `  lenses TEXT,\n` +
           `  total_amount REAL,\n` +
           `  advance_amount REAL,\n` +
           `  balance_amount REAL,\n` +
           `  status TEXT DEFAULT 'pending',\n` +
           `  notes TEXT,\n` +
           `  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,\n` +
           `  FOREIGN KEY (store_id) REFERENCES stores (id),\n` +
           `  FOREIGN KEY (customer_id) REFERENCES customers (id),\n` +
           `  FOREIGN KEY (checkup_id) REFERENCES checkups (id)\n` +
           `);\n` +
           `*/\n\n`;
  }

  /**
   * Generate README file content for CSV exports
   * @param {Object} store - Store information
   * @returns {string} README content
   */
  generateCSVReadme(store) {
    return `Database Backup - ${store.name}\n` +
           `==========================================\n\n` +
           `Generated on: ${new Date().toISOString()}\n` +
           `Store ID: ${store.id}\n` +
           `Store Name: ${store.name}\n\n` +
           `Files included:\n` +
           `- store.csv: Store information\n` +
           `- customers.csv: Customer records\n` +
           `- checkups.csv: Eye checkup records\n` +
           `- orders.csv: Order records\n\n` +
           `Note: These CSV files can be imported into Excel or other spreadsheet applications.\n` +
           `To restore data to the system, use the SQL backup format instead.\n`;
  }

  /**
   * Generate README file content for all data CSV exports
   * @returns {string} README content
   */
  generateAllDataCSVReadme() {
    return `Complete Database Backup - All Stores\n` +
           `====================================\n\n` +
           `Generated on: ${new Date().toISOString()}\n` +
           `Scope: All stores and their data\n\n` +
           `Files included:\n` +
           `- stores.csv: All store information\n` +
           `- customers.csv: All customer records\n` +
           `- checkups.csv: All eye checkup records\n` +
           `- orders.csv: All order records\n\n` +
           `Note: These CSV files can be imported into Excel or other spreadsheet applications.\n` +
           `To restore data to the system, use the SQL backup format instead.\n`;
  }

  /**
   * Get current timestamp for filename
   * @returns {string} Formatted timestamp
   */
  getTimestamp() {
    const now = new Date();
    return now.toISOString().replace(/[:.]/g, '-').split('T')[0] + '_' + 
           now.toTimeString().split(' ')[0].replace(/:/g, '');
  }

  /**
   * Sanitize filename by removing invalid characters
   * @param {string} filename - Original filename
   * @returns {string} Sanitized filename
   */
  sanitizeFilename(filename) {
    return filename.replace(/[^a-zA-Z0-9-_]/g, '_').replace(/_+/g, '_');
  }

  /**
   * Download data as file
   * @param {string} data - File content
   * @param {string} filename - File name
   * @param {string} mimeType - MIME type
   */
  downloadFile(data, filename, mimeType = 'text/plain') {
    const blob = new Blob([data], { type: mimeType });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  }

  /**
   * Download CSV files as ZIP (using browser APIs)
   * @param {Object} csvFiles - Object with filename as key and CSV content as value
   * @param {string} zipFilename - ZIP file name
   */
  async downloadCSVAsZip(csvFiles, zipFilename) {
    try {
      // For browser compatibility, we'll create individual CSV downloads
      // In a real-world scenario, you might want to use a library like JSZip
      
      const fileEntries = Object.entries(csvFiles);
      
      for (const [filename, content] of fileEntries) {
        const mimeType = filename.endsWith('.csv') ? 'text/csv' : 'text/plain';
        
        // Add a small delay between downloads to avoid browser blocking
        setTimeout(() => {
          this.downloadFile(content, filename, mimeType);
        }, fileEntries.indexOf([filename, content]) * 100);
      }

      return true;
    } catch (error) {
      console.error('Error downloading CSV files:', error);
      return false;
    }
  }

  /**
   * Get backup statistics for a store
   * @param {string} storeId - Store ID
   * @returns {Object} Backup statistics
   */
  async getBackupStats(storeId) {
    try {
      const client = await getDatabase();
      
      // Get counts for each table
      const customerCount = await client.execute({
        sql: 'SELECT COUNT(*) as count FROM customers WHERE store_id = ?',
        args: [storeId]
      });
      
      const checkupCount = await client.execute({
        sql: 'SELECT COUNT(*) as count FROM checkups WHERE store_id = ?',
        args: [storeId]
      });
      
      const orderCount = await client.execute({
        sql: 'SELECT COUNT(*) as count FROM orders WHERE store_id = ?',
        args: [storeId]
      });

      return {
        customers: customerCount.rows[0].count,
        checkups: checkupCount.rows[0].count,
        orders: orderCount.rows[0].count
      };
    } catch (error) {
      console.error('Error getting backup stats:', error);
      return {
        customers: 0,
        checkups: 0,
        orders: 0
      };
    }
  }

  /**
   * Get backup statistics for all stores
   * @returns {Object} Backup statistics
   */
  async getAllBackupStats() {
    try {
      const client = await getDatabase();
      
      const storeCount = await client.execute('SELECT COUNT(*) as count FROM stores');
      const customerCount = await client.execute('SELECT COUNT(*) as count FROM customers');
      const checkupCount = await client.execute('SELECT COUNT(*) as count FROM checkups');
      const orderCount = await client.execute('SELECT COUNT(*) as count FROM orders');

      return {
        stores: storeCount.rows[0].count,
        customers: customerCount.rows[0].count,
        checkups: checkupCount.rows[0].count,
        orders: orderCount.rows[0].count
      };
    } catch (error) {
      console.error('Error getting all backup stats:', error);
      return {
        stores: 0,
        customers: 0,
        checkups: 0,
        orders: 0
      };
    }
  }
}

// Create and export singleton instance
const backupService = new BackupService();
export default backupService;
