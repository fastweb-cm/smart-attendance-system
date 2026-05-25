<?php

namespace App\Modules\Permission\Models;

use App\Core\Database;
use App\Core\Logger;
use Throwable;

class PermissionModel extends Database
{
    protected Database $db;
    private ?int $id = null;

    private int $permission_type_id;
    private int $user_id;
    private ?int $initiatedby = null;
    private ?string $reason = null;
    private string $start_date;
    private string $end_date;
    private string $status = 'pending';
    private ?string $additional_proof = null;
    private ?string $requested_at = null;

    public function __construct()
    {
        $this->db = Database::connect();
    }

    // Getters
    public function getId(): ?int { return $this->id; }
    public function getPermissionTypeId(): int { return $this->permission_type_id; }
    public function getUserId(): int { return $this->user_id; }
    public function getInitiatedBy(): ?int { return $this->initiatedby; }
    public function getReason(): ?string { return $this->reason; }
    public function getStartDate(): string { return $this->start_date; }
    public function getEndDate(): string { return $this->end_date; }
    public function getStatus(): string { return $this->status; }
    public function getAdditionalProof(): ?string { return $this->additional_proof; }
    public function getRequestedAt(): ?string { return $this->requested_at; }

    // Setters
    public function setId(?int $id): void { $this->id = $id; }
    public function setPermissionTypeId(int $permission_type_id): void { $this->permission_type_id = $permission_type_id; }
    public function setUserId(int $user_id): void { $this->user_id = $user_id; }
    public function setInitiatedBy(?int $initiatedby): void { $this->initiatedby = $initiatedby; }
    public function setReason(?string $reason): void { $this->reason = $reason; }
    public function setStartDate(string $start_date): void { $this->start_date = $start_date; }
    public function setEndDate(string $end_date): void { $this->end_date = $end_date; }
    public function setStatus(string $status): void { $this->status = $status; }
    public function setAdditionalProof(?string $additional_proof): void { $this->additional_proof = $additional_proof; }
    public function setRequestedAt(?string $requested_at): void { $this->requested_at = $requested_at; }

    /**
     * Upsert a permission request entry block
     */
    public function upsert(): bool
    {
        try {
            $isNewInsert = (is_null($this->id) || $this->id === 0);

            // If updating, prevent alterations if request is no longer pending
            if (!$isNewInsert) {
                $current = $this->findById($this->id);
                if ($current && $current['status'] !== 'pending') {
                    throw new \Exception("Cannot modify permission request records after they are processed.");
                }
            }

            $sql = "INSERT INTO tbl_permission (id, permission_type_id, user_id, initiatedby, reason, start_date, end_date, status, additional_proof, requested_at) 
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                    ON DUPLICATE KEY UPDATE 
                        permission_type_id = VALUES(permission_type_id),
                        reason = VALUES(reason),
                        start_date = VALUES(start_date),
                        end_date = VALUES(end_date),
                        additional_proof = VALUES(additional_proof)";
                    
            $params = [
                $this->id,
                $this->permission_type_id,
                $this->user_id,
                $this->initiatedby,
                $this->reason,
                $this->start_date,
                $this->end_date,
                $this->status,
                $this->additional_proof ?? null,
                $this->requested_at
            ];
            
            $this->db->query($sql, $params);
            
            $insertId = $this->db->lastInsertId();
            $this->id = ($insertId > 0) ? $insertId : $this->id;

            // -----------------------------------------------------------------
            // SYSTEM AUDIT LOG
            // -----------------------------------------------------------------
            $action = $isNewInsert ? 'permission_create' : 'permission_update';
            $logMsg = $isNewInsert 
                ? sprintf("User ID %d initiated a new permission request from %s to %s", $this->user_id, $this->start_date, $this->end_date)
                : sprintf("User updated details for pending permission request ID: %d", $this->id);

            Logger::log('system', 'info', $logMsg, null, [
                'permission_id' => $this->id,
                'user_id'       => $this->user_id,
                'action'        => $action
            ]);

            return true;
        } catch (Throwable $e) {
            throw $e;
        }
    }

    /**
     * Process administrative review and insert tracking receipt log (Wrapped Transaction)
     */
    public function processApproval(int $approverId, string $status, ?string $remark): bool
    {
        $this->db->beginTransaction();

        try {
            // 1. Insert tracking log to tbl_permission_approval
            $approvalSql = "INSERT INTO tbl_permission_approval (permission_id, approver_id, remark) VALUES (?, ?, ?)";
            $this->db->query($approvalSql, [$this->id, $approverId, $remark]);

            // 2. Cascade state modification back to core tracking document mapping
            $updateSql = "UPDATE tbl_permission SET status = ? WHERE id = ?";
            $this->db->query($updateSql, [$status, $this->id]);

            $this->db->commit();

            // -----------------------------------------------------------------
            // SYSTEM AUDIT LOG
            // -----------------------------------------------------------------
            Logger::log('system', 'info', sprintf("Admin ID %d updated status of permission ID %d to '%s'", $approverId, $this->id, $status), null, [
                'permission_id' => $this->id,
                'approver_id'   => $approverId,
                'status'        => $status,
                'action'        => 'permission_review'
            ]);

            return true;
        } catch (Throwable $e) {
            $this->db->rollback();
            throw $e;
        }
    }

