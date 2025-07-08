<?php
// api/transfer.php
require_once '../config/database.php';

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST');
header('Access-Control-Allow-Headers: Content-Type');

$database = new Database();
$db = $database->getConnection();

$data = json_decode(file_get_contents('php://input'), true);

try {
    $db->beginTransaction();
    
    // Check if enough stock in warehouse
    $stmt = $db->prepare("SELECT total_stock FROM products WHERE id = ?");
    $stmt->execute([$data['product_id']]);
    $product = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if ($product['total_stock'] < $data['quantity']) {
        throw new Exception('Insufficient stock in warehouse');
    }
    
    // Reduce warehouse stock
    $stmt = $db->prepare("UPDATE products SET total_stock = total_stock - ? WHERE id = ?");
    $stmt->execute([$data['quantity'], $data['product_id']]);
    
    // Add to plane stock
    $stmt = $db->prepare("
        INSERT INTO plane_stocks (plane_id, product_id, current_stock) 
        VALUES (?, ?, ?) 
        ON CONFLICT(plane_id, product_id) 
        DO UPDATE SET current_stock = current_stock + ?
    ");
    $stmt->execute([$data['plane_id'], $data['product_id'], $data['quantity'], $data['quantity']]);
    
    $db->commit();
    echo json_encode(['success' => true]);
    
} catch (Exception $e) {
    $db->rollback();
    echo json_encode(['error' => $e->getMessage()]);
}
?>