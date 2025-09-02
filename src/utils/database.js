import { createClient } from '@libsql/client';

// Turso client setup
const client = createClient({
  url: 'libsql://kashmiroptics-adilahmed69.aws-ap-south-1.turso.io',
  authToken: 'eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3NTY3MzUzMjAsImlkIjoiZTM3MzZkMjEtZjdlOS00Yzc5LWFiMGEtOThhMWViNGJkNzQ3IiwicmlkIjoiOGViY2JiMGYtM2FhZC00N2IxLWE3YmYtYjQxZjQ3YWQ1N2EwIn0.j1ZA8EHkWjl4MOiSi6EdSfBmhs6Qb0ui6sy-tu5kMJWcD8FfXIKYF38eEFrak4kA3FaYLNsleQmrmAtPz4vsAA'
});

let initialized = false;

const generateId = () => {
  return Date.now() + Math.random().toString(36).substr(2, 9);
};

const resetDatabase = async () => {
  try {
    // Drop existing tables
    await client.execute('DROP TABLE IF EXISTS orders');
    await client.execute('DROP TABLE IF EXISTS checkups');
    await client.execute('DROP TABLE IF EXISTS customers');
    await client.execute('DROP TABLE IF EXISTS stores');

    initialized = false;
    console.log('Database tables dropped successfully');

    // Reinitialize
    await initDatabase();
  } catch (error) {
    console.error('Error resetting database:', error);
    throw error;
  }
};

