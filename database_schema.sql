-- Database Schema for Warehouse Management System
-- Run these SQL commands to create the required tables

-- Create pilots table
CREATE TABLE IF NOT EXISTS pilots (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    license_number VARCHAR(100) NOT NULL UNIQUE,
    email VARCHAR(255),
    phone VARCHAR(20),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Update products table to include price
ALTER TABLE products ADD COLUMN IF NOT EXISTS price DECIMAL(10,2) NOT NULL DEFAULT 0.00;

-- Update tickets table to include pilot_id
ALTER TABLE tickets ADD COLUMN IF NOT EXISTS pilot_id INT;
ALTER TABLE tickets ADD FOREIGN KEY (pilot_id) REFERENCES pilots(id) ON DELETE SET NULL;

-- Sample data for pilots
INSERT INTO pilots (name, license_number, email, phone) VALUES
('Juan Pérez', 'PIL001', 'juan.perez@airline.com', '+1234567890'),
('María García', 'PIL002', 'maria.garcia@airline.com', '+1234567891'),
('Carlos López', 'PIL003', 'carlos.lopez@airline.com', '+1234567892');

-- Update existing products with sample prices (if any exist)
UPDATE products SET price = 10.00 WHERE price = 0.00;