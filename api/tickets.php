<?php
// api/tickets.php
require_once '../config/database.php';

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE');
header('Access-Control-Allow-Headers: Content-Type');

try {
    $database = new Database();
    $db = $database->getConnection();

    $method = $_SERVER['REQUEST_METHOD'];

    switch($method) {
        case 'GET':
            try {
                $stmt = $db->query("
                    SELECT
                        t.*,
                        p.name as plane_name,
                        pi.name as pilot_name,
                        COALESCE(
                            (SELECT SUM(ti.quantity_used * pr.price)
                             FROM ticket_items ti
                             LEFT JOIN products pr ON ti.product_id = pr.id
                             WHERE ti.ticket_id = t.id),
                            0
                        ) as total_cost
                    FROM tickets t
                    LEFT JOIN planes p ON t.plane_id = p.id
                    LEFT JOIN pilots pi ON t.pilot_id = pi.id
                    ORDER BY t.created_at DESC
                ");
                $tickets = $stmt->fetchAll(PDO::FETCH_ASSOC);
                echo json_encode($tickets);
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
                $stmt = $db->prepare("INSERT INTO tickets (plane_id, pilot_id, ticket_number, description) VALUES (?, ?, ?, ?)");
                $stmt->execute([
                    $data['plane_id'], 
                    $data['pilot_id'], 
                    $data['ticket_number'], 
                    $data['description'] ?? ''
                ]);
                echo json_encode(['success' => true]);
            } catch(PDOException $e) {
                echo json_encode(['error' => 'Insert failed: ' . $e->getMessage()]);
            }
            break;
            
        case 'PUT':
            $data = json_decode(file_get_contents('php://input'), true);
            if (!$data) {
                echo json_encode(['error' => 'Invalid JSON data']);
                break;
            }
            
            try {
                $stmt = $db->prepare("UPDATE tickets SET plane_id = ?, pilot_id = ?, ticket_number = ?, description = ? WHERE id = ?");
                $stmt->execute([
                    $data['plane_id'], 
                    $data['pilot_id'], 
                    $data['ticket_number'], 
                    $data['description'] ?? '', 
                    $data['id']
                ]);
                echo json_encode(['success' => true]);
            } catch(PDOException $e) {
                echo json_encode(['error' => 'Update failed: ' . $e->getMessage()]);
            }
            break;
            
        case 'DELETE':
            $data = json_decode(file_get_contents('php://input'), true);
            if (!$data || !isset($data['id'])) {
                echo json_encode(['error' => 'Invalid data or missing ID']);
                break;
            }
            
            try {
                $stmt = $db->prepare("DELETE FROM tickets WHERE id = ?");
                $stmt->execute([$data['id']]);
                echo json_encode(['success' => true]);
            } catch(PDOException $e) {
                echo json_encode(['error' => 'Delete failed: ' . $e->getMessage()]);
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