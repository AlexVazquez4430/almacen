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
        $schema = file_get_contents('database/schema.sql');
        $this->db->exec($schema);
    }
    
    public function getConnection() {
        return $this->db;
    }
}
?>