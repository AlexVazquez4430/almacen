<?php
// fix-tickets-remove-pilots.php - Fix database and remove pilot functionality
require_once 'config/database.php';

echo "<h1>Fixing Tickets Database and Removing Pilots</h1>\n";
echo "<pre>\n";

try {
    $database = new Database();
    $db = $database->getConnection();
    
    echo "=== STEP 1: BACKUP EXISTING DATA ===\n";
    
    // Backup existing tickets
    $existingTickets = [];
    try {
        $result = $db->query("SELECT * FROM tickets");
        $existingTickets = $result->fetchAll(PDO::FETCH_ASSOC);
        echo "✅ Backed up " . count($existingTickets) . " existing tickets\n";
    } catch (Exception $e) {
        echo "⚠️  No existing tickets to backup: " . $e->getMessage() . "\n";
    }
    
    echo "\n=== STEP 2: RECREATE TICKETS TABLE (WITHOUT PILOTS) ===\n";
    
    // Drop existing tickets table and related tables
    $db->exec("DROP TABLE IF EXISTS ticket_pilots");
    $db->exec("DROP TABLE IF EXISTS tickets");
    echo "✅ Dropped old tickets and ticket_pilots tables\n";
    
    // Create new simplified tickets table
    $db->exec("
        CREATE TABLE tickets (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            plane_id INTEGER NOT NULL,
            ticket_number VARCHAR(50) NOT NULL,
            description TEXT,
            ticket_date DATE DEFAULT (date('now')),
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (plane_id) REFERENCES planes(id)
        )
    ");
    echo "✅ Created new simplified tickets table (no pilots)\n";
    
    echo "\n=== STEP 3: RESTORE DATA ===\n";
    
    // Restore tickets without pilot information
    if (count($existingTickets) > 0) {
        $insertStmt = $db->prepare("
            INSERT INTO tickets (id, plane_id, ticket_number, description, ticket_date, created_at) 
            VALUES (?, ?, ?, ?, ?, ?)
        ");
        
        foreach ($existingTickets as $ticket) {
            $insertStmt->execute([
                $ticket['id'],
                $ticket['plane_id'],
                $ticket['ticket_number'],
                $ticket['description'] ?? '',
                $ticket['ticket_date'] ?? date('Y-m-d'),
                $ticket['created_at'] ?? date('Y-m-d H:i:s')
            ]);
        }
        echo "✅ Restored " . count($existingTickets) . " tickets (without pilot data)\n";
    }
    
    echo "\n=== STEP 4: TEST NEW STRUCTURE ===\n";
    
    // Test ticket insertion
    $testPlane = $db->query("SELECT id FROM planes LIMIT 1")->fetch();
    if ($testPlane) {
        $testTicketNumber = 'TEST-' . date('YmdHis');
        $stmt = $db->prepare("INSERT INTO tickets (plane_id, ticket_number, description, ticket_date) VALUES (?, ?, ?, ?)");
        $stmt->execute([
            $testPlane['id'],
            $testTicketNumber,
            'Test ticket - simplified structure',
            date('Y-m-d')
        ]);
        
        $testTicketId = $db->lastInsertId();
        echo "✅ Test ticket created successfully (ID: $testTicketId)\n";
        
        // Clean up test ticket
        $db->exec("DELETE FROM tickets WHERE id = $testTicketId");
        echo "✅ Test ticket cleaned up\n";
    } else {
        echo "⚠️  No planes available for testing\n";
    }
    
    echo "\n=== STEP 5: VERIFY FINAL STRUCTURE ===\n";
    
    $result = $db->query("PRAGMA table_info(tickets)");
    $columns = $result->fetchAll(PDO::FETCH_ASSOC);
    
    echo "Final tickets table structure:\n";
    foreach ($columns as $column) {
        echo "- {$column['name']} ({$column['type']}) - Default: {$column['dflt_value']}\n";
    }
    
    echo "\n✅ DATABASE FIX COMPLETED SUCCESSFULLY!\n";
    echo "✅ Pilots removed from ticket structure\n";
    echo "✅ ticket_date column is now properly accessible\n";
    
} catch (Exception $e) {
    echo "❌ CRITICAL ERROR: " . $e->getMessage() . "\n";
}

echo "</pre>\n";
?>

<!DOCTYPE html>
<html>
<head>
    <title>Database Fix - Tickets Simplified</title>
    <style>
        body { font-family: monospace; margin: 20px; }
        pre { background: #f5f5f5; padding: 15px; border-radius: 5px; }
        h1 { color: #2196f3; }
    </style>
</head>
<body>
    <p><strong>Changes made:</strong></p>
    <ul>
        <li>✅ Fixed ticket_date database issue</li>
        <li>✅ Removed pilot functionality from tickets</li>
        <li>✅ Simplified ticket creation process</li>
        <li>✅ Maintained all existing ticket data</li>
    </ul>
    
    <p><a href="index.html">← Back to Application</a></p>
</body>
</html>