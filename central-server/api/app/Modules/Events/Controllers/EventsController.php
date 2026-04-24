<?php
namespace App\Modules\Events\Controllers;

use App\Core\Controller;
use App\Modules\Events\Models\EventsModel;
use Throwable;

class EventsController extends Controller
{
    private EventsModel $ev;

    public function __construct()
    {
        $this->ev = new EventsModel();
    }

    public function index()
    {

    }

    public function store()
    {
        $data = $this->getJsonInput();

        $this->ev->setName($data["name"]);
        $this->ev->setStartDatetime($data["start_datetime"]);
        $this->ev->setEndDatetime($data["end_datetime"]);
        $this->ev->setAffectsAttendance((int)$data["affects_attendance"] ?? 1);
        $this->ev->setCreatedBy((int)$data["created_by"] ?? null);
        $this->ev->setHandshake((string)($data["handshake"]) ?? '1');


        try {
            $this->ev->save($data["access_policy"], $data["check_in_out_range"]);

            $this->json([
                "success" => true,
                "message" => "Event created successfully",
                "user_id" => count($data["access_policy"])
            ]);
        } catch (Throwable $e) {
            $this->json([
                "success" => false,
                "message" => $e->getMessage(),
                "type" => get_class($e)
            ]);
        }
    }
}
