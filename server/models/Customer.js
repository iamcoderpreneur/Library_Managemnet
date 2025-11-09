import { executeQuery } from '../config/database.js';

export class Customer {
  static async findAll() {
    try {
      const results = await executeQuery(
        'SELECT * FROM customers WHERE is_active = TRUE ORDER BY created_date DESC'
      );
      return results;
    } catch (error) {
      console.error('Error finding all customers:', error);
      return [];
    }
  }

  static async findById(customerId) {
    try {
      const results = await executeQuery(
        'SELECT * FROM customers WHERE customer_id = ? AND is_active = TRUE',
        [customerId]
      );
      return results[0] || null;
    } catch (error) {
      console.error('Error finding customer by ID:', error);
      return null;
    }
  }

  static async findByName(customerName) {
    try {
      const results = await executeQuery(
        'SELECT * FROM customers WHERE customer_name = ? AND is_active = TRUE',
        [customerName]
      );
      return results[0] || null;
    } catch (error) {
      console.error('Error finding customer by name:', error);
      return null;
    }
  }

  static async create(customerData) {
    try {
      const {
        customer_name,
        contact_person = '',
        email = '',
        phone = '',
        address,
        gst_number,
        credit_limit = 0,
        payment_terms = 'Net 30'
      } = customerData;

      // Generate customer code
      const count = await executeQuery('SELECT COUNT(*) as count FROM customers');
      const customer_code = `CUS${String(count[0].count + 1).padStart(3, '0')}`;

      const result = await executeQuery(
        `INSERT INTO customers (customer_code, customer_name, contact_person, email, phone, address, gst_number, credit_limit, payment_terms)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [customer_code, customer_name, contact_person, email, phone, address, gst_number, credit_limit, payment_terms]
      );

      return { customer_id: result.insertId, customer_code, ...customerData };
    } catch (error) {
      console.error('Error creating customer:', error);
      throw error;
    }
  }

  static async createBulk(customersData) {
    try {
      const count = await executeQuery('SELECT COUNT(*) as count FROM customers');
      let currentCount = count[0].count;

      const values = customersData.map((customer, index) => {
        const customer_code = `CUS${String(currentCount + index + 1).padStart(3, '0')}`;
        return [
          customer_code,
          customer.customer_name,
          customer.contact_person || '',
          customer.email || '',
          customer.phone || '',
          customer.address,
          customer.gst_number,
          customer.credit_limit || 0,
          customer.payment_terms || 'Net 30'
        ];
      });

      const placeholders = values.map(() => '(?, ?, ?, ?, ?, ?, ?, ?, ?)').join(', ');
      const flatValues = values.flat();

      await executeQuery(
        `INSERT INTO customers (customer_code, customer_name, contact_person, email, phone, address, gst_number, credit_limit, payment_terms)
         VALUES ${placeholders}`,
        flatValues
      );

      return true;
    } catch (error) {
      console.error('Error creating bulk customers:', error);
      throw error;
    }
  }

  static async update(customerId, customerData) {
    try {
      const {
        customer_name,
        contact_person,
        email,
        phone,
        address,
        gst_number,
        credit_limit,
        payment_terms
      } = customerData;

      await executeQuery(
        `UPDATE customers SET 
         customer_name = ?, contact_person = ?, email = ?, phone = ?, 
         address = ?, gst_number = ?, credit_limit = ?, payment_terms = ?
         WHERE customer_id = ?`,
        [customer_name, contact_person, email, phone, address, gst_number, credit_limit, payment_terms, customerId]
      );

      return true;
    } catch (error) {
      console.error('Error updating customer:', error);
      throw error;
    }
  }

  static async deactivate(customerId) {
    try {
      await executeQuery(
        'UPDATE customers SET is_active = FALSE WHERE customer_id = ?',
        [customerId]
      );
      return true;
    } catch (error) {
      console.error('Error deactivating customer:', error);
      throw error;
    }
  }

  static async search(searchTerm) {
    try {
      const results = await executeQuery(
        `SELECT * FROM customers 
         WHERE (customer_name LIKE ? OR customer_code LIKE ? OR contact_person LIKE ?) 
         AND is_active = TRUE 
         ORDER BY customer_name`,
        [`%${searchTerm}%`, `%${searchTerm}%`, `%${searchTerm}%`]
      );
      return results;
    } catch (error) {
      console.error('Error searching customers:', error);
      return [];
    }
  }
}