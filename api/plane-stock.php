<?php
// api/plane-stock.php
require_once '../config/database.php';
require_once '../config/auth_check.php';

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT');
header('Access-Control-Allow-Headers: Content-Type');

// Check authentication for all requests
checkAuthentication();

try {
    $database = new Database();
    $db = $database->getConnection();

    $method = $_SERVER['REQUEST_METHOD'];

    switch($method) {
        case 'GET':
            try {
                if (isset($_GET['plane_id'])) {
                    // Get stock for specific plane
                    $planeId = $_GET['plane_id'];
                    $stmt = $db->prepare("
                        SELECT ps.*, ppm.minimum_quantity, p.name as product_name
                        FROM plane_stocks ps
                        LEFT JOIN plane_product_minimums ppm ON ps.plane_id = ppm.plane_id AND ps.product_id = ppm.product_id
                        LEFT JOIN products p ON ps.product_id = p.id
                        WHERE ps.plane_id = ?
                    ");
                    $stmt->execute([$planeId]);
                } else {
                    // Get all stock data
                    $stmt = $db->prepare("
                        SELECT ps.*, ppm.minimum_quantity, p.name as product_name
                        FROM plane_stocks ps
                        LEFT JOIN plane_product_minimums ppm ON ps.plane_id = ppm.plane_id AND ps.product_id = ppm.product_id
                        LEFT JOIN products p ON ps.product_id = p.id
                        ORDER BY ps.plane_id, ps.product_id
                    ");
                    $stmt->execute();
                }
                $stock = $stmt->fetchAll(PDO::FETCH_ASSOC);
                echo json_encode($stock);
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
                // Set minimum quantity
                $stmt = $db->prepare("
                    INSERT OR REPLACE INTO plane_product_minimums (plane_id, product_id, minimum_quantity) 
                    VALUES (?, ?, ?)
                ");
                $stmt->execute([$data['plane_id'], $data['product_id'], $data['minimum_quantity']]);
                
                // Initialize stock if doesn't exist
                $stmt = $db->prepare("
                    INSERT OR IGNORE INTO plane_stocks (plane_id, product_id, current_stock) 
                    VALUES (?, ?, 0)
                ");
                $stmt->execute([$data['plane_id'], $data['product_id']]);
                
                echo json_encode(['success' => true]);
            } catch(PDOException $e) {
                echo json_encode(['error' => 'Database operation failed: ' . $e->getMessage()]);
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