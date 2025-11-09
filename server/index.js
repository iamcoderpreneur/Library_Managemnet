import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import pool from './db.js';   // ✅ MySQL connection
import { authRoutes } from './routes/auth.js';
import { userRoutes } from './routes/users.js';
import { testRoutes } from './routes/testing.js';
import { itemRoutes } from './routes/items.js';
import { customerRoutes } from './routes/customers.js';
import { quoteRoutes } from './routes/quotes.js';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3002;

const startServer = async () => {
  console.log('🚀 Starting Supply Chain Management Server...');

  // ✅ Test MySQL connection before starting
  try {
    const conn = await pool.getConnection();
    console.log('✅ MySQL Database connected successfully');
    conn.release();
  } catch (err) {
    console.error('❌ Database connection failed:', err.message);
    process.exit(1);
  }

  // Middleware
  app.use(cors());
  app.use(express.json());

  // Routes
  app.use('/api/auth', authRoutes);
  app.use('/api/users', userRoutes);
  app.use('/api/testing', testRoutes);
  app.use('/api/items', itemRoutes);
  app.use('/api/customers', customerRoutes);
  app.use('/api/quotes', quoteRoutes);

  // Health check
  app.get('/api/health', async (req, res) => {
    try {
      await pool.query('SELECT 1'); // ✅ Simple DB check
      res.json({
        status: 'OK',
        message: 'Supply Chain Management API is running',
        timestamp: new Date().toISOString(),
        database: 'MySQL Connected',
        environment: process.env.NODE_ENV || 'development'
      });
    } catch (err) {
      res.status(500).json({
        status: 'ERROR',
        message: 'Database connection failed',
        error: err.message
      });
    }
  });

  // Root endpoint
  app.get('/', (req, res) => {
    res.json({
      message: 'Supply Chain Management API',
      version: '1.0.0',
      endpoints: [
        '/api/auth',
        '/api/users',
        '/api/testing',
        '/api/items',
        '/api/customers',
        '/api/quotes',
        '/api/health'
      ],
      database: 'MySQL'
    });
  });

  // Start server
  app.listen(PORT, () => {
    console.log(`✅ Server running on port ${PORT}`);
    console.log(`🔍 Health check: http://localhost:${PORT}/api/health`);
    console.log(`📦 Database: MySQL`);
    console.log('⚡ Server is ready to accept requests');
  });
};

// Start the server
startServer();

export default app;
