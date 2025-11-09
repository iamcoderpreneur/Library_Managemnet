import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

// Database configuration
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || 'password',
  database: process.env.DB_NAME || 'supply_chain_db',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  acquireTimeout: 60000,
  timeout: 60000,
  reconnect: true
};

// Create connection pool
let pool;

export const initializeDatabase = async () => {
  try {
    // Create connection pool
    pool = mysql.createPool(dbConfig);
    
    // Test connection
    const connection = await pool.getConnection();
    console.log('✅ MySQL Database connected successfully');
    
    // Create database if it doesn't exist
    await connection.execute(`CREATE DATABASE IF NOT EXISTS ${dbConfig.database}`);
    console.log('✅ Database created/verified');
    
    connection.release();
    
    // Initialize tables
    await createTables();
    
    return pool;
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    
    // Fallback to in-memory storage if MySQL is not available
    console.log('🔄 Falling back to in-memory storage...');
    return null;
  }
};

export const getPool = () => {
  if (!pool) {
    throw new Error('Database not initialized. Call initializeDatabase() first.');
  }
  return pool;
};

// Create all necessary tables
const createTables = async () => {
  try {
    const connection = await pool.getConnection();
    
    // Users table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS users (
        id VARCHAR(36) PRIMARY KEY,
        username VARCHAR(50) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        name VARCHAR(100) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        role INT NOT NULL DEFAULT 5,
        role_name VARCHAR(50) NOT NULL DEFAULT 'User',
        role_level INT NOT NULL DEFAULT 5,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);

    // Items table
    await connection.execute(`
        CREATE TABLE IF NOT EXISTS items (
      ItemID INT AUTO_INCREMENT PRIMARY KEY,
      ItemName VARCHAR(255) NOT NULL,
      Alias VARCHAR(255),
      PartNumber VARCHAR(100),
      Description TEXT,
      Category VARCHAR(100) DEFAULT 'General',
      UOM VARCHAR(50) DEFAULT 'nos',
      HSNCode VARCHAR(50),
      StockQuantity INT DEFAULT 0,
      UnitPrice DECIMAL(10,2) DEFAULT 0,
      TotalValue DECIMAL(12,2) DEFAULT 0,
      ReorderLevel INT DEFAULT 5,
      IsActive BOOLEAN DEFAULT 1,
      CreatedDate DATE
    );
    `);


 

    // Customers table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS customers (
        customer_id INT AUTO_INCREMENT PRIMARY KEY,
        customer_code VARCHAR(50) UNIQUE NOT NULL,
        customer_name VARCHAR(255) NOT NULL,
        contact_person VARCHAR(100),
        email VARCHAR(255),
        phone VARCHAR(20),
        address TEXT NOT NULL,
        gst_number VARCHAR(15) NOT NULL,
        credit_limit DECIMAL(12,2) DEFAULT 0,
        payment_terms VARCHAR(50) DEFAULT 'Net 30',
        is_active BOOLEAN DEFAULT TRUE,
        created_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);

    // Vendors table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS vendors (
        vendor_id INT AUTO_INCREMENT PRIMARY KEY,
        vendor_code VARCHAR(50) UNIQUE NOT NULL,
        vendor_name VARCHAR(255) NOT NULL,
        contact_person VARCHAR(100),
        email VARCHAR(255),
        phone VARCHAR(20),
        address TEXT,
        payment_terms VARCHAR(50) DEFAULT 'Net 30',
        rating DECIMAL(3,2),
        is_active BOOLEAN DEFAULT TRUE,
        created_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);

    // Quotes table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS quotes (
        quote_id INT AUTO_INCREMENT PRIMARY KEY,
        quote_number VARCHAR(50) UNIQUE NOT NULL,
        customer_name VARCHAR(255) NOT NULL,
        contact_person VARCHAR(100),
        email VARCHAR(255),
        phone VARCHAR(20),
        customer_address TEXT NOT NULL,
        quote_date DATE NOT NULL,
        valid_until DATE NOT NULL,
        status ENUM('Draft', 'Sent', 'Accepted', 'Rejected', 'Expired', 'Converted') DEFAULT 'Draft',
        subtotal DECIMAL(12,2) NOT NULL DEFAULT 0,
        tax_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
        total_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
        terms_conditions TEXT,
        notes TEXT,
        created_by VARCHAR(36),
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (created_by) REFERENCES users(id)
      )
    `);

    // Quote Items table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS quote_items (
        quote_item_id INT AUTO_INCREMENT PRIMARY KEY,
        quote_id INT NOT NULL,
        item_code VARCHAR(50) NOT NULL,
        item_name VARCHAR(255) NOT NULL,
        description TEXT,
        quantity DECIMAL(10,3) NOT NULL,
        uom VARCHAR(20) DEFAULT 'nos',
        unit_price DECIMAL(10,2) NOT NULL,
        total_price DECIMAL(12,2) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (quote_id) REFERENCES quotes(quote_id) ON DELETE CASCADE
      )
    `);

    // Locations table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS locations (
        location_id INT AUTO_INCREMENT PRIMARY KEY,
        location_code VARCHAR(50) UNIQUE NOT NULL,
        location_name VARCHAR(255) NOT NULL,
        location_type VARCHAR(50) NOT NULL,
        address TEXT,
        capacity DECIMAL(10,2),
        current_utilization DECIMAL(5,2),
        manager_id VARCHAR(36),
        is_active BOOLEAN DEFAULT TRUE,
        created_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);

    // BOM table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS bom (
        bom_id INT AUTO_INCREMENT PRIMARY KEY,
        parent_item_id INT NOT NULL,
        child_item_id INT NOT NULL,
        quantity DECIMAL(10,3) NOT NULL,
        unit_of_measure VARCHAR(20) NOT NULL,
        effective_date DATE NOT NULL,
        expiry_date DATE,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (parent_item_id) REFERENCES items(item_id),
        FOREIGN KEY (child_item_id) REFERENCES items(item_id)
      )
    `);

    // Projects table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS projects (
        project_id INT AUTO_INCREMENT PRIMARY KEY,
        project_code VARCHAR(50) UNIQUE NOT NULL,
        project_name VARCHAR(255) NOT NULL,
        description TEXT,
        customer_id INT,
        start_date DATE NOT NULL,
        end_date DATE,
        status VARCHAR(50) NOT NULL DEFAULT 'Planning',
        budget DECIMAL(12,2),
        actual_cost DECIMAL(12,2),
        project_manager VARCHAR(100),
        is_active BOOLEAN DEFAULT TRUE,
        created_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (customer_id) REFERENCES customers(customer_id)
      )
    `);

    console.log('✅ All database tables created successfully');
    connection.release();
    
    // Insert default data
    await insertDefaultData();
    
  } catch (error) {
    console.error('❌ Error creating tables:', error.message);
    throw error;
  }
};

