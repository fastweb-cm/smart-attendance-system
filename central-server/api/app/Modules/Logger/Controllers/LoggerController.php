<?php

namespace App\Modules\Logger\Controllers;

use App\Modules\Logger\Models\LoggerModel;
use App\Core\Controller;

class LoggerController extends Controller
{
    private LoggerModel $loggerModel;

    public function __construct()
    {
        $this->loggerModel = new LoggerModel();
    }

    /**
     * Endpoint Handler: GET /api/logs
     */
    public function index()
    {
        try {
            // Extract optional filters from query string variables
            $category  = isset($_GET['category']) && $_GET['category'] !== '' ? trim($_GET['category']) : null;
            $level     = isset($_GET['level']) && $_GET['level'] !== '' ? trim($_GET['level']) : null;
            $startDate = isset($_GET['start_date']) && $_GET['start_date'] !== '' ? trim($_GET['start_date']) : null;
            $endDate   = isset($_GET['end_date']) && $_GET['end_date'] !== '' ? trim($_GET['end_date']) : null;

            // Extract and sanitize pagination bounds
            $page  = isset($_GET['page'])  ? max(1, (int)$_GET['page']) : 1;
            $limit = isset($_GET['limit']) ? max(1, min(100, (int)$_GET['limit'])) : 50; // Cap at 100 rows per fetch max

            // Fetch structured data matrix payload
            $logsPayload = $this->loggerModel->fetchLogs(
                $category,
                $level,
                $startDate,
                $endDate,
                $page,
                $limit
            );

            $this->json([
                'success' => true,
                'message' => 'Logs retrieved successfully.',
                'meta'    => $logsPayload['pagination'],
                'data'    => $logsPayload['data']
            ]);

        } catch (\Throwable $e) {
            $this->json([
                'success' => false,
                'message' => 'An unexpected server error occurred while pulling audit records.',
                'error'   => $e->getMessage() // Turn off in production for raw application hardening
            ],500);
        }
    }
}
