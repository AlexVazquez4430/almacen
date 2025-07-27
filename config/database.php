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
                    price DECIMAL(10,2) DEFAULT 0.00,
                    total_stock INTEGER DEFAULT 0,
                    minimun_stock INTEGER DEFAULT 0,
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

            // Pilots table
            // No more pilots, so we skip this table

            // Users table for authentication
            $this->db->exec("
                CREATE TABLE IF NOT EXISTS users (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    username VARCHAR(100) NOT NULL UNIQUE,
                    password VARCHAR(255) NOT NULL,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
                )
            ");

            // Doctors table
            $this->db->exec("
                CREATE TABLE IF NOT EXISTS doctors (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    name VARCHAR(255) NOT NULL,
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
                    minimum_quantity INTEGER DEFAULT 0,
                    FOREIGN KEY (plane_id) REFERENCES planes(id),
                    FOREIGN KEY (product_id) REFERENCES products(id),
                    UNIQUE(plane_id, product_id)
                )
            ");

            // Tickets with pilot assignment
            $this->db->exec("
                CREATE TABLE IF NOT EXISTS tickets (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    plane_id INTEGER NOT NULL,
                    ticket_number VARCHAR(50) NOT NULL,
                    description TEXT,
                    ticket_date DATE DEFAULT (date('now')),
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (plane_id) REFERENCES planes(id)
                )
            ");

            // Add ticket_date column to existing tickets table if it doesn't exist
            try {
                $this->db->exec("ALTER TABLE tickets ADD COLUMN ticket_date DATE DEFAULT (date('now'))");
            } catch(PDOException $e) {
                // Column already exists, ignore error
            }

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

            // Ticket pilots junction table (many-to-many)

            // Ticket doctors junction table (many-to-many)
            $this->db->exec("
                CREATE TABLE IF NOT EXISTS ticket_doctors (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    ticket_id INTEGER NOT NULL,
                    doctor_id INTEGER NOT NULL,
                    FOREIGN KEY (ticket_id) REFERENCES tickets(id),
                    FOREIGN KEY (doctor_id) REFERENCES doctors(id),
                    UNIQUE(ticket_id, doctor_id)
                )
            ");

            // Add price column to existing products table if it doesn't exist
            try {
                $this->db->exec("ALTER TABLE products ADD COLUMN price DECIMAL(10,2) DEFAULT 0.00");
            } catch(PDOException $e) {
                // Column might already exist, ignore error
            }

            // Add pilot_id column to existing tickets table if it doesn't exist
            // No more used pilot_id

            // Add minimum_quantity column to plane_stocks if it doesn't exist
            try {
                $this->db->exec("ALTER TABLE plane_stocks ADD COLUMN minimum_quantity INTEGER DEFAULT 0");
            } catch(PDOException $e) {
                // Column might already exist, ignore error
            }

            // Insert sample pilots if table is empty
            // No more pilots, so we skip this

            // Insert sample doctors if table is empty
            $stmt = $this->db->query("SELECT COUNT(*) FROM doctors");
            $doctorCount = $stmt->fetchColumn();

            if ($doctorCount == 0) {
                $this->db->exec("
                    INSERT INTO doctors (name) VALUES
                    ('Dr. Roberto Sánchez'),
                    ('Dra. Carmen Morales'),
                    ('Dr. Fernando Jiménez'),
                    ('Dra. Patricia Vega'),
                    ('Dr. Miguel Torres')
                ");
            }

            // Insert default administrator user if table is empty
            $stmt = $this->db->query("SELECT COUNT(*) FROM users");
            $userCount = $stmt->fetchColumn();

            if ($userCount == 0) {
                $hashedPassword = password_hash('IngresoControl$Almacen?', PASSWORD_DEFAULT);
                $stmt = $this->db->prepare("INSERT INTO users (username, password) VALUES (?, ?)");
                $stmt->execute(['administrador', $hashedPassword]);
            }

        } catch(PDOException $e) {
            die("Database initialization failed: " . $e->getMessage());
        }
    }
    
    public function getConnection() {
        return $this->db;
    }
}
?>