// Insert default data
const insertDefaultData = async () => {
  try {
    const connection = await pool.getConnection();
    
    // Insert default users
    const defaultUsers = [
      {
        id: '1',
        username: 'superadmin',
        password: 'admin123',
        name: 'Super Administrator',
        email: 'superadmin@recordtek.com',
        role: 1,
        role_name: 'Super Admin',
        role_level: 1
      },
      {
        id: '2',
        username: 'admin',
        password: 'admin123',
        name: 'Administrator',
        email: 'admin@recordtek.com',
        role: 2,
        role_name: 'Admin',
        role_level: 2
      },
      {
        id: '3',
        username: 'manager',
        password: 'manager123',
        name: 'Manager',
        email: 'manager@recordtek.com',
        role: 3,
        role_name: 'Manager',
        role_level: 3
      },
      {
        id: '4',
        username: 'supervisor',
        password: 'supervisor123',
        name: 'Supervisor',
        email: 'supervisor@recordtek.com',
        role: 4,
        role_name: 'Supervisor',
        role_level: 4
      },
      {
        id: '5',
        username: 'user',
        password: 'user123',
        name: 'User',
        email: 'user@recordtek.com',
        role: 5,
        role_name: 'User',
        role_level: 5
      }
    ];

    for (const user of defaultUsers) {
      // Hash password before inserting
      const bcrypt = await import('bcryptjs');
      const hashedPassword = await bcrypt.default.hash(user.password, 10);
      
      await connection.execute(`
        INSERT IGNORE INTO users (id, username, password, name, email, role, role_name, role_level)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `, [user.id, user.username, hashedPassword, user.name, user.email, user.role, user.role_name, user.role_level]);
    }

    // Insert default locations
    await connection.execute(`
      INSERT IGNORE INTO locations (location_id, location_code, location_name, location_type, address, capacity, current_utilization)
      VALUES 
      (1, 'WH001', 'Main Warehouse', 'Warehouse', '789 Storage St, Warehouse District, WD 11111', 10000.00, 65.5),
      (2, 'FAC001', 'Production Facility A', 'Factory', '321 Manufacturing Ave, Industrial Zone, IZ 22222', 5000.00, 80.2)
    `);

    // Insert default items
    const defaultItems = [
      // {
      //   item_code: 'ITM001',
      //   item_name: 'Steel Rod 10mm',
      //   description: 'High grade steel rod for construction',
      //   category: 'Raw Materials',
      //   unit_price: 25.50,
      //   stock_quantity: 500,
      //   reorder_level: 100,
      //   location_id: 1
      // },
      // {
      //   item_code: 'ITM002',
      //   item_name: 'Aluminum Sheet',
      //   description: '2mm thick aluminum sheet',
      //   category: 'Raw Materials',
      //   unit_price: 45.00,
      //   stock_quantity: 200,
      //   reorder_level: 50,
      //   location_id: 1
      // }
    ];

    for (const item of defaultItems) {
      await connection.execute(`
        INSERT IGNORE INTO items (item_code, item_name, description, category, unit_price, stock_quantity, reorder_level, location_id)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `, [item.item_code, item.item_name, item.description, item.category, item.unit_price, item.stock_quantity, item.reorder_level, item.location_id]);
    }

    // Insert default customers
    await connection.execute(`
      INSERT IGNORE INTO customers (customer_code, customer_name, contact_person, email, phone, address, gst_number, credit_limit, payment_terms)
      VALUES 
      ('CUS001', 'ABC Manufacturing Ltd', 'Sarah Johnson', 'sarah@abcmfg.com', '+91-98765-43210', '456 Business Blvd, Commerce City, Mumbai 400001', '27ABCDE1234F1Z5', 50000.00, 'Net 15'),
      ('CUS002', 'XYZ Industries Pvt Ltd', 'Michael Chen', 'michael@xyzind.com', '+91-98765-43211', '789 Industrial Ave, Manufacturing Zone, Pune 411001', '27XYZAB5678G2H9', 75000.00, 'Net 30')
    `);

    console.log('✅ Default data inserted successfully');
    connection.release();
    
  } catch (error) {
    console.error('❌ Error inserting default data:', error.message);
  }
};

// Database query helper functions
export const executeQuery = async (query, params = []) => {
  try {
    const connection = await pool.getConnection();
    const [results] = await connection.execute(query, params);
    connection.release();
    return results;
  } catch (error) {
    console.error('❌ Database query error:', error.message);
    throw error;
  }
};

export const executeTransaction = async (queries) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    
    const results = [];
    for (const { query, params } of queries) {
      const [result] = await connection.execute(query, params);
      results.push(result);
    }
    
    await connection.commit();
    connection.release();
    return results;
  } catch (error) {
    await connection.rollback();
    connection.release();
    throw error;
  }
};

export default pool;