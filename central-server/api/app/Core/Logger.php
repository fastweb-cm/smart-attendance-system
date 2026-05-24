<?php

namespace App\Core;

use Throwable;

class Logger
{
    public static function log(
        string $category,
        string $level,
        string $description,
        ?int $userId = null,
        ?array $contextData = null
    ): void {
        try {
            $db = Database::connect();

            // FALLBACK AUTO-DETECTION: If no manual user ID is provided, grab it from our AppContext container
            if ($userId === null) {
                $userId = AppContext::getUserId();
            }

            // ENHANCEMENT: Prepend the Admin's name to the description for ultra-clear system logs
            $adminName = AppContext::getUserName();
            $enrichedDescription = sprintf("[%s] %s", $adminName, $description);

            $ipAddress = $_SERVER['REMOTE_ADDR'] ?? null;
            $requestUri = $_SERVER['REQUEST_URI'] ?? null;
            
            $jsonContext = $contextData !== null ? json_encode($contextData, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE) : null;

            $sql = "INSERT INTO tbl_logs (category, log_level, description, user_id, ip_address, request_uri, context_data) 
                    VALUES (?, ?, ?, ?, ?, ?, ?)";

            $db->query($sql, [$category, $level, $enrichedDescription, $userId, $ipAddress, $requestUri, $jsonContext]);
        } catch (Throwable $e) {
            error_log("Logger failure: " . $e->getMessage() . " | Original Log: " . $description);
        }
    }

    public static function logException(Throwable $e, string $category = 'system', ?int $userId = null): void
    {
        $level = ($e instanceof \mysqli_sql_exception) ? 'critical' : 'error';
        $description = sprintf("Exception [%s]: %s", get_class($e), $e->getMessage());

        $contextData = [
            'exception_class' => get_class($e),
            'file'            => $e->getFile(),
            'line'            => $e->getLine(),
            'code'            => $e->getCode(),
            'stack_trace'     => explode("\n", $e->getTraceAsString())
        ];

        // This will now use the automatic context fallback too if user_id is null!
        self::log($category, $level, $description, $userId, $contextData);
    }
}
