-- Database Schema for Warehouse Management System (SQLite)
-- This file is for reference - the database.php file will automatically create these tables

-- Create users table for authentication
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username VARCHAR(100) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Create pilots table (simplified - only name field)
CREATE TABLE IF NOT EXISTS pilots (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name VARCHAR(255) NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Create doctors table
CREATE TABLE IF NOT EXISTS doctors (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name VARCHAR(255) NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Create ticket_pilots junction table (many-to-many relationship)
-- Ya no usamos esta tabla no existe

-- Create ticket_doctors junction table (many-to-many relationship)
CREATE TABLE IF NOT EXISTS ticket_doctors (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    ticket_id INTEGER NOT NULL,
    doctor_id INTEGER NOT NULL,
    FOREIGN KEY (ticket_id) REFERENCES tickets(id),
    FOREIGN KEY (doctor_id) REFERENCES doctors(id),
    UNIQUE(ticket_id, doctor_id)
);

-- Update products table to include price
-- ALTER TABLE products ADD COLUMN price DECIMAL(10,2) DEFAULT 0.00;

-- Add ticket_date column to tickets table
-- ALTER TABLE tickets ADD COLUMN ticket_date DATE DEFAULT (date('now'));

-- Remove pilot_id column from tickets table (now using junction table)
-- The pilot_id column in tickets table is deprecated in favor of the many-to-many relationship

-- Default administrator user (automatically created by database.php)
-- Username: administrador
-- Password: IngresoControl$Almacen?

-- Sample data for pilots (will be automatically inserted by database.php)
-- INSERT INTO pilots (name) VALUES
-- ('Juan Pérez'),
-- ('María García'),
-- ('Carlos López'),
-- ('Ana Rodríguez'),
-- ('Luis Martínez');

-- Sample data for doctors (will be automatically inserted by database.php)
-- INSERT INTO doctors (name) VALUES
-- ('Dr. Roberto Sánchez'),
-- ('Dra. Carmen Morales'),
-- ('Dr. Fernando Jiménez'),
-- ('Dra. Patricia Vega'),
-- ('Dr. Miguel Torres');

-- Note: The database.php file will automatically handle table creation and modifications
-- You don't need to run these commands manually as they are handled by the application