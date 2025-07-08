<?php
// api/plane-stock.php
require_once '../config/database.php';

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE');
header('Access-Control-Allow-Headers: Content-Type');

$database = new Database();
$db = $database->getConnection();

$method = $_SERVER['REQUEST_METHOD'];

switch($method) {
    case 'GET':
        $planeId = $_GET['plane_id'];
        $stmt = $db->prepare("
            SELECT ps.*, ppm.minimum_quantity, p.name as product_name
            FROM plane_stocks ps
            LEFT JOIN plane_product_minimums ppm ON ps.plane_id = ppm.plane_id AND ps.product_id = ppm.product_id
            LEFT JOIN products p ON ps.product_id = p.id
            WHERE ps.plane_id = ?
        ");
        $stmt->execute([$planeId]);
        $stock = $stmt->fetchAll(PDO::FETCH_ASSOC);
        echo json_encode($stock);
        break;
        
    case 'POST':
        $data = json_decode(file_get_contents('php://input'), true);
        
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
        break;
}
?>