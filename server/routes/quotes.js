import express from 'express';
import { authenticateToken, requirePermission } from '../middleware/auth.js';
import { Quote } from '../models/Quote.js';

const router = express.Router();

// Get all quotes
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { limit = 20, includeConverted = false } = req.query;
    const quotes = await Quote.findAll(parseInt(limit), !includeConverted);
    res.json(quotes);
  } catch (error) {
    console.error('Error fetching quotes:', error);
    res.status(500).json({ error: 'Failed to fetch quotes' });
  }
});

// Get quote by ID with items
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const quote = await Quote.findById(req.params.id);
    if (!quote) {
      return res.status(404).json({ error: 'Quote not found' });
    }
    
    const items = await Quote.getQuoteItems(req.params.id);
    res.json({ ...quote, items });
  } catch (error) {
    console.error('Error fetching quote:', error);
    res.status(500).json({ error: 'Failed to fetch quote' });
  }
});

// Create new quote
router.post('/', authenticateToken, requirePermission('orders.create'), async (req, res) => {
  try {
    const { quoteData, items } = req.body;
    const quote = await Quote.create(quoteData, items, req.user.userId);
    res.status(201).json(quote);
  } catch (error) {
    console.error('Error creating quote:', error);
    res.status(500).json({ error: 'Failed to create quote' });
  }
});

// Update quote status
router.patch('/:id/status', authenticateToken, requirePermission('orders.update'), async (req, res) => {
  try {
    const { status } = req.body;
    await Quote.updateStatus(req.params.id, status);
    res.json({ message: 'Quote status updated successfully' });
  } catch (error) {
    console.error('Error updating quote status:', error);
    res.status(500).json({ error: 'Failed to update quote status' });
  }
});

// Convert quote to order
router.post('/:id/convert', authenticateToken, requirePermission('orders.manage'), async (req, res) => {
  try {
    await Quote.convertToOrder(req.params.id);
    res.json({ message: 'Quote converted to order successfully' });
  } catch (error) {
    console.error('Error converting quote:', error);
    res.status(500).json({ error: 'Failed to convert quote' });
  }
});

// Get quote statistics
router.get('/stats/summary', authenticateToken, async (req, res) => {
  try {
    const stats = await Quote.getStatistics();
    res.json(stats);
  } catch (error) {
    console.error('Error fetching quote statistics:', error);
    res.status(500).json({ error: 'Failed to fetch statistics' });
  }
});

// Search quotes
router.get('/search/:term', authenticateToken, async (req, res) => {
  try {
    const quotes = await Quote.search(req.params.term);
    res.json(quotes);
  } catch (error) {
    console.error('Error searching quotes:', error);
    res.status(500).json({ error: 'Failed to search quotes' });
  }
});

// Delete quote (soft delete)
router.delete('/:id', authenticateToken, requirePermission('orders.delete'), async (req, res) => {
  try {
    await Quote.deactivate(req.params.id);
    res.json({ message: 'Quote deleted successfully' });
  } catch (error) {
    console.error('Error deleting quote:', error);
    res.status(500).json({ error: 'Failed to delete quote' });
  }
});

export { router as quoteRoutes };