const initDatabase = async () => {
  try {
    if (!initialized) {
      // Create stores table first
      await client.execute(`
        CREATE TABLE IF NOT EXISTS stores (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          address TEXT,
          phone TEXT,
          email TEXT,
          pin TEXT NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // Create customers table with store_id
      await client.execute(`
        CREATE TABLE IF NOT EXISTS customers (
          id TEXT PRIMARY KEY,
          store_id TEXT NOT NULL,
          name TEXT NOT NULL,
          phone TEXT,
          email TEXT,
          address TEXT,
          date_of_birth TEXT,
          ipd TEXT,
          bridge TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (store_id) REFERENCES stores (id),
          UNIQUE(store_id, phone)
        )
      `);

      // Create checkups table with store_id
      await client.execute(`
        CREATE TABLE IF NOT EXISTS checkups (
          id TEXT PRIMARY KEY,
          store_id TEXT NOT NULL,
          customer_id TEXT NOT NULL,
          date TEXT NOT NULL,
          right_eye_spherical_dv TEXT,
          right_eye_cylindrical_dv TEXT,
          right_eye_axis_dv TEXT,
          right_eye_spherical_nv TEXT,
          right_eye_cylindrical_nv TEXT,
          right_eye_axis_nv TEXT,
          left_eye_spherical_dv TEXT,
          left_eye_cylindrical_dv TEXT,
          left_eye_axis_dv TEXT,
          left_eye_spherical_nv TEXT,
          left_eye_cylindrical_nv TEXT,
          left_eye_axis_nv TEXT,
          bifocal_details TEXT,
          tested_by TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (store_id) REFERENCES stores (id),
          FOREIGN KEY (customer_id) REFERENCES customers (id)
        )
      `);

      // Create orders table with store_id
      await client.execute(`
        CREATE TABLE IF NOT EXISTS orders (
          id TEXT PRIMARY KEY,
          store_id TEXT NOT NULL,
          customer_id TEXT NOT NULL,
          checkup_id TEXT,
          order_date TEXT NOT NULL,
          expected_delivery_date TEXT,
          delivered_date TEXT,
          frame TEXT,
          lenses TEXT,
          total_amount REAL,
          advance_amount REAL,
          balance_amount REAL,
          status TEXT DEFAULT 'pending',
          notes TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (store_id) REFERENCES stores (id),
          FOREIGN KEY (customer_id) REFERENCES customers (id),
          FOREIGN KEY (checkup_id) REFERENCES checkups (id)
        )
      `);

      // Create indexes for better performance
      await client.execute('CREATE INDEX IF NOT EXISTS idx_customers_store_id ON customers(store_id)');
      await client.execute('CREATE INDEX IF NOT EXISTS idx_checkups_store_id ON checkups(store_id)');
      await client.execute('CREATE INDEX IF NOT EXISTS idx_orders_store_id ON orders(store_id)');

      initialized = true;
      console.log('Database initialized successfully');
    }
    return true;
  } catch (error) {
    console.error('Error initializing database:', error);
    throw error;
  }
};

const getDatabase = async () => {
  if (!initialized) {
    await initDatabase();
  }
  return client;
};

// Store operations
const storeService = {
  create: async (store) => {
    const id = generateId();
    const result = await client.execute({
      sql: `INSERT INTO stores (id, name, address, phone, email, pin)
            VALUES (?, ?, ?, ?, ?, ?)`,
      args: [
        id,
        store.name || '',
        store.address || null,
        store.phone || null,
        store.email || null,
        store.pin || ''
      ]
    });
    return { lastInsertRowid: id };
  },

  getAll: async () => {
    const result = await client.execute('SELECT id, name, address, phone, email, created_at FROM stores ORDER BY created_at DESC');
    return result.rows;
  },

  getAllWithPins: async () => {
    const result = await client.execute('SELECT id, name, address, phone, email, pin, created_at FROM stores ORDER BY created_at DESC');
    return result.rows;
  },

  getById: async (id) => {
    const result = await client.execute({
      sql: 'SELECT id, name, address, phone, email, created_at FROM stores WHERE id = ?',
      args: [id]
    });
    return result.rows[0] || null;
  },

  authenticate: async (storeId, pin) => {
    const result = await client.execute({
      sql: 'SELECT id, name, address, phone, email FROM stores WHERE id = ? AND pin = ?',
      args: [storeId, pin]
    });
    return result.rows[0] || null;
  },

  update: async (id, store) => {
    const result = await client.execute({
      sql: `UPDATE stores
            SET name = ?, address = ?, phone = ?, email = ?, pin = ?, updated_at = CURRENT_TIMESTAMP
            WHERE id = ?`,
      args: [
        store.name || '',
        store.address || null,
        store.phone || null,
        store.email || null,
        store.pin || '',
        id
      ]
    });
    return { changes: result.rowsAffected };
  },

  delete: async (id) => {
    const result = await client.execute({
      sql: 'DELETE FROM stores WHERE id = ?',
      args: [id]
    });
    return { changes: result.rowsAffected };
  }
};

// Customer operations
const customerService = {
  create: async (customer, storeId) => {
    const id = generateId();
    const result = await client.execute({
      sql: `INSERT INTO customers (id, store_id, name, phone, email, address, date_of_birth, ipd, bridge)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [
        id,
        storeId,
        customer.name || '',
        customer.phone || '',
        customer.email || null,
        customer.address || null,
        customer.date_of_birth || null,
        customer.ipd || null,
        customer.bridge || null
      ]
    });
    return { lastInsertRowid: id };
  },

  findByPhone: async (phone, storeId) => {
    const result = await client.execute({
      sql: 'SELECT * FROM customers WHERE phone = ? AND store_id = ?',
      args: [phone, storeId]
    });
    return result.rows[0] || null;
  },

  findByName: async (name, storeId) => {
    const result = await client.execute({
      sql: 'SELECT * FROM customers WHERE name LIKE ? AND store_id = ?',
      args: [`%${name}%`, storeId]
    });
    return result.rows;
  },

  getAll: async (storeId) => {
    const result = await client.execute({
      sql: 'SELECT * FROM customers WHERE store_id = ? ORDER BY created_at DESC',
      args: [storeId]
    });
    return result.rows;
  },

  getById: async (id, storeId) => {
    const result = await client.execute({
      sql: 'SELECT * FROM customers WHERE id = ? AND store_id = ?',
      args: [id, storeId]
    });
    return result.rows[0] || null;
  },

  update: async (id, customer, storeId) => {
    const result = await client.execute({
      sql: `UPDATE customers
            SET name = ?, phone = ?, email = ?, address = ?, date_of_birth = ?, ipd = ?, bridge = ?, updated_at = CURRENT_TIMESTAMP
            WHERE id = ? AND store_id = ?`,
      args: [
        customer.name || '',
        customer.phone || '',
        customer.email || null,
        customer.address || null,
        customer.date_of_birth || null,
        customer.ipd || null,
        customer.bridge || null,
        id,
        storeId
      ]
    });
    return { changes: result.rowsAffected };
  }
};

