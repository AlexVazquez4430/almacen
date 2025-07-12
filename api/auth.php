<?php
// api/auth.php
require_once '../config/database.php';

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST');
header('Access-Control-Allow-Headers: Content-Type');

session_start();

try {
    $database = new Database();
    $db = $database->getConnection();

    $method = $_SERVER['REQUEST_METHOD'];

    switch($method) {
        case 'POST':
            $data = json_decode(file_get_contents('php://input'), true);
            
            if (!$data) {
                echo json_encode(['error' => 'Invalid JSON data']);
                break;
            }

            $action = $data['action'] ?? '';

            switch($action) {
                case 'login':
                    if (!isset($data['username']) || !isset($data['password'])) {
                        echo json_encode(['error' => 'Username and password are required']);
                        break;
                    }

                    try {
                        $stmt = $db->prepare("SELECT id, username, password FROM users WHERE username = ?");
                        $stmt->execute([$data['username']]);
                        $user = $stmt->fetch(PDO::FETCH_ASSOC);

                        if ($user && password_verify($data['password'], $user['password'])) {
                            $_SESSION['user_id'] = $user['id'];
                            $_SESSION['username'] = $user['username'];
                            $_SESSION['logged_in'] = true;
                            
                            echo json_encode([
                                'success' => true,
                                'message' => 'Login successful',
                                'username' => $user['username']
                            ]);
                        } else {
                            echo json_encode(['error' => 'Invalid username or password']);
                        }
                    } catch(PDOException $e) {
                        echo json_encode(['error' => 'Database error: ' . $e->getMessage()]);
                    }
                    break;

                case 'logout':
                    session_destroy();
                    echo json_encode(['success' => true, 'message' => 'Logged out successfully']);
                    break;

                case 'check':
                    if (isset($_SESSION['logged_in']) && $_SESSION['logged_in'] === true) {
                        echo json_encode([
                            'logged_in' => true,
                            'username' => $_SESSION['username']
                        ]);
                    } else {
                        echo json_encode(['logged_in' => false]);
                    }
                    break;

                default:
                    echo json_encode(['error' => 'Invalid action']);
                    break;
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