<?php
namespace App\Modules\Groups\Controllers;

use App\Core\Controller;
use App\Modules\Groups\Models\GroupModel;
use Throwable;

class GroupController extends Controller {
    private GroupModel $g;
    public function __construct()
    {
        $this->g = new GroupModel();
    }

    public function store() {
        $data = $this->getJsonInput();

        $this->g->setBranchId($data["branch_id"]);
        $this->g->setGroupTypeId($data["grouptype_id"]);
        $this->g->setName($data["name"]);
        $this->g->setExpectedWeeklyHours($data["expected_weekly_hours"] ?? 40);
        $this->g->setAbsenseThreshold($data["absence_threshold"] ?? 0);

        try{
            $this->g->save($data["supervisors"], $data["members"]);

            $this->json([
                "success" => true,
                "message" => "Operation was successfull"
            ]);
        }catch(\Throwable $e){
            $this->json([
                "success" => false,
                "message"=> $e->getMessage(),
                "type" => get_class($e) // helpful for debugging
            ], $e->getCode() ? : 500);
        }
    }

    public function index()
    {
        $data = $this->getJsonInput();

        $branchId = (int)$data["branch_id"] ?? 0;
        $groupId = (int)$data["group_id"] ?? 0;

        try{
            $result = $this->g->fetch($groupId,$branchId);
            $this->json([
                "success"=> true,
                "data"=> $result
            ]);
        }catch(Throwable $e) {
            $this->json([
                "success"=> false,
                "message"=> $e->getMessage(),
                "type"=> get_class($e)
            ]);
        }
    }

    public function edit() {
        $data = $this->getJsonInput();
        $id = (int)($data["id"] ?? 0);

        if ($id < 0){
            $this->json([
                "success"=> false,
                "message"=> "Invalid group"
            ]);
        }

        $this->g->setBranchId($data["branch_id"]);
        $this->g->setGroupTypeId($data["grouptype_id"]);
        $this->g->setName($data["name"]);
        $this->g->setExpectedWeeklyHours($data["expected_weekly_hours"] ?? 40);
        $this->g->setAbsenseThreshold($data["absence_threshold"] ?? 0);
        $this->g->setId($id);

        try{
            $this->g->update($data["supervisors"], $data["members"]);

            $this->json([
                "success" => true,
                "message" => "Update was successfull"
            ]);
        }catch(Throwable $e){
            $this->json([
                "success" => false,
                "message"=> $e->getMessage(),
                "type" => get_class($e) // helpful for debugging
            ], $e->getCode() ? : 500);
        }
    }

    public function delete(int $groupId)
    {
        $groupdId = (int)($groupId ?? 0);

        if ($groupdId < 0) {
            $this->json([
                "success"=> false,
                "message"=> "Invalid request"
            ]);
        }

        try {
            if ($this->g->delete($groupId)) { 
                $this->json([
                    "success"=> true,
                    "message"=> "Group ID ".$groupId." was successfully deleted"
                ]);
            }
        } catch (Throwable $e) {
            $this->json([
                "success" => false,
                "message"=> $e->getMessage(),
                "type" => get_class($e) // helpful for debugging
            ], $e->getCode() ? : 500);
        }
    }
}