// Checkup operations
const checkupService = {
  create: async (checkup, storeId) => {
    const id = generateId();
    const result = await client.execute({
      sql: `INSERT INTO checkups (id, store_id, customer_id, date, right_eye_spherical_dv, right_eye_cylindrical_dv,
                                  right_eye_axis_dv, right_eye_spherical_nv, right_eye_cylindrical_nv,
                                  right_eye_axis_nv, left_eye_spherical_dv, left_eye_cylindrical_dv,
                                  left_eye_axis_dv, left_eye_spherical_nv, left_eye_cylindrical_nv,
                                  left_eye_axis_nv, bifocal_details, tested_by)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [
        id,
        storeId,
        checkup.customer_id,
        checkup.date || new Date().toISOString().split('T')[0],
        checkup.right_eye_spherical_dv && checkup.right_eye_spherical_dv.trim() !== '' ? checkup.right_eye_spherical_dv : null,
        checkup.right_eye_cylindrical_dv && checkup.right_eye_cylindrical_dv.trim() !== '' ? checkup.right_eye_cylindrical_dv : null,
        checkup.right_eye_axis_dv && checkup.right_eye_axis_dv.trim() !== '' ? checkup.right_eye_axis_dv : null,
        checkup.right_eye_spherical_nv && checkup.right_eye_spherical_nv.trim() !== '' ? checkup.right_eye_spherical_nv : null,
        checkup.right_eye_cylindrical_nv && checkup.right_eye_cylindrical_nv.trim() !== '' ? checkup.right_eye_cylindrical_nv : null,
        checkup.right_eye_axis_nv && checkup.right_eye_axis_nv.trim() !== '' ? checkup.right_eye_axis_nv : null,
        checkup.left_eye_spherical_dv && checkup.left_eye_spherical_dv.trim() !== '' ? checkup.left_eye_spherical_dv : null,
        checkup.left_eye_cylindrical_dv && checkup.left_eye_cylindrical_dv.trim() !== '' ? checkup.left_eye_cylindrical_dv : null,
        checkup.left_eye_axis_dv && checkup.left_eye_axis_dv.trim() !== '' ? checkup.left_eye_axis_dv : null,
        checkup.left_eye_spherical_nv && checkup.left_eye_spherical_nv.trim() !== '' ? checkup.left_eye_spherical_nv : null,
        checkup.left_eye_cylindrical_nv && checkup.left_eye_cylindrical_nv.trim() !== '' ? checkup.left_eye_cylindrical_nv : null,
        checkup.left_eye_axis_nv && checkup.left_eye_axis_nv.trim() !== '' ? checkup.left_eye_axis_nv : null,
        checkup.bifocal_details && checkup.bifocal_details.trim() !== '' ? checkup.bifocal_details : null,
        checkup.tested_by && checkup.tested_by.trim() !== '' ? checkup.tested_by : null
      ]
    });
    return { lastInsertRowid: id };
  },

  getByCustomerId: async (customerId, storeId) => {
    const result = await client.execute({
      sql: 'SELECT * FROM checkups WHERE customer_id = ? AND store_id = ? ORDER BY date DESC',
      args: [customerId, storeId]
    });
    return result.rows;
  },

  getById: async (id, storeId) => {
    const result = await client.execute({
      sql: 'SELECT * FROM checkups WHERE id = ? AND store_id = ?',
      args: [id, storeId]
    });
    return result.rows[0] || null;
  },

  update: async (id, checkup, storeId) => {
    const result = await client.execute({
      sql: `UPDATE checkups
            SET date = ?, right_eye_spherical_dv = ?, right_eye_cylindrical_dv = ?,
                right_eye_axis_dv = ?, right_eye_spherical_nv = ?, right_eye_cylindrical_nv = ?,
                right_eye_axis_nv = ?, left_eye_spherical_dv = ?, left_eye_cylindrical_dv = ?,
                left_eye_axis_dv = ?, left_eye_spherical_nv = ?, left_eye_cylindrical_nv = ?,
                left_eye_axis_nv = ?, bifocal_details = ?, tested_by = ?
            WHERE id = ? AND store_id = ?`,
      args: [
        checkup.date || new Date().toISOString().split('T')[0],
        checkup.right_eye_spherical_dv && checkup.right_eye_spherical_dv.trim() !== '' ? checkup.right_eye_spherical_dv : null,
        checkup.right_eye_cylindrical_dv && checkup.right_eye_cylindrical_dv.trim() !== '' ? checkup.right_eye_cylindrical_dv : null,
        checkup.right_eye_axis_dv && checkup.right_eye_axis_dv.trim() !== '' ? checkup.right_eye_axis_dv : null,
        checkup.right_eye_spherical_nv && checkup.right_eye_spherical_nv.trim() !== '' ? checkup.right_eye_spherical_nv : null,
        checkup.right_eye_cylindrical_nv && checkup.right_eye_cylindrical_nv.trim() !== '' ? checkup.right_eye_cylindrical_nv : null,
        checkup.right_eye_axis_nv && checkup.right_eye_axis_nv.trim() !== '' ? checkup.right_eye_axis_nv : null,
        checkup.left_eye_spherical_dv && checkup.left_eye_spherical_dv.trim() !== '' ? checkup.left_eye_spherical_dv : null,
        checkup.left_eye_cylindrical_dv && checkup.left_eye_cylindrical_dv.trim() !== '' ? checkup.left_eye_cylindrical_dv : null,
        checkup.left_eye_axis_dv && checkup.left_eye_axis_dv.trim() !== '' ? checkup.left_eye_axis_dv : null,
        checkup.left_eye_spherical_nv && checkup.left_eye_spherical_nv.trim() !== '' ? checkup.left_eye_spherical_nv : null,
        checkup.left_eye_cylindrical_nv && checkup.left_eye_cylindrical_nv.trim() !== '' ? checkup.left_eye_cylindrical_nv : null,
        checkup.left_eye_axis_nv && checkup.left_eye_axis_nv.trim() !== '' ? checkup.left_eye_axis_nv : null,
        checkup.bifocal_details && checkup.bifocal_details.trim() !== '' ? checkup.bifocal_details : null,
        checkup.tested_by && checkup.tested_by.trim() !== '' ? checkup.tested_by : null,
        id,
        storeId
      ]
    });
    return { changes: result.rowsAffected };
  },

  delete: async (id, storeId) => {
    const result = await client.execute({
      sql: 'DELETE FROM checkups WHERE id = ? AND store_id = ?',
      args: [id, storeId]
    });
    return { changes: result.rowsAffected };
  }
};

// Order operations
const orderService = {
  create: async (order, storeId) => {
    const id = generateId();
    const result = await client.execute({
      sql: `INSERT INTO orders (id, store_id, customer_id, checkup_id, order_date, expected_delivery_date, delivered_date, frame,
                               lenses, total_amount, advance_amount, balance_amount, status, notes)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [
        id,
        storeId,
        order.customer_id,
        order.checkup_id || null,
        order.order_date || new Date().toISOString().split('T')[0],
        order.expected_delivery_date || null,
        order.delivered_date || null,
        order.frame || null,
        order.lenses || null,
        order.total_amount || 0,
        order.advance_amount || 0,
        order.balance_amount || 0,
        order.status || 'pending',
        order.notes || null
      ]
    });
    return { lastInsertRowid: id };
  },

  getByCustomerId: async (customerId, storeId) => {
    const result = await client.execute({
      sql: 'SELECT * FROM orders WHERE customer_id = ? AND store_id = ? ORDER BY order_date DESC',
      args: [customerId, storeId]
    });
    return result.rows;
  },

  getAll: async (storeId) => {
    const result = await client.execute({
      sql: `
        SELECT 
          o.*,
          c.name as customer_name,
          c.phone as customer_phone,
          CASE WHEN ch.id IS NOT NULL THEN 1 ELSE 0 END as has_checkup
        FROM orders o
        LEFT JOIN customers c ON o.customer_id = c.id AND c.store_id = ?
        LEFT JOIN checkups ch ON o.checkup_id = ch.id AND ch.store_id = ?
        WHERE o.store_id = ?
        ORDER BY o.order_date DESC
      `,
      args: [storeId, storeId, storeId]
    });
    return result.rows;
  },

  getById: async (id, storeId) => {
    const result = await client.execute({
      sql: `
        SELECT 
          o.*,
          c.name as customer_name,
          c.phone as customer_phone,
          CASE WHEN ch.id IS NOT NULL THEN 1 ELSE 0 END as has_checkup
        FROM orders o
        LEFT JOIN customers c ON o.customer_id = c.id AND c.store_id = ?
        LEFT JOIN checkups ch ON o.checkup_id = ch.id AND ch.store_id = ?
        WHERE o.id = ? AND o.store_id = ?
      `,
      args: [storeId, storeId, id, storeId]
    });
    return result.rows[0] || null;
  },

  getSalesReport: async (startDate, endDate, storeId) => {
    const result = await client.execute({
      sql: `
        SELECT 
          DATE(order_date) as date,
          COUNT(*) as total_orders,
          SUM(total_amount) as total_sales,
          SUM(advance_amount) as total_advance,
          SUM(balance_amount) as total_balance
        FROM orders 
        WHERE DATE(order_date) BETWEEN ? AND ? AND store_id = ?
        GROUP BY DATE(order_date)
        ORDER BY date DESC
      `,
      args: [startDate, endDate, storeId]
    });
    return result.rows;
  },

  update: async (id, order, storeId) => {
    const result = await client.execute({
      sql: `UPDATE orders
            SET customer_id = ?, checkup_id = ?, order_date = ?, expected_delivery_date = ?, delivered_date = ?, frame = ?,
                lenses = ?, total_amount = ?, advance_amount = ?, balance_amount = ?, status = ?, notes = ?
            WHERE id = ? AND store_id = ?`,
      args: [
        order.customer_id,
        order.checkup_id || null,
        order.order_date || new Date().toISOString().split('T')[0],
        order.expected_delivery_date || null,
        order.delivered_date || null,
        order.frame || null,
        order.lenses || null,
        order.total_amount || 0,
        order.advance_amount || 0,
        order.balance_amount || 0,
        order.status || 'pending',
        order.notes || null,
        id,
        storeId
      ]
    });
    return { changes: result.rowsAffected };
  },

  updateStatus: async (id, status, storeId) => {
    const result = await client.execute({
      sql: 'UPDATE orders SET status = ? WHERE id = ? AND store_id = ?',
      args: [status, id, storeId]
    });
    return { changes: result.rowsAffected };
  }
};

