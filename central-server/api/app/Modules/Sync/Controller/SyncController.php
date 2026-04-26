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
                "last_sync_time" => $syncData["last_sync_time"]
            ]);
        }catch(Throwable $e) {
            $this->json([
                "success"=> false,
                "message"=> $e->getMessage(),
                "type"=> get_class($e)
            ]);
        }
    }
}
