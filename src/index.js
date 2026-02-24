import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import swaggerUI from 'swagger-ui-express';
import { specs } from './swagger.js';
import { authMiddleware, adminMiddleware } from './middleware/auth.js';
import * as productRoutes from './routes/products.js';
import * as authRoutes from './routes/auth.js';
import * as orderRoutes from './routes/orders.js';
import * as adminRoutes from './routes/admin.js';
import { initializeDatabase, query } from './models/db.js';
import { runMigrations } from './models/migrations.js';

dotenv.config();

const app = express();

// Initialize database
await initializeDatabase();

// Initialize SQLite data if using SQLite (after db is initialized)
if (process.env.USE_SQLITE === 'true') {
  // Check if categories table has data
  try {
    const result = await query('SELECT COUNT(*) as count FROM categories');
    const categoryCount = result.rows?.[0]?.count || 0;
    console.log(`Categories: ${categoryCount}`);
    
    const prodResult = await query('SELECT COUNT(*) as count FROM products');
    const productCount = prodResult.rows?.[0]?.count || 0;
    console.log(`Products: ${productCount}`);
    
    if (categoryCount === 0) {
      // Need to populate data - but this shouldn't happen since schema creation does this
      console.log('Populating SQLite database with initial data...');
      const initScript = fs.readFileSync('./database/init.sql', 'utf-8');
      const statements = initScript.split(';').filter(s => s.trim() && s.includes('INSERT'));
      
      console.log(`Found ${statements.length} INSERT statements to execute`);
      for (const stmt of statements) {
        try {
          console.log('Executing INSERT...');
          await query(stmt);
          console.log('INSERT executed');
        } catch (e) {
          console.warn(`Warning populating data: ${e.message}`);
        }
      }
      console.log('✓ SQLite database populated with data');
    } else {
      console.log(`✓ SQLite database ready (${categoryCount} categories, ${productCount} products)`);
    }
  } catch (err) {
    console.error('Error checking/populating data:', err);
  }
}

// Run migrations after schema initialization
await runMigrations();

// Middleware
app.use(cors());
app.use(express.json());

// Serve static image files from public/images directory
app.use('/api/images', express.static(path.join(path.resolve(), 'public', 'images')));

// Request logging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} ${req.method} ${req.path}`);
  next();
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString(), database: process.env.USE_SQLITE === 'true' ? 'SQLite (Demo)' : 'PostgreSQL (Production)' });
});

// Swagger UI
app.use('/api-docs', swaggerUI.serve);
app.get('/api-docs', swaggerUI.setup(specs, { swaggerOptions: { persistAuthorizationToken: true } }));

// Public Auth Routes
app.post('/api/auth/register', authRoutes.register);
app.post('/api/auth/login', authRoutes.login);

// Protected Auth Routes
app.get('/api/auth/profile', authMiddleware, authRoutes.getProfile);

// Public Product Routes
app.get('/api/categories', productRoutes.getCategories);
app.get('/api/products', productRoutes.getAllProducts);
app.get('/api/products/:id', productRoutes.getProductById);
app.get('/api/categories/:categoryId/products', productRoutes.getProductsByCategory);

// Protected Order Routes
app.post('/api/orders', authMiddleware, orderRoutes.createOrder);
app.get('/api/orders', authMiddleware, orderRoutes.getUserOrders);
app.get('/api/orders/:id', authMiddleware, orderRoutes.getOrderById);

// Admin Routes
app.get('/api/admin/categories', authMiddleware, adminMiddleware, adminRoutes.getCategories);
app.post('/api/admin/categories', authMiddleware, adminMiddleware, adminRoutes.createCategory);
app.post('/api/admin/categories/bulk', authMiddleware, adminMiddleware, adminRoutes.bulkCreateCategories);
app.put('/api/admin/categories/:id', authMiddleware, adminMiddleware, adminRoutes.updateCategory);
app.put('/api/admin/categories/bulk', authMiddleware, adminMiddleware, adminRoutes.bulkUpdateCategories);
app.delete('/api/admin/categories/:id', authMiddleware, adminMiddleware, adminRoutes.deleteCategory);

app.post('/api/admin/products', authMiddleware, adminMiddleware, productRoutes.createProduct);
app.post('/api/admin/products/bulk', authMiddleware, adminMiddleware, productRoutes.bulkCreateProducts);
app.put('/api/admin/products/:id', authMiddleware, adminMiddleware, productRoutes.updateProduct);
app.put('/api/admin/products/bulk', authMiddleware, adminMiddleware, productRoutes.bulkUpdateProducts);
app.delete('/api/admin/products/:id', authMiddleware, adminMiddleware, productRoutes.deleteProduct);

app.get('/api/admin/orders', authMiddleware, adminMiddleware, orderRoutes.getAllOrders);
app.put('/api/admin/orders/:id/status', authMiddleware, adminMiddleware, orderRoutes.updateOrderStatus);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  const dbType = process.env.USE_SQLITE === 'true' ? 'SQLite (Demo Mode)' : 'PostgreSQL (Production Mode)';
  console.log(`SendIt Cycles API running on port ${PORT} - ${dbType}`);
});

