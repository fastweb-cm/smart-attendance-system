<?php

namespace App\Modules\Permission\Controllers;

use App\Core\Controller;
use App\Modules\Permission\Models\PermissionModel;
use Throwable;

class PermissionController extends Controller
{
    private PermissionModel $p;

    public function __construct()
    {
        $this->p = new PermissionModel();
    }

    /**
     * Fetch Single Request Data
     */
    public function index()
    {
        $permissionId = (int)($_GET['id'] ?? 0);

        try {
            $result = $this->p->findById($permissionId);
            $this->json([
                "success" => true,
                "data"    => $result
            ]);
        } catch (Throwable $e) {
            $this->json([
                "success" => false,
                "message" => $e->getMessage(),
                "type"    => get_class($e)
            ]);
        }
    }

    /**
     * Handle Creation & Updates
     */
    public function store()
    {
        $data = $this->getJsonInput();

        $this->p->setId(isset($data["id"]) ? (int)$data["id"] : null);
        $this->p->setPermissionTypeId((int)$data["permission_type_id"]);
        $this->p->setUserId((int)$data["user_id"]);
        $this->p->setInitiatedBy(isset($data["initiatedby"]) ? (int)$data["initiatedby"] : null);
        $this->p->setReason($data["reason"] ?? null);
        $this->p->setStartDate($data["start_date"]);
        $this->p->setEndDate($data["end_date"]);
        $this->p->setStatus($data["status"] ?? 'pending');
        $this->p->setAdditionalProof($data["additional_proof"] ?? null);
        $this->p->setRequestedAt(date("Y-m-d H:i:s"));

        if ((int)($data["user_id"] ?? 0) === 0 || (int)($data["permission_type_id"] ?? 0) === 0) {
            $this->json([
                "success" => false,
                "message" => "user_id and permission_type_id parameters are required integers.",
            ],400);
            return;
        }

        try {
            $this->p->upsert();
            $message = isset($data["id"]) ? "Permission request updated successfully" : "Permission request created successfully";

            $this->json([
                "success" => true,
                "message" => $message,
            ]);
        } catch (Throwable $e) {
            $this->json([
                "success" => false,
                "message" => $e->getMessage(),
                "type"    => get_class($e)
            ],500);
        }
    }

    /**
     * Review Workflow Process (Approve / Reject)
     */
    public function review()
    {
        $data = $this->getJsonInput();

        $permissionId = (int)($data['permission_id'] ?? 0);
        $approverId = (int)($data['approver_id'] ?? 0);
        $status = $data['status'] ?? ''; // 'approved' or 'rejected'
        $remark = $data['remark'] ?? null;

        if ($permissionId === 0 || $approverId === 0 || !in_array($status, ['approved', 'rejected'])) {
            $this->json([
                "success" => false,
                "message" => "Invalid entry tracking params configuration inputs for review.",
            ],400);
            return;
        }

        try {
            $this->p->setId($permissionId);
            $this->p->processApproval($approverId, $status, $remark);

            $this->json([
                "success" => true,
                "message" => "Permission tracking target marked as " . $status . " successfully.",
            ]);
        } catch (Throwable $e) {
            $this->json([
                "success" => false,
                "message" => $e->getMessage(),
                "type"    => get_class($e)
            ],500);
        }
    }

    /**
     * Delete Handler
     */
    public function delete(int $id)
    {
        if ($id <= 0) {
            $this->json([
                "success" => false,
                "message" => "permission id tracking variable validation exception.",
            ],400);
            return;
        }

        try {
            $this->p->delete($id);
            $this->json([
                "success" => true,
                "message" => "Permission request canceled and removed successfully.",
            ]);
        } catch (Throwable $e) {
            $this->json([
                "success" => false,
                "message" => $e->getMessage(),
                "type"    => get_class($e)
            ],500);
        }
    }

    /**
     * Filtered Dataset View
     */
public function all()
{
    $filters = [
        'search' => $_GET['search'] ?? null, // Captures text string inputs
        'status' => $_GET['status'] ?? null
    ];

    $page = isset($_GET['page']) ? (int)$_GET['page'] : 1;
    $limit = isset($_GET['limit']) ? (int)$_GET['limit'] : 10;

    try {
        $result = $this->p->findAll($filters, $page, $limit);
        $this->json([
            "success" => true,
            "meta"    => $result['pagination'],
            "data"    => $result['data']
        ]);
    } catch (Throwable $e) {
        $this->json([
            "success" => false,
            "message" => $e->getMessage(),
            "type"    => get_class($e)
        ], 500);
    }
}

    /**
     * Fetch Lookup Configuration Data
     */
    public function types()
    {
        try {
            $result = $this->p->fetchLookupTypes();
            $this->json([
                "success" => true,
                "data"    => $result
            ]);
        } catch (Throwable $e) {
            $this->json([
                "success" => false,
                "message" => $e->getMessage(),
                "type"    => get_class($e)
            ],500);
        }
    }
}
