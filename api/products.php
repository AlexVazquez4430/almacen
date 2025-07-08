<?php
// api/products.php
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
                $stmt = $db->query("SELECT * FROM products ORDER BY name");
                $products = $stmt->fetchAll(PDO::FETCH_ASSOC);
                echo json_encode($products);
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
                $stmt = $db->prepare("INSERT INTO products (name, description, total_stock) VALUES (?, ?, ?)");
                $stmt->execute([$data['name'], $data['description'] ?? '', $data['stock']]);
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
                $stmt = $db->prepare("UPDATE products SET total_stock = ? WHERE id = ?");
                $stmt->execute([$data['stock'], $data['id']]);
                echo json_encode(['success' => true]);
            } catch(PDOException $e) {
                echo json_encode(['error' => 'Update failed: ' . $e->getMessage()]);
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