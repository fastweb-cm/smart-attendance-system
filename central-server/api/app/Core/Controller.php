<?php
namespace App\Core;

class controller {
    protected static function json($data, int $statusCode = 200, bool $exit = true): void {
        http_response_code($statusCode);
        header('Content-Type: application/json');
        echo json_encode($data);
        if($exit) exit;
    }

    protected function request(): string
    {
        return $_SERVER['REQUEST_METHOD'] ?? 'GET';
    }
    protected function getJsonInput(): array {
        return json_decode(file_get_contents('php://input'), true) ?? [];
    }

    /**
     * Get query parameters from the current request
     * Returns an associative array
    */
    protected function getQueryParams(): array {
        return  $_GET ?? [];
    }

    protected static function getAuthHeader(): string
    {
        // $headers = getallheaders(); //fetches all headers sent from this request
        $headers = getallheaders();
        // error_log(json_encode($headers));

        if (!isset($headers["Authorization"])) {
            self::json([
                "status" => 'error',
                "message" => "Access Denied"
            ],401);
        }

        return str_replace("Bearer ", '', $headers['Authorization']);   //return the bearer token
    }
}
?>
