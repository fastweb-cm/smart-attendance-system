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

    /**
     * GET /api/v1/groups
     */
    public function index(): void
    {
        $queryParams = $this->getQueryParams();
        $page  = isset($queryParams['page']) ? max(1, (int)$queryParams['page']) : 1;
        $limit = isset($queryParams['limit']) ? max(1, (int)$queryParams['limit']) : 10;

        try {
            $result = $this->g->fetch($page, $limit);
            $total = $result['total'];

            $this->json([
                "success" => true,
                "data"    => $result['data'],
                "meta"    => [
                    "total_records" => $total,
                    "current_page"  => $page,
                    "total_pages"   => $limit > 0 ? (int)ceil($total / $limit) : 1,
                    "limit"         => $limit
                ]
            ]);
        } catch (\Throwable $e) {
            $this->json([
                "success" => false,
                "message" => $e->getMessage(),
                "type"    => get_class($e)
            ], 500);
        }
    }

    /**
     * GET /api/v1/groups/{id}/members
     */
    public function members(int $id): void
    {
        if ($id <= 0) {
            $this->json([
                "success" => false,
                "message" => "Invalid group ID."
            ], 400);
            return;
        }

        try {
            $data = $this->g->getGroupMembersDetail($id);

            if ($data === null) {
                $this->json([
                    "success" => false,
                    "message" => "Group not found."
                ], 404);
                return;
            }

            $this->json([
                "success" => true,
                "data"    => $data
            ]);
        } catch (\Throwable $e) {
            $this->json([
                "success" => false,
                "message" => $e->getMessage(),
                "type"    => get_class($e)
            ], 500);
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

    public function getAuthPolicies()
    {
        $authPolicies = $this->g->fetchGroupsAndCorrespondingSubgroups();
        $this->json($authPolicies);
    }

    public function groupTypes()
    {
        $groupTypes = $this->g->fetchGroupTypes();

        $this->json([
            "success" => true,
            "data" => $groupTypes
        ]);
    }

    /**
     * POST /api/v1/groups/{id}/members
     */
    public function addMember(int $id): void
    {
        $data = $this->getJsonInput();
        $userId = (int)($data['user_id'] ?? 0);
        $role = $data['role'] ?? 'member';

        if ($id <= 0 || $userId <= 0) {
            $this->json([
                "success" => false,
                "message" => "Invalid group ID or user ID."
            ], 400);
            return;
        }

        try {
            if ($role === 'supervisor') {
                $this->g->addSupervisor($id, $userId);
            } else {
                $this->g->addMember($id, $userId);
            }

            $this->json([
                "success" => true,
                "message" => sprintf("User added as %s successfully", $role)
            ]);
        } catch (Throwable $e) {
            $this->json([
                "success" => false,
                "message" => $e->getMessage(),
                "type"    => get_class($e)
            ], $e->getCode() ?: 500);
        }
    }

    /**
     * DELETE /api/v1/groups/{id}/members/{userId}?role=member
     */
    public function removeMember(int $id, int $userId): void
    {
        $queryParams = $this->getQueryParams();
        $role = $queryParams['role'] ?? 'member';

        if ($id <= 0 || $userId <= 0) {
            $this->json([
                "success" => false,
                "message" => "Invalid group ID or user ID."
            ], 400);
            return;
        }

        try {
            if ($role === 'supervisor') {
                $this->g->removeSupervisor($id, $userId);
            } else {
                $this->g->removeMember($id, $userId);
            }

            $this->json([
                "success" => true,
                "message" => sprintf("User removed as %s successfully", $role)
            ]);
        } catch (Throwable $e) {
            $this->json([
                "success" => false,
                "message" => $e->getMessage(),
                "type"    => get_class($e)
            ], $e->getCode() ?: 500);
        }
    }
}
