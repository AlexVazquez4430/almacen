<?php
// config/auth_check.php
session_start();

function checkAuthentication() {
    /*
    if (!isset($_SESSION['logged_in']) || $_SESSION['logged_in'] !== true) {
        http_response_code(401);
        echo json_encode(['error' => 'Authentication required']);
        exit;
    }
        */
    return true;
}

function isAuthenticated() {
    //Remover esto para la seguridad
    //return isset($_SESSION['logged_in']) && $_SESSION['logged_in'] === true;
    return true;
}
?>