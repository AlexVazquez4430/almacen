<?php
// test-ticket-creation.php - Test ticket creation functionality
require_once 'config/database.php';

header('Content-Type: application/json');

try {
    $database = new Database();
    $db = $database->getConnection();
    
    echo json_encode([
        'status' => 'success',
        'message' => 'Database connection successful',
        'tests' => [
            'database_connection' => 'OK',
            'tickets_table_exists' => checkTableExists($db, 'tickets'),
            'ticket_date_column_exists' => checkColumnExists($db, 'tickets', 'ticket_date'),
            'planes_available' => countRecords($db, 'planes'),
            'pilots_available' => countRecords($db, 'pilots'),
            'products_available' => countRecords($db, 'products')
        ]
    ]);
    
} catch (Exception $e) {
    echo json_encode([
        'status' => 'error',
        'message' => $e->getMessage()
    ]);
}

function checkTableExists($db, $tableName) {
    try {
        $result = $db->query("SELECT name FROM sqlite_master WHERE type='table' AND name='$tableName'");
        return $result->fetch() ? 'EXISTS' : 'MISSING';
    } catch (Exception $e) {
        return 'ERROR: ' . $e->getMessage();
    }
}

function checkColumnExists($db, $tableName, $columnName) {
    try {
        $result = $db->query("PRAGMA table_info($tableName)");
        $columns = $result->fetchAll(PDO::FETCH_ASSOC);
        
        foreach ($columns as $column) {
            if ($column['name'] === $columnName) {
                return 'EXISTS';
            }
        }
        return 'MISSING';
    } catch (Exception $e) {
        return 'ERROR: ' . $e->getMessage();
    }
}

function countRecords($db, $tableName) {
    try {
        $result = $db->query("SELECT COUNT(*) as count FROM $tableName");
        $count = $result->fetch()['count'];
        return "$count records";
    } catch (Exception $e) {
        return 'ERROR: ' . $e->getMessage();
    }
}
?>