<?php
namespace App\Modules\Branch\Models;

use App\Core\Database;
use App\Core\Logger;

class BranchModel extends Database {
    protected Database $db;

    private ?int $id = null;
    private string $name;
    private ?string $location = null;
    private ?string $description = null;
    private ?string $status = 'active';

    public function __construct()
    {
        $this->db = Database::connect();
    }

    // =======================
    // Getters and Setters
    // =======================
    public function getId(): ?int { return $this->id; }
    public function setId(int $id): void { $this->id = $id; }
    public function getName(): string { return $this->name; }
    public function setName(string $name): void { $this->name = $name; }
    public function getLocation(): ?string { return $this->location; }
    public function setLocation(?string $location): void { $this->location = $location; }
    public function getDescription(): ?string { return $this->description; }
    public function setDescription(?string $description): void { $this->description = $description; }
    public function getStatus(): string { return $this->status; }
    public function setStatus(?string $status): void { $this->status = $status; }

    public function create(array $admins): bool
    {
        try {
            $this->db->beginTransaction();

            $sqlbranch = "INSERT INTO tbl_branch (name, location, description, status) VALUES (?, ?, ?, ?)";
            $paramsBranch = [
                $this->name,
                $this->location,
                $this->description ?? null,
                $this->status
            ];

            $this->db->query($sqlbranch, $paramsBranch);
            $this->id = $this->db->lastInsertId();

            if (!empty($admins)) {
                foreach ($admins as $admin) {
                    $sql = "INSERT INTO tbl_branch_admins (user_id, branch_id) VALUES (?, ?)";
                    $params = [$admin["user_id"], $this->id];
                    $this->db->query($sql, $params);
                }
            }

            $this->db->commit();

            // -----------------------------------------------------------------
            // SYSTEM AUDIT LOG
            // -----------------------------------------------------------------
            Logger::log(
                'system', 
                'info', 
                sprintf("Admin created new operational branch: '%s' (ID: %d) at %s", $this->name, $this->id, $this->location ?? 'N/A'),
                null,
                ['branch_id' => $this->id, 'name' => $this->name, 'action' => 'branch_create']
            );

            return true;
        } catch (\Throwable $e) {
            $this->db->rollback();
            // Re-throw so it bubbles up to Router.php global logger automatically
            throw $e;
        }
    }

    public function fetch(int $branchId = 0): array
    {
        // Read-only metrics do not require audit modification log injections
        $sqlBranch = "SELECT * FROM tbl_branch";
        $params = [];

        if ($branchId > 0) {
            $sqlBranch .= " WHERE id = ?";
            $params = [$branchId];
        }

        $branchResult = $this->db->query($sqlBranch, $params);

        if (!$branchResult || $branchResult->num_rows === 0) {
            return [];
        }

        $branches = $branchResult->fetch_all(MYSQLI_ASSOC);

        $branchIds = array_column($branches, 'id');
        $placeholders = implode(',', array_fill(0, count($branchIds), '?'));
        $sqlAdmins = "SELECT ba.branch_id, u.id AS user_id, u.fname, u.lname
                    FROM tbl_branch_admins ba
                    JOIN tbl_user u ON ba.user_id = u.id
                    WHERE ba.branch_id IN ($placeholders)";

        $adminResult = $this->db->query($sqlAdmins, $branchIds);

        $admins = [];
        if ($adminResult && $adminResult->num_rows > 0) {
            foreach ($adminResult->fetch_all(MYSQLI_ASSOC) as $admin) {
                $admins[$admin['branch_id']][] = $admin;
            }
        }

        foreach ($branches as &$branch) {
            $branch['admins'] = $admins[$branch['id']] ?? [];
        }

        return $branches;
    }

    public function delete(int $id): bool {
        try {
            $this->db->beginTransaction();

            $this->db->query("DELETE FROM tbl_branch_admins WHERE branch_id = ?", [$id]);
            $this->db->query("DELETE FROM tbl_branch WHERE id = ?", [$id]);

            $this->db->commit();

            // -----------------------------------------------------------------
            // SYSTEM AUDIT LOG
            // -----------------------------------------------------------------
            Logger::log(
                'system', 
                'info', 
                sprintf("Admin deleted branch ID: %d and unlinked all administrative managers", $id),
                null,
                ['branch_id' => $id, 'action' => 'branch_delete']
            );

            return true;
        } catch (\Throwable $e) {
            $this->db->rollback();
            throw $e;
        }
    }

    public function update(array $admins = []): bool
    {
        if (is_null($this->id)) {
            throw new \RuntimeException("Branch ID is required for update.");
        }

        try {
            $this->db->beginTransaction();

            $sqlBranch = "UPDATE tbl_branch SET name = ?, location = ?, description = ?, status = ? WHERE id = ?";
            $paramsBranch = [
                $this->name,
                $this->location,
                $this->description,
                $this->status,
                $this->id
            ];
            $this->db->query($sqlBranch, $paramsBranch);

            if (!empty($admins)) {
                $this->db->query("DELETE FROM tbl_branch_admins WHERE branch_id = ?", [$this->id]);

                foreach ($admins as $admin) {
                    $sqlAdmin = "INSERT INTO tbl_branch_admins (user_id, branch_id) VALUES (?, ?)";
                    $paramsAdmin = [$admin['user_id'], $this->id];
                    $this->db->query($sqlAdmin, $paramsAdmin);
                }
            }

            $this->db->commit();

            // -----------------------------------------------------------------
            // SYSTEM AUDIT LOG
            // -----------------------------------------------------------------
            Logger::log(
                'system', 
                'info', 
                sprintf("Admin updated branch configuration metrics for '%s' (ID: %d)", $this->name, $this->id),
                null,
                ['branch_id' => $this->id, 'name' => $this->name, 'action' => 'branch_update']
            );

            return true;
        } catch (\Throwable $e) {
            $this->db->rollback();
            throw $e;
        }
    }

    public function fetchBranches(): array
    {
        $sql = "SELECT id, name from tbl_branch";
        $res = $this->db->query($sql, []);
        return $res && $res->num_rows > 0 ? $res->fetch_all(MYSQLI_ASSOC) : [];
    }
}
