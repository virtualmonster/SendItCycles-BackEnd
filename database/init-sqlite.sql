-- SendIt Cycles SQLite Database Schema (Demo variant)
-- Lightweight version for fast demo deployments

-- Categories
CREATE TABLE IF NOT EXISTS categories (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name VARCHAR(50) UNIQUE NOT NULL,
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Products (Bikes)
CREATE TABLE IF NOT EXISTS products (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  category_id INTEGER NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  price REAL NOT NULL,
  stock_quantity INTEGER NOT NULL DEFAULT 0,
  image_url VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE
);

-- Users
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  role VARCHAR(20) DEFAULT 'user',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Orders
CREATE TABLE IF NOT EXISTS orders (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  total_price REAL NOT NULL,
  status VARCHAR(50) DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Order Items
CREATE TABLE IF NOT EXISTS order_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  order_id INTEGER NOT NULL,
  product_id INTEGER NOT NULL,
  quantity INTEGER NOT NULL,
  price_at_purchase REAL NOT NULL,
  frame_size VARCHAR(2) DEFAULT 'M',
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(id)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_products_category_id ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- Insert default categories
INSERT OR IGNORE INTO categories (id, name, description) VALUES
  (1, 'XC', 'Cross-Country bikes for speed and efficiency'),
  (2, 'Trail', 'Versatile all-purpose trail bikes'),
  (3, 'Downcountry', 'Lightweight descending machines'),
  (4, 'Enduro', 'Long-travel aggressive trail bikes'),
  (5, 'Downhill', 'Gravity-focused extreme downhill bikes');

-- Insert sample products
INSERT OR IGNORE INTO products (id, category_id, name, description, price, stock_quantity, image_url) VALUES
  (1, 1, 'Swift XC Pro', 'Lightweight cross-country racer built for speed', 1499.99, 15, '/images/1-xc.svg'),
  (2, 2, 'TrailBlazer Elite', 'Versatile trail bike for all terrain mayhem', 2199.99, 20, '/images/2-trail.svg'),
  (3, 3, 'Alpine Descent', 'Lightweight with big descending capability', 2799.99, 10, '/images/3-downcountry.svg'),
  (4, 4, 'Beast Mode 29', 'Long travel aggressive enduro machine for tech', 3499.99, 12, '/images/4-enduro.svg'),
  (5, 5, 'Gravity King DH', 'Full suspension gravity focused monster truck', 4299.99, 8, '/images/5-downhill.svg'),
  (6, 1, 'Cross Lite', 'Budget-friendly cross-country option', 899.99, 25, '/images/6-xc-alt.svg'),
  (7, 2, 'Trailmaster 27.5', 'Perfect 27.5" trail ripper for flow', 1899.99, 18, '/images/7-trail-alt.svg'),
  (8, 4, 'Enduro Plus', 'Feature-packed enduro workhorse', 3099.99, 14, '/images/8-enduro-alt.svg');

-- Create admin user (password: admin123)
INSERT OR IGNORE INTO users (id, email, password_hash, first_name, last_name, role) VALUES
  (1, 'admin@senditcycles.com', '$2a$10$PCcHVwS.8SPme67BvM9r7uztWnq/HSSM.QLPAuGGpG7nitIUwDveu', 'Admin', 'User', 'admin');