// Super Admin operations - Access data across all stores
const superAdminService = {
  // Get all customers from all stores
  getAllCustomers: async () => {
    const result = await client.execute(`
      SELECT
        c.*,
        s.name as store_name,
        s.address as store_address
      FROM customers c
      LEFT JOIN stores s ON c.store_id = s.id
      ORDER BY c.created_at DESC
    `);
    return result.rows;
  },

  // Get all checkups from all stores
  getAllCheckups: async () => {
    const result = await client.execute(`
      SELECT
        ch.*,
        c.name as customer_name,
        c.phone as customer_phone,
        s.name as store_name
      FROM checkups ch
      LEFT JOIN customers c ON ch.customer_id = c.id
      LEFT JOIN stores s ON ch.store_id = s.id
      ORDER BY ch.date DESC
    `);
    return result.rows;
  },

  // Get all orders from all stores
  getAllOrders: async () => {
    const result = await client.execute(`
      SELECT
        o.*,
        c.name as customer_name,
        c.phone as customer_phone,
        s.name as store_name,
        CASE WHEN ch.id IS NOT NULL THEN 1 ELSE 0 END as has_checkup
      FROM orders o
      LEFT JOIN customers c ON o.customer_id = c.id
      LEFT JOIN checkups ch ON o.checkup_id = ch.id
      LEFT JOIN stores s ON o.store_id = s.id
      ORDER BY o.order_date DESC
    `);
    return result.rows;
  },

  // Get sales report across all stores
  getAllStoresSalesReport: async (startDate, endDate) => {
    const result = await client.execute({
      sql: `
        SELECT
          s.name as store_name,
          s.id as store_id,
          DATE(o.order_date) as date,
          COUNT(o.id) as total_orders,
          SUM(o.total_amount) as total_sales,
          SUM(o.advance_amount) as total_advance,
          SUM(o.balance_amount) as total_balance
        FROM orders o
        LEFT JOIN stores s ON o.store_id = s.id
        WHERE DATE(o.order_date) BETWEEN ? AND ?
        GROUP BY s.id, s.name, DATE(o.order_date)
        ORDER BY DATE(o.order_date) DESC, s.name
      `,
      args: [startDate, endDate]
    });
    return result.rows;
  },

  // Get consolidated sales report (all stores combined by date)
  getConsolidatedSalesReport: async (startDate, endDate) => {
    const result = await client.execute({
      sql: `
        SELECT
          DATE(order_date) as date,
          COUNT(*) as total_orders,
          SUM(total_amount) as total_sales,
          SUM(advance_amount) as total_advance,
          SUM(balance_amount) as total_balance
        FROM orders
        WHERE DATE(order_date) BETWEEN ? AND ?
        GROUP BY DATE(order_date)
        ORDER BY date DESC
      `,
      args: [startDate, endDate]
    });
    return result.rows;
  },

  // Get sales report for specific stores
  getSelectedStoresSalesReport: async (startDate, endDate, storeIds = []) => {
    if (!storeIds || storeIds.length === 0) {
      return [];
    }

    const placeholders = storeIds.map(() => '?').join(',');
    const result = await client.execute({
      sql: `
        SELECT
          s.name as store_name,
          s.id as store_id,
          DATE(o.order_date) as date,
          COUNT(o.id) as total_orders,
          SUM(o.total_amount) as total_sales,
          SUM(o.advance_amount) as total_advance,
          SUM(o.balance_amount) as total_balance
        FROM orders o
        LEFT JOIN stores s ON o.store_id = s.id
        WHERE DATE(o.order_date) BETWEEN ? AND ? AND o.store_id IN (${placeholders})
        GROUP BY s.id, s.name, DATE(o.order_date)
        ORDER BY DATE(o.order_date) DESC, s.name
      `,
      args: [startDate, endDate, ...storeIds]
    });
    return result.rows;
  },

  // Get consolidated sales report for specific stores
  getConsolidatedSalesReportForStores: async (startDate, endDate, storeIds = []) => {
    if (!storeIds || storeIds.length === 0) {
      return [];
    }

    const placeholders = storeIds.map(() => '?').join(',');
    const result = await client.execute({
      sql: `
        SELECT
          DATE(order_date) as date,
          COUNT(*) as total_orders,
          SUM(total_amount) as total_sales,
          SUM(advance_amount) as total_advance,
          SUM(balance_amount) as total_balance
        FROM orders
        WHERE DATE(order_date) BETWEEN ? AND ? AND store_id IN (${placeholders})
        GROUP BY DATE(order_date)
        ORDER BY date DESC
      `,
      args: [startDate, endDate, ...storeIds]
    });
    return result.rows;
  },

  // Get customers by store
  getCustomersByStore: async () => {
    const result = await client.execute(`
      SELECT
        s.id as store_id,
        s.name as store_name,
        COUNT(c.id) as customer_count
      FROM stores s
      LEFT JOIN customers c ON s.id = c.store_id
      GROUP BY s.id, s.name
      ORDER BY s.name
    `);
    return result.rows;
  },

  // Get orders by store
  getOrdersByStore: async () => {
    const result = await client.execute(`
      SELECT
        s.id as store_id,
        s.name as store_name,
        COUNT(o.id) as order_count,
        SUM(o.total_amount) as total_sales,
        SUM(o.advance_amount) as total_advance,
        SUM(o.balance_amount) as total_balance
      FROM stores s
      LEFT JOIN orders o ON s.id = o.store_id
      GROUP BY s.id, s.name
      ORDER BY s.name
    `);
    return result.rows;
  },

  // Get checkups by store
  getCheckupsByStore: async () => {
    const result = await client.execute(`
      SELECT
        s.id as store_id,
        s.name as store_name,
        COUNT(ch.id) as checkup_count
      FROM stores s
      LEFT JOIN checkups ch ON s.id = ch.store_id
      GROUP BY s.id, s.name
      ORDER BY s.name
    `);
    return result.rows;
  }
};

export {
  resetDatabase,
  initDatabase,
  getDatabase,
  storeService,
  customerService,
  checkupService,
  orderService,
  superAdminService
};
