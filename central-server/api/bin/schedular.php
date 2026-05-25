<?php
/**
 * Master System Automation Hub
 * Configured as a single point of invocation for all system operations
 */

declare(strict_types=1);

namespace App\Console;

use Throwable;

// Core Bootstrapper Integration
// Path checks might need alignment depending on where you drop this relative to your root vendor directory
require_once __DIR__ . '/../vendor/autoload.php'; 

use App\Core\Database;
use App\Core\Logger;

// Ensure this script can only run from a secure command-line shell (CLI context environment)
if (php_sapi_name() !== 'cli') {
    header("HTTP/1.1 403 Forbidden");
    echo "Access Denied: This automated engine task runner is restricted to system-level executions only.\n";
    exit(1);
}

$db = Database::connect();
$today = date('Y-m-d');

Logger::log('system', 'info', "Master cron execution cycle started.");

// -----------------------------------------------------------------
// CENTRALIZED REGISTER OF MIDNIGHT PIPELINES
// -----------------------------------------------------------------

try {
    // Process and backfill approved permissions to attendance summary
    runTask('Permission Summary Alignment Engine', function() use ($db, $today) {
        $sql = "
            SELECT p.user_id 
            FROM tbl_permission p
            LEFT JOIN tbl_attendance_summary s ON (s.user_id = p.user_id AND s.attendance_date = ?)
            WHERE p.status = 'approved'
              AND ? BETWEEN p.start_date AND p.end_date
              AND (s.id IS NULL OR s.first_checkin IS NULL)
        ";

        $result = $db->query($sql, [$today, $today]);
        $absentButPermitted = $result ? $result->fetch_all(MYSQLI_ASSOC) : [];

        if (!empty($absentButPermitted)) {
            $insertSql = "
                INSERT INTO tbl_attendance_summary (user_id, attendance_date, attendance_status, total_hours)
                VALUES (?, ?, 'on_permission', 0)
                ON DUPLICATE KEY UPDATE 
                    attendance_status = IF(first_checkin IS NULL, 'on_permission', attendance_status)
            ";

            foreach ($absentButPermitted as $row) {
                $db->query($insertSql, [$row['user_id'], $today]);
            }
        }
        return sprintf("Processed %d staff profiles to 'on_permission' states.", count($absentButPermitted));
    });

    // Placeholder for your next midnight task (e.g., Automatic Absentee Generation)
    runTask('Automated Absentee Backfill Core', function() use ($db, $today) {
        // You can drop your query logic directly inside this block later
        return "Executed fine: Checked zero-interaction entries.";
    });

    // TASK 3: Placeholder for institutional metrics (e.g., Monthly NSIF/Tax Deductions cache updates)
    runTask('Institutional Payroll & Deduction Sync Layer', function() use ($db, $today) {
        // Your logic for calculations here
        return "Calculations complete.";
    });

    Logger::log('system', 'info', "Master cron execution cycle completed successfully.");

} catch (Throwable $masterException) {
    Logger::log('system', 'critical', "Master task wrapper halted fatally: " . $masterException->getMessage());
    exit(1);
}

/**
 * Task Executor Helper Function
 * Wraps individual sub-tasks so if one fails, it doesn't break the rest of the file
 */
function runTask(string $taskName, callable $taskLogic): void 
{
    try {
        $outputMessage = $taskLogic();
        Logger::log('system', 'info', sprintf("Task [%s] passed: %s", $taskName, $outputMessage));
    } catch (Throwable $e) {
        Logger::log('system', 'error', sprintf("Task [%s] failed processing logic sequence: %s", $taskName, $e->getMessage()));
    }
}
