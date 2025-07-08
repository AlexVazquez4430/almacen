<?php
// api/tickets.php
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
        $stmt = $db->query("
            SELECT t.*, p.name as plane_name 
            FROM tickets t 
            LEFT JOIN planes p ON t.plane_id = p.id 
            ORDER BY t.created_at DESC
        ");
        $tickets = $stmt->fetchAll(PDO::FETCH_ASSOC);
        echo json_encode($tickets);
        break;
        
    case 'POST':
        $data = json_decode(file_get_contents('php://input'), true);
        $stmt = $db->prepare("INSERT INTO tickets (plane_id, ticket_number, description) VALUES (?, ?, ?)");
        $stmt->execute([$data['plane_id'], $data['ticket_number'], $data['description']]);
        echo json_encode(['success' => true]);
        break;
}
?>