<?php
// database-migration.php - Run this to fix database issues
require_once 'config/database.php';

echo "Starting database migration...\n";

try {
    $database = new Database();
    $db = $database->getConnection();
    
    echo "Checking tickets table structure...\n";
    
    // Check if ticket_date column exists
    $result = $db->query("PRAGMA table_info(tickets)");
    $columns = $result->fetchAll(PDO::FETCH_ASSOC);
    
    $hasTicketDate = false;
    foreach ($columns as $column) {
        if ($column['name'] === 'ticket_date') {
            $hasTicketDate = true;
            break;
        }
    }
    
    if (!$hasTicketDate) {
        echo "Adding ticket_date column to tickets table...\n";
        $db->exec("ALTER TABLE tickets ADD COLUMN ticket_date DATE DEFAULT (date('now'))");
        echo "✅ ticket_date column added successfully!\n";
    } else {
        echo "✅ ticket_date column already exists.\n";
    }
    
    // Verify the column was added
    $result = $db->query("PRAGMA table_info(tickets)");
    $columns = $result->fetchAll(PDO::FETCH_ASSOC);
    
    echo "\nCurrent tickets table structure:\n";
    foreach ($columns as $column) {
        echo "- {$column['name']} ({$column['type']})\n";
    }
    
    echo "\n✅ Database migration completed successfully!\n";
    
} catch (Exception $e) {
    echo "❌ Error during migration: " . $e->getMessage() . "\n";
}
?>