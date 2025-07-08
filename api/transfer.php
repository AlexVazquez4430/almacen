<?php
// api/transfer.php
require_once '../config/database.php';

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST');
header('Access-Control-Allow-Headers: Content-Type');

try {
    $database = new Database();
    $db = $database->getConnection();

    $data = json_decode(file_get_contents('php://input'), true);
    if (!$data) {
        echo json_encode(['error' => 'Invalid JSON data']);
        exit;
    }

    try {
        $db->beginTransaction();
        
        // Check if enough stock in warehouse
        $stmt = $db->prepare("SELECT total_stock FROM products WHERE id = ?");
        $stmt->execute([$data['product_id']]);
        $product = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$product || $product['total_stock'] < $data['quantity']) {
            throw new Exception('Insufficient stock in warehouse');
        }
        
        // Reduce warehouse stock
        $stmt = $db->prepare("UPDATE products SET total_stock = total_stock - ? WHERE id = ?");
        $stmt->execute([$data['quantity'], $data['product_id']]);
        
        // Check if plane stock record exists
        $stmt = $db->prepare("SELECT current_stock FROM plane_stocks WHERE plane_id = ? AND product_id = ?");
        $stmt->execute([$data['plane_id'], $data['product_id']]);
        $existing = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if ($existing) {
            // Update existing stock
            $stmt = $db->prepare("UPDATE plane_stocks SET current_stock = current_stock + ? WHERE plane_id = ? AND product_id = ?");
            $stmt->execute([$data['quantity'], $data['plane_id'], $data['product_id']]);
        } else {
            // Insert new stock record
            $stmt = $db->prepare("INSERT INTO plane_stocks (plane_id, product_id, current_stock) VALUES (?, ?, ?)");
            $stmt->execute([$data['plane_id'], $data['product_id'], $data['quantity']]);
        }
        
        $db->commit();
        echo json_encode(['success' => true]);
        
    } catch (Exception $e) {
        $db->rollback();
        echo json_encode(['error' => $e->getMessage()]);
    }
    
} catch(Exception $e) {
    echo json_encode(['error' => 'General error: ' . $e->getMessage()]);
}
?>