<?php
// database-fix-comprehensive.php - Comprehensive database fix for ticket issues
require_once 'config/database.php';

echo "<h1>Database Comprehensive Fix</h1>\n";
echo "<pre>\n";

try {
    $database = new Database();
    $db = $database->getConnection();
    
    echo "=== CHECKING DATABASE STRUCTURE ===\n";
    
    // Check current tickets table structure
    echo "Current tickets table structure:\n";
    $result = $db->query("PRAGMA table_info(tickets)");
    $columns = $result->fetchAll(PDO::FETCH_ASSOC);
    
    $hasTicketDate = false;
    foreach ($columns as $column) {
        echo "- {$column['name']} ({$column['type']}) - Default: {$column['dflt_value']}\n";
        if ($column['name'] === 'ticket_date') {
            $hasTicketDate = true;
        }
    }
    
    echo "\n=== FIXING TICKET_DATE COLUMN ===\n";
    
    if (!$hasTicketDate) {
        echo "❌ ticket_date column missing. Adding it...\n";
        $db->exec("ALTER TABLE tickets ADD COLUMN ticket_date DATE DEFAULT (date('now'))");
        echo "✅ ticket_date column added!\n";
    } else {
        echo "✅ ticket_date column exists.\n";
    }
    
    // Test inserting a ticket to verify the structure works
    echo "\n=== TESTING TICKET INSERTION ===\n";
    
    try {
        // First, ensure we have a plane to reference
        $planeCheck = $db->query("SELECT COUNT(*) as count FROM planes")->fetch();
        if ($planeCheck['count'] == 0) {
            echo "Creating test plane...\n";
            $db->exec("INSERT INTO planes (name, description) VALUES ('Test Plane', 'Test plane for database verification')");
        }
        
        $planeId = $db->query("SELECT id FROM planes LIMIT 1")->fetch()['id'];
        
        // Test ticket insertion
        $testTicketNumber = 'TEST-' . date('YmdHis');
        $stmt = $db->prepare("INSERT INTO tickets (plane_id, ticket_number, description, ticket_date) VALUES (?, ?, ?, ?)");
        $stmt->execute([
            $planeId,
            $testTicketNumber,
            'Test ticket for database verification',
            date('Y-m-d')
        ]);
        
        $testTicketId = $db->lastInsertId();
        echo "✅ Test ticket created successfully (ID: $testTicketId)\n";
        
        // Clean up test ticket
        $db->exec("DELETE FROM tickets WHERE id = $testTicketId");
        echo "✅ Test ticket cleaned up\n";
        
    } catch (Exception $e) {
        echo "❌ Ticket insertion test failed: " . $e->getMessage() . "\n";
        
        // Try to recreate the tickets table with proper structure
        echo "\n=== RECREATING TICKETS TABLE ===\n";
        
        // Backup existing tickets
        $existingTickets = $db->query("SELECT * FROM tickets")->fetchAll(PDO::FETCH_ASSOC);
        echo "Backing up " . count($existingTickets) . " existing tickets...\n";
        
        // Drop and recreate table
        $db->exec("DROP TABLE IF EXISTS tickets_backup");
        $db->exec("CREATE TABLE tickets_backup AS SELECT * FROM tickets");
        $db->exec("DROP TABLE tickets");
        
        $db->exec("
            CREATE TABLE tickets (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                plane_id INTEGER NOT NULL,
                pilot_id INTEGER,
                ticket_number VARCHAR(50) NOT NULL,
                description TEXT,
                ticket_date DATE DEFAULT (date('now')),
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (plane_id) REFERENCES planes(id),
                FOREIGN KEY (pilot_id) REFERENCES pilots(id)
            )
        ");
        
        echo "✅ Tickets table recreated with proper structure\n";
        
        // Restore data
        if (count($existingTickets) > 0) {
            echo "Restoring existing tickets...\n";
            $insertStmt = $db->prepare("
                INSERT INTO tickets (id, plane_id, pilot_id, ticket_number, description, ticket_date, created_at) 
                VALUES (?, ?, ?, ?, ?, ?, ?)
            ");
            
            foreach ($existingTickets as $ticket) {
                $insertStmt->execute([
                    $ticket['id'],
                    $ticket['plane_id'],
                    $ticket['pilot_id'] ?? null,
                    $ticket['ticket_number'],
                    $ticket['description'] ?? '',
                    $ticket['ticket_date'] ?? date('Y-m-d'),
                    $ticket['created_at'] ?? date('Y-m-d H:i:s')
                ]);
            }
            echo "✅ Restored " . count($existingTickets) . " tickets\n";
        }
        
        // Test again
        $stmt = $db->prepare("INSERT INTO tickets (plane_id, ticket_number, description, ticket_date) VALUES (?, ?, ?, ?)");
        $stmt->execute([
            $planeId,
            $testTicketNumber,
            'Test ticket after recreation',
            date('Y-m-d')
        ]);
        
        $testTicketId = $db->lastInsertId();
        echo "✅ Test ticket created successfully after recreation (ID: $testTicketId)\n";
        
        // Clean up
        $db->exec("DELETE FROM tickets WHERE id = $testTicketId");
        $db->exec("DROP TABLE tickets_backup");
    }
    
    echo "\n=== FINAL VERIFICATION ===\n";
    
    // Final structure check
    $result = $db->query("PRAGMA table_info(tickets)");
    $columns = $result->fetchAll(PDO::FETCH_ASSOC);
    
    echo "Final tickets table structure:\n";
    foreach ($columns as $column) {
        echo "- {$column['name']} ({$column['type']}) - Default: {$column['dflt_value']}\n";
    }
    
    echo "\n✅ DATABASE FIX COMPLETED SUCCESSFULLY!\n";
    echo "\nYou can now create tickets without the 'ticket_date' error.\n";
    
} catch (Exception $e) {
    echo "❌ CRITICAL ERROR: " . $e->getMessage() . "\n";
    echo "Please contact the system administrator.\n";
}

echo "</pre>\n";
?>

<!DOCTYPE html>
<html>
<head>
    <title>Database Fix Complete</title>
    <style>
        body { font-family: monospace; margin: 20px; }
        pre { background: #f5f5f5; padding: 15px; border-radius: 5px; }
        h1 { color: #2196f3; }
    </style>
</head>
<body>
    <p><strong>Next steps:</strong></p>
    <ol>
        <li>Clear your browser cache (use the "🔄 Limpiar Cache" button)</li>
        <li>Try creating a ticket again</li>
        <li>Products should now appear immediately when added (no logout required)</li>
    </ol>
    
    <p><a href="index.html">← Back to Application</a></p>
</body>
</html>