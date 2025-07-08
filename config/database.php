<?php
// config/database.php
class Database {
    private $db;
    
    public function __construct() {
        try {
            $this->db = new PDO('sqlite:warehouse.db');
            $this->db->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
            $this->initDatabase();
        } catch(PDOException $e) {
            die("Connection failed: " . $e->getMessage());
        }
    }
    
    private function initDatabase() {
        try {
            // Create tables one by one to avoid parsing issues
            
            // Main warehouse products
            $this->db->exec("
                CREATE TABLE IF NOT EXISTS products (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    name VARCHAR(100) NOT NULL,
                    description TEXT,
                    total_stock INTEGER DEFAULT 0,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
                )
            ");

            // Planes
            $this->db->exec("
                CREATE TABLE IF NOT EXISTS planes (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    name VARCHAR(100) NOT NULL,
                    description TEXT,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
                )
            ");

            // Product minimum requirements per plane
            $this->db->exec("
                CREATE TABLE IF NOT EXISTS plane_product_minimums (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    plane_id INTEGER NOT NULL,
                    product_id INTEGER NOT NULL,
                    minimum_quantity INTEGER NOT NULL,
                    FOREIGN KEY (plane_id) REFERENCES planes(id),
                    FOREIGN KEY (product_id) REFERENCES products(id),
                    UNIQUE(plane_id, product_id)
                )
            ");

            // Current stock in each plane
            $this->db->exec("
                CREATE TABLE IF NOT EXISTS plane_stocks (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    plane_id INTEGER NOT NULL,
                    product_id INTEGER NOT NULL,
                    current_stock INTEGER DEFAULT 0,
                    FOREIGN KEY (plane_id) REFERENCES planes(id),
                    FOREIGN KEY (product_id) REFERENCES products(id),
                    UNIQUE(plane_id, product_id)
                )
            ");

            // Tickets
            $this->db->exec("
                CREATE TABLE IF NOT EXISTS tickets (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    plane_id INTEGER NOT NULL,
                    ticket_number VARCHAR(50) NOT NULL,
                    description TEXT,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (plane_id) REFERENCES planes(id)
                )
            ");

            // Ticket items (products used in each ticket)
            $this->db->exec("
                CREATE TABLE IF NOT EXISTS ticket_items (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    ticket_id INTEGER NOT NULL,
                    product_id INTEGER NOT NULL,
                    quantity_used INTEGER NOT NULL,
                    FOREIGN KEY (ticket_id) REFERENCES tickets(id),
                    FOREIGN KEY (product_id) REFERENCES products(id)
                )
            ");
            
        } catch(PDOException $e) {
            die("Database initialization failed: " . $e->getMessage());
        }
    }
    
    public function getConnection() {
        return $this->db;
    }
}
?>