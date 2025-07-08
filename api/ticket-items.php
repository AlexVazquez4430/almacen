<?php
// api/ticket-items.php
require_once '../config/database.php';

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, DELETE');
header('Access-Control-Allow-Headers: Content-Type');

try {
    $database = new Database();
    $db = $database->getConnection();

    $method = $_SERVER['REQUEST_METHOD'];

    switch($method) {
        case 'GET':
            if (!isset($_GET['ticket_id'])) {
                echo json_encode(['error' => 'ticket_id parameter required']);
                break;
            }
            
            $ticketId = $_GET['ticket_id'];
            try {
                $stmt = $db->prepare("
                    SELECT ti.*, p.name as product_name
                    FROM ticket_items ti
                    LEFT JOIN products p ON ti.product_id = p.id
                    WHERE ti.ticket_id = ?
                    ORDER BY p.name
                ");
                $stmt->execute([$ticketId]);
                $items = $stmt->fetchAll(PDO::FETCH_ASSOC);
                echo json_encode($items);
            } catch(PDOException $e) {
                echo json_encode(['error' => 'Database query failed: ' . $e->getMessage()]);
            }
            break;
            
        case 'POST':
            $data = json_decode(file_get_contents('php://input'), true);
            if (!$data) {
                echo json_encode(['error' => 'Invalid JSON data']);
                break;
            }
            
            try {
                $db->beginTransaction();
                
                // Get ticket details to find the plane
                $stmt = $db->prepare("SELECT plane_id FROM tickets WHERE id = ?");
                $stmt->execute([$data['ticket_id']]);
                $ticket = $stmt->fetch(PDO::FETCH_ASSOC);
                
                if (!$ticket) {
                    throw new Exception('Ticket not found');
                }
                
                // Check if enough stock in plane
                $stmt = $db->prepare("SELECT current_stock FROM plane_stocks WHERE plane_id = ? AND product_id = ?");
                $stmt->execute([$ticket['plane_id'], $data['product_id']]);
                $stock = $stmt->fetch(PDO::FETCH_ASSOC);
                
                if (!$stock || $stock['current_stock'] < $data['quantity_used']) {
                    throw new Exception('Insufficient stock in plane');
                }
                
                // Add ticket item
                $stmt = $db->prepare("INSERT INTO ticket_items (ticket_id, product_id, quantity_used) VALUES (?, ?, ?)");
                $stmt->execute([$data['ticket_id'], $data['product_id'], $data['quantity_used']]);
                
                // Reduce plane stock
                $stmt = $db->prepare("UPDATE plane_stocks SET current_stock = current_stock - ? WHERE plane_id = ? AND product_id = ?");
                $stmt->execute([$data['quantity_used'], $ticket['plane_id'], $data['product_id']]);
                
                $db->commit();
                echo json_encode(['success' => true]);
                
            } catch(Exception $e) {
                $db->rollback();
                echo json_encode(['error' => $e->getMessage()]);
            }
            break;
            
        case 'DELETE':
            $data = json_decode(file_get_contents('php://input'), true);
            if (!$data || !isset($data['id'])) {
                echo json_encode(['error' => 'Item ID required']);
                break;
            }
            
            try {
                $db->beginTransaction();
                
                // Get item details
                $stmt = $db->prepare("
                    SELECT ti.*, t.plane_id 
                    FROM ticket_items ti 
                    LEFT JOIN tickets t ON ti.ticket_id = t.id 
                    WHERE ti.id = ?
                ");
                $stmt->execute([$data['id']]);
                $item = $stmt->fetch(PDO::FETCH_ASSOC);
                
                if (!$item) {
                    throw new Exception('Item not found');
                }
                
                // Return stock to plane
                $stmt = $db->prepare("UPDATE plane_stocks SET current_stock = current_stock + ? WHERE plane_id = ? AND product_id = ?");
                $stmt->execute([$item['quantity_used'], $item['plane_id'], $item['product_id']]);
                
                // Delete ticket item
                $stmt = $db->prepare("DELETE FROM ticket_items WHERE id = ?");
                $stmt->execute([$data['id']]);
                
                $db->commit();
                echo json_encode(['success' => true]);
                
            } catch(Exception $e) {
                $db->rollback();
                echo json_encode(['error' => $e->getMessage()]);
            }
            break;
            
        default:
            echo json_encode(['error' => 'Method not allowed']);
            break;
    }
} catch(Exception $e) {
    echo json_encode(['error' => 'General error: ' . $e->getMessage()]);
}
?>