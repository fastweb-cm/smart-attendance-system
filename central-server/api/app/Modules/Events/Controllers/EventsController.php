<?php
namespace App\Modules\Events\Controllers;

use App\Core\Controller;
use App\Modules\Events\Models\EventsModel;
use DateTime;
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
        $data = $this->getJsonInput();

        $eventId = (int)($data["id"] ?? 0);

        try {
            $result = $this->ev->fetch($eventId);

            $this->json([
                "success" => true,
                "data" => $result
            ]);
        } catch (Throwable $e) {
            $this->json([
                "success" => false,
                "message" => $e->getMessage(),
                "type" => get_class($e)
            ]);
        }
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
                "message" => "Event created successfully"
            ]);
        } catch (Throwable $e) {
            $this->json([
                "success" => false,
                "message" => $e->getMessage(),
                "type" => get_class($e)
            ]);
        }
    }

    public function edit(): void
    {
        $data = $this->getJsonInput();
        $id = (int)($data["id"] ?? 0);


        if ($id <= 0) {
            $this->json([
                "success" => false,
                "message"=> "Event ID is required"
            ]);
        }

        $date = new DateTime();
        $updated_at = $date->format('Y-m-d H:i:s');


        $this->ev->setId($id);
        $this->ev->setName($data["name"]);
        $this->ev->setStartDatetime($data["start_datetime"]);
        $this->ev->setEndDatetime($data["end_datetime"]);
        $this->ev->setAffectsAttendance((int)$data["affects_attendance"] ?? 1);
        $this->ev->setCreatedBy((int)$data["created_by"] ?? null);
        $this->ev->setHandshake((string)($data["handshake"]) ?? '1');
        $this->ev->setUpdatedAt($updated_at);

        try {
            $this->ev->update($data["access_policy"], $data["check_in_out_range"]);

            $this->json([
                "success" => true,
                "message" => "Event Updated Successfully"
            ]);
        } catch (Throwable $e) {
            $this->json([
                "success"=> false,
                "message"=> $e->getMessage(),
                "type" => get_class($e)
            ]);
        }
    }

    public function delete(int $id)
    {
        try {
            $this->ev->delete($id);

            $this->json([
                "success" => true,
                "message" => "Event deleted successfully"
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
