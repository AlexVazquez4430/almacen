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

                    // Get pilots and doctors for this ticket
                    foreach ($tickets as &$ticket) {
                        // Get pilots for this ticket
                        $pilotStmt = $db->prepare("
                            SELECT p.id, p.name
                            FROM pilots p
                            JOIN ticket_pilots tp ON p.id = tp.pilot_id
                            WHERE tp.ticket_id = ?
                        ");
                        $pilotStmt->execute([$ticket['id']]);
                        $ticket['pilots'] = $pilotStmt->fetchAll(PDO::FETCH_ASSOC);

                        // Get doctors for this ticket
                        $doctorStmt = $db->prepare("
                            SELECT d.id, d.name
                            FROM doctors d
                            JOIN ticket_doctors td ON d.id = td.doctor_id
                            WHERE td.ticket_id = ?
                        ");
                        $doctorStmt->execute([$ticket['id']]);
                        $ticket['doctors'] = $doctorStmt->fetchAll(PDO::FETCH_ASSOC);
                    }

                    echo json_encode([$tickets[0]]); // Return array format for consistency
                    break;
                }

                // Get filter parameters for listing all tickets
                $pilot_filter = $_GET['pilot'] ?? '';
                $doctor_filter = $_GET['doctor'] ?? '';
                $date_filter = $_GET['date'] ?? '';
                $description_filter = $_GET['description'] ?? '';

                // Build the base query
                $query = "
                    SELECT DISTINCT
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
                    LEFT JOIN ticket_pilots tp ON t.id = tp.ticket_id
                    LEFT JOIN pilots pi ON tp.pilot_id = pi.id
                    LEFT JOIN ticket_doctors td ON t.id = td.ticket_id
                    LEFT JOIN doctors d ON td.doctor_id = d.id
                    WHERE 1=1
                ";

                $params = [];

                // Add filters
                if (!empty($pilot_filter)) {
                    $query .= " AND pi.name LIKE ?";
                    $params[] = '%' . $pilot_filter . '%';
                }

                if (!empty($doctor_filter)) {
                    $query .= " AND d.name LIKE ?";
                    $params[] = '%' . $doctor_filter . '%';
                }

                if (!empty($date_filter)) {
                    $query .= " AND DATE(t.created_at) = ?";
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

                // Get pilots and doctors for each ticket
                foreach ($tickets as &$ticket) {
                    // Get pilots for this ticket
                    $pilotStmt = $db->prepare("
                        SELECT pi.id, pi.name
                        FROM ticket_pilots tp
                        JOIN pilots pi ON tp.pilot_id = pi.id
                        WHERE tp.ticket_id = ?
                    ");
                    $pilotStmt->execute([$ticket['id']]);
                    $ticket['pilots'] = $pilotStmt->fetchAll(PDO::FETCH_ASSOC);

                    // Get doctors for this ticket
                    $doctorStmt = $db->prepare("
                        SELECT d.id, d.name
                        FROM ticket_doctors td
                        JOIN doctors d ON td.doctor_id = d.id
                        WHERE td.ticket_id = ?
                    ");
                    $doctorStmt->execute([$ticket['id']]);
                    $ticket['doctors'] = $doctorStmt->fetchAll(PDO::FETCH_ASSOC);
                }

                echo json_encode($tickets);
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
                $db->beginTransaction();

                // Create the ticket (remove pilot_id from main table)
                $stmt = $db->prepare("INSERT INTO tickets (plane_id, ticket_number, description, ticket_date) VALUES (?, ?, ?, ?)");
                $stmt->execute([
                    $data['plane_id'],
                    $data['ticket_number'],
                    $data['description'] ?? '',
                    $data['ticket_date'] ?? date('Y-m-d')
                ]);

                $ticketId = $db->lastInsertId();

                // Add pilots to the ticket
                if (isset($data['pilot_ids']) && is_array($data['pilot_ids'])) {
                    $pilotStmt = $db->prepare("INSERT INTO ticket_pilots (ticket_id, pilot_id) VALUES (?, ?)");
                    foreach ($data['pilot_ids'] as $pilotId) {
                        if (!empty($pilotId)) {
                            $pilotStmt->execute([$ticketId, $pilotId]);
                        }
                    }
                }

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

                // Update the main ticket information
                $stmt = $db->prepare("UPDATE tickets SET plane_id = ?, ticket_number = ?, description = ?, ticket_date = ? WHERE id = ?");
                $stmt->execute([
                    $data['plane_id'],
                    $data['ticket_number'],
                    $data['description'] ?? '',
                    $data['ticket_date'] ?? date('Y-m-d'),
                    $data['id']
                ]);

                // Remove existing pilot assignments
                $stmt = $db->prepare("DELETE FROM ticket_pilots WHERE ticket_id = ?");
                $stmt->execute([$data['id']]);

                // Add new pilot assignments
                if (isset($data['pilot_ids']) && is_array($data['pilot_ids'])) {
                    $pilotStmt = $db->prepare("INSERT INTO ticket_pilots (ticket_id, pilot_id) VALUES (?, ?)");
                    foreach ($data['pilot_ids'] as $pilotId) {
                        if (!empty($pilotId)) {
                            $pilotStmt->execute([$data['id'], $pilotId]);
                        }
                    }
                }

                // Remove existing doctor assignments
                $stmt = $db->prepare("DELETE FROM ticket_doctors WHERE ticket_id = ?");
                $stmt->execute([$data['id']]);

                // Add new doctor assignments
                if (isset($data['doctor_ids']) && is_array($data['doctor_ids'])) {
                    $doctorStmt = $db->prepare("INSERT INTO ticket_doctors (ticket_id, doctor_id) VALUES (?, ?)");
                    foreach ($data['doctor_ids'] as $doctorId) {
                        if (!empty($doctorId)) {
                            $doctorStmt->execute([$data['id'], $doctorId]);
                        }
                    }
                }

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