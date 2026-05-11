<?php 
namespace App\Modules\Sync\Controller;

use App\Core\Controller;
use App\Modules\Sync\Models\SyncModel;
use Throwable;

class SyncController extends Controller {
    private SyncModel $s;

    public function __construct()
    {
        $this->s = new SyncModel();
    }

    public function index()
    {
        $terminalId = (int)($_GET["terminal_id"] ?? 0);
        $lastSync = $_GET["last_sync"] ?? null;

        if ($terminalId <= 0) {
            $this->json([
                "success"=> false,
                "message"=> "Terminal ID is required"
            ]);
        }


        try{
            $syncData = $this->s->getPendingUpdates($terminalId);
            $this->json([
                "success"=> true,
                "data"=> $syncData["updates"],
                "last_sync_time" => ""
            ]);
        }catch(Throwable $e) {
            $this->json([
                "success"=> false,
                "message"=> $e->getMessage(),
                "type"=> get_class($e)
            ]);
        }
    }

    public function acknowledge()
    {
        $data = $this->getJsonInput();
        $syncIds = $data["ids"] ?? [];

        if (empty($syncIds)) {
            $this->json([
                "success"=> false,
                "message"=> "sync_ids array is required"
            ],404);
        }

        try{
            $this->s->updateSyncStatus($syncIds);
            $this->json([
                "success"=> true,
                "message"=> "Acknowledged successfully"
            ]);
        }catch(Throwable $e) {  
            $this->json([
                "success"=> false,
                "message"=> $e->getMessage(),
                "type"=> get_class($e)
            ]);
        }
    }

    public function sessionUplink()
    {
        $data = $this->getJsonInput();

        $sessions = $data["sessions"] ?? [];
        // log the request in the error logs
        error_log("Received session uplink: " . json_encode($sessions));

        if (empty($sessions)) {
            $this->json([
                "success" => false,
                "message" => "No batch data"
            ], 400);
        }


        try{
            $synced_local_ids = $this->s->syncAttendanceSession($sessions);
            $this->json([
                "success" => true,
                "synced_local_ids" => $synced_local_ids
            ]);
        } catch (Throwable $e) {
            $this->json([
                "success"=> false,
                "message"=> $e->getMessage(),
                "type"=> get_class($e)
            ], 500);
        }
    }

    public function summaryUplink()
    {
        $data = $this->getJsonInput();

        $summaries = $data["summaries"] ?? [];
        // log the request in the error logs (debugging)
        error_log("Received summary uplink: " . json_encode($summaries));

        if (empty($summaries)) {
            $this->json([
                "success" => false,
                "message" => "No batch data"
            ], 400);
        }

        try{
            $result = $this->s->syncAttendanceSummary($summaries);
            if ($result) {
                $this->json([
                    "success" => true,
                    "message" => "Summaries synced successfully"
                ]);
            } else {
                $this->json([
                    "success" => false,
                    "message" => "Failed to sync summaries"
                ], 500);
            }
        } catch (Throwable $e) {
            $this->json([
                "success"=> false,
                "message"=> $e->getMessage(),
                "type"=> get_class($e)
            ], 500);
        }
    }

    public function userTemplatesUplink()
    {
        $data = $this->getJsonInput();

        $users = $data["users"] ?? [];

        if (empty($users)) {
            $this->json([
                "success" => false,
                "message" => "No batch data"
            ], 400);
        }

        try{
            $syncIds = $this->s->syncUserTemplates($users);
            if (!empty($syncIds)) {
                $this->json([
                    "success" => true,
                    "message" => "User templates synced successfully",
                    "synced_user_ids" => $syncIds
                ]);
            } else {
                $this->json([
                    "success" => false,
                    "message" => "Failed to sync user templates"
                ], 500);
            }
        } catch (Throwable $e) {
            $this->json([
                "success"=> false,
                "message"=> $e->getMessage(),
                "type"=> get_class($e)
            ], 500);
        }
    }
}
