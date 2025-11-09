import express from 'express';
import { authenticateToken, requirePermission } from '../middleware/auth.js';
import { database } from '../data/database.js';

const router = express.Router();

// Get all customers
router.get('/', authenticateToken, (req, res) => {
  try {
    const customers = database.customers;
    res.json(customers);
  } catch (error) {
    console.error('Error fetching customers:', error);
    res.status(500).json({ error: 'Failed to fetch customers' });
  }
});

// Get customer by ID
router.get('/:id', authenticateToken, (req, res) => {
  try {
    const customer = database.customers.find(c => c.customer_id === parseInt(req.params.id));
    if (!customer) {
      return res.status(404).json({ error: 'Customer not found' });
    }
    res.json(customer);
  } catch (error) {
    console.error('Error fetching customer:', error);
    res.status(500).json({ error: 'Failed to fetch customer' });
  }
});

// Create new customer
router.post('/', authenticateToken, requirePermission('user.create'), (req, res) => {
  try {
    const newCustomer = {
      customer_id: database.customers.length + 1,
      customer_code: `CUS${String(database.customers.length + 1).padStart(3, '0')}`,
      customer_name: req.body.customer_name,
      contact_person: req.body.contact_person || '',
      email: req.body.email || '',
      phone: req.body.phone || '',
      address: req.body.address,
      gst_number: req.body.gst_number,
      credit_limit: req.body.credit_limit || 0,
      payment_terms: req.body.payment_terms || 'Net 30',
      is_active: true,
      created_date: new Date().toISOString()
    };
    
    database.customers.push(newCustomer);
    res.status(201).json(customer);
  } catch (error) {
    console.error('Error creating customer:', error);
    res.status(500).json({ error: 'Failed to create customer' });
  }
});

// Create multiple customers (bulk import)
router.post('/bulk', authenticateToken, requirePermission('user.create'), (req, res) => {
  try {
    const { customers } = req.body;
    
    customers.forEach((customer, index) => {
      const newCustomer = {
        customer_id: database.customers.length + index + 1,
        customer_code: `CUS${String(database.customers.length + index + 1).padStart(3, '0')}`,
        customer_name: customer.customer_name,
        contact_person: customer.contact_person || '',
        email: customer.email || '',
        phone: customer.phone || '',
        address: customer.address,
        gst_number: customer.gst_number,
        credit_limit: customer.credit_limit || 0,
        payment_terms: customer.payment_terms || 'Net 30',
        is_active: true,
        created_date: new Date().toISOString()
      };
      database.customers.push(newCustomer);
    });
    
    res.status(201).json({ message: `${customers.length} customers created successfully` });
  } catch (error) {
    console.error('Error creating bulk customers:', error);
    res.status(500).json({ error: 'Failed to create customers' });
  }
});

// Update customer
router.put('/:id', authenticateToken, requirePermission('user.update'), (req, res) => {
  try {
    const customerIndex = database.customers.findIndex(c => c.customer_id === parseInt(req.params.id));
    if (customerIndex === -1) {
      return res.status(404).json({ error: 'Customer not found' });
    }
    
    database.customers[customerIndex] = { ...database.customers[customerIndex], ...req.body };
    res.json({ message: 'Customer updated successfully' });
  } catch (error) {
    console.error('Error updating customer:', error);
    res.status(500).json({ error: 'Failed to update customer' });
  }
});

// Search customers
router.get('/search/:term', authenticateToken, (req, res) => {
  try {
    const searchTerm = req.params.term.toLowerCase();
    const customers = database.customers.filter(customer =>
      customer.customer_name.toLowerCase().includes(searchTerm) ||
      customer.customer_code.toLowerCase().includes(searchTerm) ||
      customer.contact_person.toLowerCase().includes(searchTerm)
    );
    res.json(customers);
  } catch (error) {
    console.error('Error searching customers:', error);
    res.status(500).json({ error: 'Failed to search customers' });
  }
});

// Delete customer (soft delete)
router.delete('/:id', authenticateToken, requirePermission('user.delete'), (req, res) => {
  try {
    const customerIndex = database.customers.findIndex(c => c.customer_id === parseInt(req.params.id));
    if (customerIndex !== -1) {
      database.customers[customerIndex].is_active = false;
    }
    res.json({ message: 'Customer deleted successfully' });
  } catch (error) {
    console.error('Error deleting customer:', error);
    res.status(500).json({ error: 'Failed to delete customer' });
  }
});

export { router as customerRoutes };