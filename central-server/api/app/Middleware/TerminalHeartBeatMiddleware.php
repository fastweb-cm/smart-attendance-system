<?php
namespace App\Middleware;

use App\Core\Database;

class TerminalHeartBeatMiddleware {
    
    public static function handle() {
        $terminalId = $_GET['terminal_id'] ?? null;

        // If it's a POST request and terminal_id isn't in query params, look in the body
        if (!$terminalId && $_SERVER['REQUEST_METHOD'] === 'POST') {
            $rawInput = file_get_contents('php://input');
            $input = json_decode($rawInput, true);
            $terminalId = $input['terminal_id'] ?? null;
        }

        if ($terminalId) {
            TerminalHeartBeatMiddleware::recordActivity((int)$terminalId);
        }

        // Pass the request to the next stage (the Controller)
        // return $next($request);
    }

    private static function recordActivity(int $terminalId) {
        try {
            $db = Database::connect();
            
            $ip = $_SERVER['REMOTE_ADDR'] ?? '0.0.0.0';
            $userAgent = $_SERVER['HTTP_USER_AGENT'] ?? 'Unknown';
            
            // Log exactly which endpoint triggered the heartbeat
            $metadata = json_encode([
                'endpoint' => $_SERVER['REQUEST_URI'],
                'method' => $_SERVER['REQUEST_METHOD'],
                'client_port' => $_SERVER['REMOTE_PORT'] ?? null
            ]);

            $sql = "INSERT INTO tbl_terminal_health (terminal_id, ip_address, user_agent, metadata, last_heartbeat)
                    VALUES (?, ?, ?, ?, NOW())
                    ON DUPLICATE KEY UPDATE 
                        ip_address = VALUES(ip_address),
                        user_agent = VALUES(user_agent),
                        metadata = VALUES(metadata),
                        last_heartbeat = NOW()";
            
            $db->query($sql, [$terminalId, $ip, $userAgent, $metadata]);
        } catch (\Throwable $e) {
            // We fail silently here so a DB error in health logging 
            // doesn't break the actual Sync process.
            error_log("Heartbeat failed for Terminal $terminalId: " . $e->getMessage());
        }
    }
}
