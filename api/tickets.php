<?php
// api/tickets.php
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
                // Check if requesting a specific ticket by ID
                $ticket_id = $_GET['id'] ?? '';

                if (!empty($ticket_id)) {
                    // Fetch single ticket by ID
                    $query = "
                        SELECT
                            t.*,
                            p.name as plane_name,
                            COALESCE(
                                (SELECT SUM(ti.quantity_used * pr.price)
                                 FROM ticket_items ti
                                 LEFT JOIN products pr ON ti.product_id = pr.id
                                 WHERE ti.ticket_id = t.id),
                                0
                            ) as total_cost
                        FROM tickets t
                        LEFT JOIN planes p ON t.plane_id = p.id
                        WHERE t.id = ?
                    ";

                    $stmt = $db->prepare($query);
                    $stmt->execute([$ticket_id]);
                    $tickets = $stmt->fetchAll(PDO::FETCH_ASSOC);

                    if (empty($tickets)) {
                        echo json_encode(['error' => 'Ticket not found']);
                        break;
                    }

                    // No need to get pilots and doctors anymore - simplified structure

                    echo json_encode([$tickets[0]]); // Return array format for consistency
                    break;
                }

                // Get filter parameters for listing all tickets
                $date_filter = $_GET['date'] ?? '';
                $description_filter = $_GET['description'] ?? '';

                // Build the simplified query (no pilots or doctors)
                $query = "
                    SELECT
                        t.*,
                        p.name as plane_name,
                        COALESCE(
                            (SELECT SUM(ti.quantity_used * pr.price)
                             FROM ticket_items ti
                             LEFT JOIN products pr ON ti.product_id = pr.id
                             WHERE ti.ticket_id = t.id),
                            0
                        ) as total_cost
                    FROM tickets t
                    LEFT JOIN planes p ON t.plane_id = p.id
                    WHERE 1=1
                ";

                $params = [];

                // Add filters (only date and description now)
                if (!empty($date_filter)) {
                    $query .= " AND DATE(t.ticket_date) = ?";
                    $params[] = $date_filter;
                }

                if (!empty($description_filter)) {
                    $query .= " AND t.description LIKE ?";
                    $params[] = '%' . $description_filter . '%';
                }

                $query .= " ORDER BY t.created_at DESC";

                $stmt = $db->prepare($query);
                $stmt->execute($params);
                $tickets = $stmt->fetchAll(PDO::FETCH_ASSOC);

                // No need to get pilots and doctors anymore

                echo json_encode($tickets);
            } catch (Exception $e) {
                echo json_encode(['error' => 'Failed to fetch tickets: ' . $e->getMessage()]);
            }
            break;

        case 'POST':
            $data = json_decode(file_get_contents('php://input'), true);
            if (!$data) {
                echo json_encode(['error' => 'Invalid JSON data']);
                break;
            }

            try {
                $db->beginTransaction();

                // Create the ticket (simplified - no pilots)
                $stmt = $db->prepare("INSERT INTO tickets (plane_id, ticket_number, description, ticket_date) VALUES (?, ?, ?, ?)");
                $stmt->execute([
                    $data['plane_id'],
                    $data['ticket_number'],
                    $data['description'] ?? '',
                    $data['ticket_date'] ?? date('Y-m-d')
                ]);

                $ticketId = $db->lastInsertId();

                // No pilot or doctor assignment needed anymore

                // Add doctors to the ticket
                if (isset($data['doctor_ids']) && is_array($data['doctor_ids'])) {
                    $doctorStmt = $db->prepare("INSERT INTO ticket_doctors (ticket_id, doctor_id) VALUES (?, ?)");
                    foreach ($data['doctor_ids'] as $doctorId) {
                        if (!empty($doctorId)) {
                            $doctorStmt->execute([$ticketId, $doctorId]);
                        }
                    }
                }

                $db->commit();
                echo json_encode(['success' => true, 'ticket_id' => $ticketId]);
            } catch(PDOException $e) {
                $db->rollback();
                echo json_encode(['error' => 'Insert failed: ' . $e->getMessage()]);
            }
            break;
            
        case 'PUT':
            $data = json_decode(file_get_contents('php://input'), true);
            if (!$data || !isset($data['id'])) {
                echo json_encode(['error' => 'Invalid JSON data or missing ID']);
                break;
            }

            try {
            $db->beginTransaction();

            // Update ticket (simplified - no pilots)
            $stmt = $db->prepare("UPDATE tickets SET plane_id = ?, ticket_number = ?, description = ?, ticket_date = ? WHERE id = ?");
            $stmt->execute([
                $data['plane_id'],
                $data['ticket_number'],
                $data['description'] ?? '',
                $data['ticket_date'] ?? date('Y-m-d'),
                $data['id']
            ]);

            $db->commit();
            echo json_encode(['success' => true]);
        } catch(PDOException $e) {
            $db->rollback();
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
                $stmt = $db->prepare("DELETE FROM tickets WHERE id = ?");
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