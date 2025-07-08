<?php
// api/planes.php
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
        $stmt = $db->query("SELECT * FROM planes ORDER BY name");
        $planes = $stmt->fetchAll(PDO::FETCH_ASSOC);
        echo json_encode($planes);
        break;
        
    case 'POST':
        $data = json_decode(file_get_contents('php://input'), true);
        $stmt = $db->prepare("INSERT INTO planes (name, description) VALUES (?, ?)");
        $stmt->execute([$data['name'], $data['description']]);
        echo json_encode(['success' => true]);
        break;
}
?>