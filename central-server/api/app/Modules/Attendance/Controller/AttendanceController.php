<?php

namespace App\Modules\Attendance\Controller;

use App\Core\Controller;
use App\Modules\Attendance\Models\AttendanceModel;
use Throwable;

class AttendanceController extends Controller
{
    private AttendanceModel $a;

    public function __construct()
    {
        $this->a = new AttendanceModel();
    }

public function ledger()
{
    // Default to a crisp 5-day rolling window ending today
    // Example: If today is May 20, start date becomes May 14
    $defaultStartDate = date('Y-m-d', strtotime('-6 days'));
    $defaultEndDate   = date('Y-m-d');
    
    // Extract parameters from URL query strings (or use defaults)
    $start_date = isset($_GET['start_date']) ? $_GET['start_date'] : $defaultStartDate;
    $end_date   = isset($_GET['end_date'])   ? $_GET['end_date']   : $defaultEndDate;
    $status     = isset($_GET['status']) && !empty($_GET['status']) ? $_GET['status'] : null;
    $attendance_context = isset($_GET['context']) && !empty($_GET['context']) ? $_GET['context'] : "daily"; // Default to daily context if not provided
    
    // Extract the dynamic search string query parameter
    $searchQuery = isset($_GET['search']) && trim($_GET['search']) !== '' ? trim($_GET['search']) : null;
    
    $page  = isset($_GET['page'])  ? max(1, (int)$_GET['page'])   : 1;
    $limit = isset($_GET['limit']) ? max(1, (int)$_GET['limit'])  : 10;

    if (!$start_date || !$end_date) {
        $this->json([
            "success" => false,
            "message" => "start_date and end_date are required"
        ]);
        return;
    }

    try {
        $result = $this->a->getAttendanceLedger($start_date, $end_date, $status, $page, $limit, $attendance_context, $searchQuery);
        
        $meta = $result['meta'] ?? null;
        unset($result['meta']); 

        $this->json([
            "success" => true,
            "data" => $result,
            "meta" => $meta
        ]);
    } catch (Throwable $e) {
        $this->json([
            "success" => false,
            "message" => $e->getMessage(),
            "type" => get_class($e)
        ]);
    }
}
public function userDetail(int $id)
{
    // Ensure input parameters are valid index identifiers
    $userId = max(1, (int)$id);
    if (!$userId) {
        $this->json([
            "success" => false,
            "message" => "Valid target user ID is required"
        ]);
        return;
    }

    // Capture standard filtration inputs and pagination metrics
    $page      = isset($_GET['page'])  ? max(1, (int)$_GET['page'])  : 1;
    $limit     = isset($_GET['limit']) ? max(1, (int)$_GET['limit']) : 10;
    $startDate = isset($_GET['start_date']) && !empty($_GET['start_date']) ? $_GET['start_date'] : null;
    $endDate   = isset($_GET['end_date']) && !empty($_GET['end_date']) ? $_GET['end_date'] : null;
    $attendance_context = isset($_GET['context']) && !empty($_GET['context']) ? $_GET['context'] : "daily"; // Default to daily context if not provided

    try {
        // Execute the processing engine via our encapsulated model service instance
        // Assuming $this->attendanceModel references the target file built above
        $result = $this->a->getUserAttendanceDetails($userId, $startDate, $endDate, $page, $limit, $attendance_context);

        // Map successful payloads smoothly to the app platform response structure
        $this->json([
            "success" => true,
            "metrics" => $result['metrics'],
            "history" => $result['history'],
            "meta"    => $result['meta']
        ]);

    } catch (Throwable $e) {
        // Safe, production fallback catching exceptions dynamically
        $this->json([
            "success" => false,
            "message" => "Failed to aggregate user analytics profile",
            "error"   => $e->getMessage()
        ]);
    }
}

public function partialEdit()
{
    $data = $this->getJsonInput();

    // The unique database record key (0 if synthetic fallback row)
    $id = (int)$data['id']; 
    
    // The actual targeted employee identity key
    $userId = (int)$data['userId']; 
    
    $status = $data['status'];
    $hours = (float)$data['hours'];
    $context = $data['context'];
    $date = $data['date']; // Target ledger date from frontend mapping ("YYYY-MM-DD")
    
    // Extract eventId safely if passed from frontend payload, default to null
    $eventId = isset($data['eventId']) && $data['eventId'] !== null ? (int)$data['eventId'] : null;

    try {
        // CASE A: Record doesn't exist yet -> Execute Insert
        if ($id === 0) {
            if ($this->a->createManualAttendanceSummary($userId, $date, $status, $hours, $context, $eventId)) {
                $this->json([
                    "success" => true,
                    "message" => "Attendance summary created successfully",
                    "userId"  => $userId // Returns target worker id to trigger TanStack invalidation
                ]);
            } else {
                $this->json([
                    "success" => false,
                    "message" => "Failed to create operational summary entry"
                ]);
            }
            return;
        }

        // CASE B: Record exists -> Execute normal Update row mutation
        if ($this->a->updateAttendanceById($id, $status, $hours)) {
            $this->json([
                "success" => true,
                "message" => "Attendance override was successful",
                "userId"  => $userId
            ]);
        } else {
            $this->json([
                "success" => false,
                "message" => "Failed to perform override mutation"
            ]);
        }
    } catch (Throwable $e) {
        $this->json([
            "success" => false,
            "message" => "Failed to aggregate user analytics profile",
            "error"   => $e->getMessage()
        ]);
    }
}
}
