<?php
// api/planes.php
require_once '../config/database.php';
require_once '../config/auth_check.php';

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE');
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
                $stmt = $db->query("SELECT * FROM planes ORDER BY name");
                $planes = $stmt->fetchAll(PDO::FETCH_ASSOC);
                echo json_encode($planes);
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
                $stmt = $db->prepare("INSERT INTO planes (name, description) VALUES (?, ?)");
                $stmt->execute([$data['name'], $data['description'] ?? '']);
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
                $stmt = $db->prepare("UPDATE planes SET name = ?, description = ? WHERE id = ?");
                $stmt->execute([$data['name'], $data['description'] ?? '', $data['id']]);
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
                $stmt = $db->prepare("DELETE FROM planes WHERE id = ?");
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