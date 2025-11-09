import { executeQuery, executeTransaction } from '../config/database.js';

export class Quote {
  static async findAll(limit = 20, excludeConverted = true) {
    try {
      let query = 'SELECT * FROM quotes WHERE is_active = TRUE';
      if (excludeConverted) {
        query += ' AND status != "Converted"';
      }
      query += ' ORDER BY created_at DESC';
      if (limit) {
        query += ` LIMIT ${limit}`;
      }

      const results = await executeQuery(query);
      return results;
    } catch (error) {
      console.error('Error finding all quotes:', error);
      return [];
    }
  }

  static async findById(quoteId) {
    try {
      const results = await executeQuery(
        'SELECT * FROM quotes WHERE quote_id = ? AND is_active = TRUE',
        [quoteId]
      );
      return results[0] || null;
    } catch (error) {
      console.error('Error finding quote by ID:', error);
      return null;
    }
  }

  static async findByNumber(quoteNumber) {
    try {
      const results = await executeQuery(
        'SELECT * FROM quotes WHERE quote_number = ? AND is_active = TRUE',
        [quoteNumber]
      );
      return results[0] || null;
    } catch (error) {
      console.error('Error finding quote by number:', error);
      return null;
    }
  }

  static async create(quoteData, items, createdBy) {
    try {
      const {
        customer_name,
        contact_person = '',
        email = '',
        phone = '',
        customer_address,
        valid_until,
        terms_conditions = '',
        notes = ''
      } = quoteData;

      // Generate quote number
      const count = await executeQuery('SELECT COUNT(*) as count FROM quotes');
      const quote_number = `QT-2025-${String(count[0].count + 1).padStart(3, '0')}`;
      const quote_date = new Date().toISOString().split('T')[0];

      // Calculate totals
      const subtotal = items.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0);
      const tax_amount = subtotal * 0.18; // 18% GST
      const total_amount = subtotal + tax_amount;

      // Create quote and items in transaction
      const queries = [
        {
          query: `INSERT INTO quotes (quote_number, customer_name, contact_person, email, phone, customer_address, 
                   quote_date, valid_until, subtotal, tax_amount, total_amount, terms_conditions, notes, created_by)
                   VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          params: [quote_number, customer_name, contact_person, email, phone, customer_address, 
                   quote_date, valid_until, subtotal, tax_amount, total_amount, terms_conditions, notes, createdBy]
        }
      ];

      const results = await executeTransaction(queries);
      const quoteId = results[0].insertId;

      // Insert quote items
      for (const item of items) {
        await executeQuery(
          `INSERT INTO quote_items (quote_id, item_code, item_name, description, quantity, uom, unit_price, total_price)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [quoteId, item.item_code, item.item_name, item.description, item.quantity, item.uom, item.unit_price, item.total_price]
        );
      }

      return { quote_id: quoteId, quote_number, ...quoteData, subtotal, tax_amount, total_amount };
    } catch (error) {
      console.error('Error creating quote:', error);
      throw error;
    }
  }

  static async getQuoteItems(quoteId) {
    try {
      const results = await executeQuery(
        'SELECT * FROM quote_items WHERE quote_id = ? ORDER BY quote_item_id',
        [quoteId]
      );
      return results;
    } catch (error) {
      console.error('Error getting quote items:', error);
      return [];
    }
  }

  static async updateStatus(quoteId, status) {
    try {
      await executeQuery(
        'UPDATE quotes SET status = ? WHERE quote_id = ?',
        [status, quoteId]
      );
      return true;
    } catch (error) {
      console.error('Error updating quote status:', error);
      throw error;
    }
  }

  static async convertToOrder(quoteId) {
    try {
      await executeQuery(
        'UPDATE quotes SET status = "Converted" WHERE quote_id = ?',
        [quoteId]
      );
      return true;
    } catch (error) {
      console.error('Error converting quote to order:', error);
      throw error;
    }
  }

  static async getStatistics() {
    try {
      const totalQuotes = await executeQuery(
        'SELECT COUNT(*) as count FROM quotes WHERE is_active = TRUE AND status != "Converted"'
      );
      
      const statusCounts = await executeQuery(
        `SELECT status, COUNT(*) as count FROM quotes 
         WHERE is_active = TRUE AND status != "Converted" 
         GROUP BY status`
      );
      
      const totalValue = await executeQuery(
        'SELECT SUM(total_amount) as total FROM quotes WHERE is_active = TRUE AND status != "Converted"'
      );

      return {
        totalQuotes: totalQuotes[0].count,
        statusCounts: statusCounts,
        totalValue: totalValue[0].total || 0
      };
    } catch (error) {
      console.error('Error getting quote statistics:', error);
      return { totalQuotes: 0, statusCounts: [], totalValue: 0 };
    }
  }

  static async search(searchTerm) {
    try {
      const results = await executeQuery(
        `SELECT * FROM quotes 
         WHERE (quote_number LIKE ? OR customer_name LIKE ? OR contact_person LIKE ?) 
         AND is_active = TRUE AND status != "Converted"
         ORDER BY created_at DESC`,
        [`%${searchTerm}%`, `%${searchTerm}%`, `%${searchTerm}%`]
      );
      return results;
    } catch (error) {
      console.error('Error searching quotes:', error);
      return [];
    }
  }

  static async deactivate(quoteId) {
    try {
      await executeQuery(
        'UPDATE quotes SET is_active = FALSE WHERE quote_id = ?',
        [quoteId]
      );
      return true;
    } catch (error) {
      console.error('Error deactivating quote:', error);
      throw error;
    }
  }
}