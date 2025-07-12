-- Database Schema for Warehouse Management System (SQLite)
-- This file is for reference - the database.php file will automatically create these tables

-- Create pilots table (simplified - only name field)
CREATE TABLE IF NOT EXISTS pilots (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name VARCHAR(255) NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Update products table to include price
-- ALTER TABLE products ADD COLUMN price DECIMAL(10,2) DEFAULT 0.00;

-- Update tickets table to include pilot_id
-- ALTER TABLE tickets ADD COLUMN pilot_id INTEGER;

-- Sample data for pilots (will be automatically inserted by database.php)
-- INSERT INTO pilots (name) VALUES
-- ('Juan Pérez'),
-- ('María García'),
-- ('Carlos López'),
-- ('Ana Rodríguez'),
-- ('Luis Martínez');

-- Note: The database.php file will automatically handle table creation and modifications
-- You don't need to run these commands manually as they are handled by the application