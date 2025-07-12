<?php
// api/ticket-details.php
require_once '../config/database.php';
require_once '../config/auth_check.php';

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET');
header('Access-Control-Allow-Headers: Content-Type');

// Check authentication for all requests
checkAuthentication();

try {
    $database = new Database();
    $db = $database->getConnection();

    if (!isset($_GET['ticket_id'])) {
        echo json_encode(['error' => 'ticket_id parameter required']);
        exit;
    }
    
    $ticketId = $_GET['ticket_id'];
    
    try {
        // Get ticket details
        $stmt = $db->prepare("
            SELECT t.*, p.name as plane_name 
            FROM tickets t 
            LEFT JOIN planes p ON t.plane_id = p.id 
            WHERE t.id = ?
        ");
        $stmt->execute([$ticketId]);
        $ticket = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$ticket) {
            echo json_encode(['error' => 'Ticket not found']);
            exit;
        }
        
        // Get available products in this plane
        $stmt = $db->prepare("
            SELECT
                ps.product_id,
                ps.current_stock,
                p.name as product_name,
                p.price,
                ppm.minimum_quantity
            FROM plane_stocks ps
            LEFT JOIN products p ON ps.product_id = p.id
            LEFT JOIN plane_product_minimums ppm ON ps.plane_id = ppm.plane_id AND ps.product_id = ppm.product_id
            WHERE ps.plane_id = ? AND ps.current_stock > 0
            ORDER BY p.name
        ");
        $stmt->execute([$ticket['plane_id']]);
        $availableProducts = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        $result = [
            'ticket_number' => $ticket['ticket_number'],
            'plane_name' => $ticket['plane_name'],
            'description' => $ticket['description'],
            'created_at' => $ticket['created_at'],
            'available_products' => $availableProducts
        ];
        
        echo json_encode($result);
        
    } catch(PDOException $e) {
        echo json_encode(['error' => 'Database query failed: ' . $e->getMessage()]);
    }
    
} catch(Exception $e) {
    echo json_encode(['error' => 'General error: ' . $e->getMessage()]);
}
?>