    public function delete(int $id): bool
    {
        try {
            // Safeguard: Only allow deleting pending records
            $sql = "DELETE FROM tbl_permission WHERE id = ? AND status = 'pending'";
            $this->db->query($sql, [$id]);

            // -----------------------------------------------------------------
            // SYSTEM AUDIT LOG
            // -----------------------------------------------------------------
            Logger::log('system', 'info', sprintf("Dropped pending permission request reference ID: %d from indexes", $id), null, [
                'permission_id' => $id, 
                'action'        => 'permission_delete'
            ]);

            return true;
        } catch (Throwable $e) {
            throw $e;
        }
    }

    public function findById(int $id): ?array
    {
        try {
            $sql = "SELECT p.*, lk.name AS permission_type_name,
                    CONCAT(u.fname, ' ', u.lname) AS employee_name
                    FROM tbl_permission p
                    INNER JOIN lkup_permission lk ON p.permission_type_id = lk.id
                    INNER JOIN tbl_user u ON p.user_id = u.id
                    WHERE p.id = ?";
            $result = $this->db->query($sql, [$id]);
            return $result ? $result->fetch_assoc() : null;
        } catch (Throwable $e) {
            throw $e;
        }
    }

public function findAll(array $filters = [], int $page = 1, int $limit = 10): array
{
    try {
        $where = [];
        $params = [];

        // Dynamic Text Search on Employee Name (First Name or Last Name)
        if (!empty($filters['search'])) {
            $where[] = "(u.fname LIKE ? OR u.lname LIKE ?)";
            $searchTerm = "%" . $filters['search'] . "%";
            $params[] = $searchTerm;
            $params[] = $searchTerm;
        }
        
        if (!empty($filters['status'])) {
            $where[] = "p.status = ?";
            $params[] = $filters['status'];
        }

        $whereClause = !empty($where) ? " AND " . implode(" AND ", $where) : "";

        // 1. Calculate count matching search parameters
        // Note: INNER JOIN tbl_user u is included here so the name search clauses resolve safely
        $countSql = "SELECT COUNT(*) as total 
                     FROM tbl_permission p 
                     INNER JOIN tbl_user u ON p.user_id = u.id 
                     WHERE 1=1 $whereClause";
                     
        $countResult = $this->db->query($countSql, $params);
        $totalRows = $countResult ? (int)$countResult->fetch_assoc()['total'] : 0;

        // 2. Clamp bounds
        $totalPages = $totalRows > 0 ? ceil($totalRows / $limit) : 1;
        $page = max(1, min($page, $totalPages));
        $offset = ($page - 1) * $limit;

        // 3. Extract paginated dataset chunk
        $sql = "SELECT p.*, lk.name AS permission_type_name,
                CONCAT(u.fname, ' ', u.lname) AS employee_name,
                CONCAT(i.fname, ' ', i.lname) AS initiator_name,
                app.remark AS closing_remark,
                CONCAT(appr.fname, ' ', appr.lname) AS approver_name,
                app.date_approved
                FROM tbl_permission p
                INNER JOIN lkup_permission lk ON p.permission_type_id = lk.id
                INNER JOIN tbl_user u ON p.user_id = u.id
                LEFT JOIN tbl_user i ON p.initiatedby = i.id
                LEFT JOIN tbl_permission_approval app ON p.id = app.permission_id
                LEFT JOIN tbl_user appr ON app.approver_id = appr.id 
                WHERE 1=1 $whereClause
                ORDER BY p.id DESC
                LIMIT ? OFFSET ?";
        
        $finalParams = array_merge($params, [$limit, $offset]);
        $result = $this->db->query($sql, $finalParams);
        $rows = $result ? $result->fetch_all(MYSQLI_ASSOC) : [];

        return [
            'data' => $rows,
            'pagination' => [
                'total_records' => $totalRows,
                'total_pages'   => $totalPages,
                'current_page'  => $page,
                'limit'         => $limit
            ]
        ];
    } catch (Throwable $e) {
        throw $e;
    }
}

    public function fetchLookupTypes(): array
    {
        try {
            $sql = "SELECT id, name, description FROM lkup_permission ORDER BY name ASC";
            $result = $this->db->query($sql);
            return $result ? $result->fetch_all(MYSQLI_ASSOC) : [];
        } catch (Throwable $e) {
            throw $e;
        }
    }
}
