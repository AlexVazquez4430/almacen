<?php
// api/pilots.php
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
                $stmt = $db->query("SELECT * FROM pilots ORDER BY name");
                $pilots = $stmt->fetchAll(PDO::FETCH_ASSOC);
                echo json_encode($pilots);
            } catch(PDOException $e) {
                echo json_encode(['error' => 'Database query failed: ' . $e->getMessage()]);
            }
            break;
            
        case 'POST':
            $data = json_decode(file_get_contents('php://input'), true);
            
            if (!$data || !isset($data['name']) || empty(trim($data['name']))) {
                echo json_encode(['error' => 'Pilot name is required']);
                break;
            }
            
            try {
                $stmt = $db->prepare("INSERT INTO pilots (name) VALUES (?)");
                $result = $stmt->execute([trim($data['name'])]);
                
                if ($result) {
                    echo json_encode(['success' => true, 'id' => $db->lastInsertId()]);
                } else {
                    echo json_encode(['error' => 'Insert failed']);
                }
            } catch(PDOException $e) {
                echo json_encode(['error' => 'Insert failed: ' . $e->getMessage()]);
            }
            break;
            
        case 'PUT':
            $data = json_decode(file_get_contents('php://input'), true);
            if (!$data || !isset($data['id']) || !isset($data['name']) || empty(trim($data['name']))) {
                echo json_encode(['error' => 'Pilot ID and name are required']);
                break;
            }
            
            try {
                $stmt = $db->prepare("UPDATE pilots SET name = ? WHERE id = ?");
                $stmt->execute([trim($data['name']), $data['id']]);
                echo json_encode(['success' => true]);
            } catch(PDOException $e) {
                echo json_encode(['error' => 'Update failed: ' . $e->getMessage()]);
            }
            break;
            
        case 'DELETE':
            $data = json_decode(file_get_contents('php://input'), true);
            if (!$data || !isset($data['id'])) {
                echo json_encode(['error' => 'Pilot ID is required']);
                break;
            }
            
            try {
                $stmt = $db->prepare("DELETE FROM pilots WHERE id = ?");
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