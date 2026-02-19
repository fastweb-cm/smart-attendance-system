<?php
namespace App\Core;

class controller {
    protected function json($data, int $statusCode = 200): void {
        http_response_code($statusCode);
        header('Content-Type: application/json');
        echo json_encode($data);
    }

    protected function getJsonInput(): array {
        return json_decode(file_get_contents('php://input'), true) ?? [];
    }
}
?>