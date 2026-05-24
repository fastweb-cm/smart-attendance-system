<?php

namespace App\Core;

use Throwable;

class Logger
{
    /**
     * Commit a structured entry directly into the logging database matrix
     */
    public static function log(
        string $category,
        string $level,
        string $description,
        ?int $userId = null,
        ?array $contextData = null
    ): void {
        try {
            $db = Database::connect();

            // Safely capture request environment parameters
            $ipAddress = $_SERVER['REMOTE_ADDR'] ?? null;
            $requestUri = $_SERVER['REQUEST_URI'] ?? null;
            
            // Serialize context payload metadata to valid JSON strings
            $jsonContext = $contextData !== null ? json_encode($contextData, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE) : null;

            $sql = "INSERT INTO tbl_logs (category, log_level, description, user_id, ip_address, request_uri, context_data) 
                    VALUES (?, ?, ?, ?, ?, ?, ?)";

            $db->query($sql, [$category, $level, $description, $userId, $ipAddress, $requestUri, $jsonContext]);
        } catch (Throwable $e) {
            // Fallback safety guard: If the database is completely down, log via system file stream
            error_log("Logger failure: " . $e->getMessage() . " | Original Log: " . $description);
        }
    }

    /**
     * Intercept a live PHP Throwable lifecycle and parse it into an error entry
     */
    public static function logException(Throwable $e, string $category = 'system', ?int $userId = null): void
    {
        $level = ($e instanceof \mysqli_sql_exception) ? 'critical' : 'error';
        $description = sprintf("Exception [%s]: %s", get_class($e), $e->getMessage());

        $contextData = [
            'exception_class' => get_class($e),
            'file'            => $e->getFile(),
            'line'            => $e->getLine(),
            'code'            => $e->getCode(),
            'stack_trace'     => explode("\n", $e->getTraceAsString()) // Easy to read as an array
        ];

        self::log($category, $level, $description, $userId, $contextData);
    }
}
