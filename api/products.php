<?php
// api/products.php
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
        $stmt = $db->query("SELECT * FROM products ORDER BY name");
        $products = $stmt->fetchAll(PDO::FETCH_ASSOC);
        echo json_encode($products);
        break;
        
    case 'POST':
        $data = json_decode(file_get_contents('php://input'), true);
        $stmt = $db->prepare("INSERT INTO products (name, description, total_stock) VALUES (?, ?, ?)");
        $stmt->execute([$data['name'], $data['description'], $data['stock']]);
        echo json_encode(['success' => true]);
        break;
        
    case 'PUT':
        $data = json_decode(file_get_contents('php://input'), true);
        $stmt = $db->prepare("UPDATE products SET total_stock = ? WHERE id = ?");
        $stmt->execute([$data['stock'], $data['id']]);
        echo json_encode(['success' => true]);
        break;
}
?>