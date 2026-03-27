<?php
namespace App\Modules\Terminals\Models;

use App\Core\Database;

class TerminalModel
{
    protected Database $db;

    private ?int $id = null;
    private string $name;
    private string $slug;
    private string $activation_code;
    private ?int $branch_id = null;
    private string $status = 'pending'; // Matches ENUM default
    private ?string $date_created = null;

    public function __construct()
    {
        $this->db = Database::connect();
    }

    // ==========================================
    // Getters
    // ==========================================
    public function getId(): ?int { return $this->id; }
    public function getName(): string { return $this->name; }
    public function getSlug(): string { return $this->slug; }
    public function getActivationCode(): string { return $this->activation_code; }
    public function getBranchId(): ?int { return $this->branch_id; }
    public function getStatus(): string { return $this->status; }
    public function getDateCreated(): ?string { return $this->date_created; }

    // ==========================================
    // Setters
    // ==========================================
    public function setId(int $id): void { $this->id = $id; }
    
    public function setName(string $name): void { 
        $this->name = $name; 
        // Automatically generate slug if not already set
        if (empty($this->slug)) {
            $this->setSlug($this->generateSlug($name));
        }
    }

    public function setSlug(string $slug): void { 
        $this->slug = strtolower(trim(preg_replace('/[^A-Za-z0-9-]+/', '-', $slug))); 
    }

    public function setActivationCode(string $code): void { $this->activation_code = $code; }
    public function setBranchId(?int $id): void { $this->branch_id = $id; }
    
    public function setStatus(string $status): void { 
        $validStatuses = ['pending', 'active', 'revoked'];
        if (in_array($status, $validStatuses)) {
            $this->status = $status;
        }
    }

    public function save(array $authCapabilities, array $accessPolicy): bool {
        try{
            $this->db->beginTransaction();

            $sqlTerm = "INSERT INTO tbl_terminal (name,slug,activation_code,branch_id,status)
            VALUES(?,?,?,?,?)";

            $activationCode = $this->generateSecureCode();
            $this->setActivationCode($activationCode);

            $paramsTerm = [
                $this->name,
                $this->slug,
                password_hash($activationCode, PASSWORD_DEFAULT),
                $this->branch_id,
                $this->status
            ];

            $this->db->query($sqlTerm, $paramsTerm);
            $this->id = $this->db->lastInsertId();

            // now let add the terminal capabilities and access policy
            if($this->id > 0){
                // handle auth capabilities
                if(!empty($authCapabilities)){
                    $this->bulkInsertCapabilities($authCapabilities);
                }

                // handle access policy
                if (!empty($accessPolicy)) {
                    $this->bulkInsertPolicies($accessPolicy);
                }
            }

            $this->db->commit();
            return true;
        } catch(\Throwable $e) {
            $this->db->rollBack();
            throw $e;
        }
    }

    public function update(array $authCapabilities, array $accessPolicy): bool 
    {
        try {
            $this->db->beginTransaction();

            // Update the main terminal record
            // We typically don't update activation_code or slug here
            $sql = "UPDATE tbl_terminal 
                    SET name = ?, slug = ?, branch_id = ?, status = ? 
                    WHERE id = ?";
        
            $this->db->query($sql, [
                $this->getName(),
                $this->getSlug(),
                $this->getBranchId(),
                $this->getStatus(),
                $this->getId()
            ]);

            // Sync Auth Capabilities (Delete old, Insert new)
            $this->db->query("DELETE FROM tbl_terminal_auth_capability WHERE terminal_id = ?", [$this->id]);
            if (!empty($authCapabilities)) {
                $this->bulkInsertCapabilities($authCapabilities);
            }

            // Sync Access Policies (Delete old, Insert new)
            $this->db->query("DELETE FROM tbl_terminal_access_policy WHERE terminal_id = ?", [$this->id]);
            if (!empty($accessPolicy)) {
                $this->bulkInsertPolicies($accessPolicy);
            }

            $this->db->commit();
            return true;

        } catch (\Throwable $e) {
            $this->db->rollback();
            throw $e;
        }
    }

    /**
    * Fetch terminals with their capabilities and access policies
    */
    public function fetch(int $branchId = 0, int $terminalId = 0, string $status = ''): array
    {
        // Build the main Terminal query dynamically
        $sqlTerminals = "SELECT * FROM tbl_terminal";
        $where = [];
        $params = [];

        if ($branchId > 0) {
            $where[] = "branch_id = ?";
            $params[] = $branchId;
        }

        if ($terminalId > 0) {
            $where[] = "id = ?";
            $params[] = $terminalId;
        }

        if (!empty($status)) {
            $where[] = "status = ?";
            $params[] = $status;
        }

        if (!empty($where)) {
            $sqlTerminals .= " WHERE " . implode(" AND ", $where);
        }

        $terminalResult = $this->db->query($sqlTerminals, $params);

        if (!$terminalResult || $terminalResult->num_rows === 0) {
            return [];
        }

        $terminals = $terminalResult->fetch_all(MYSQLI_ASSOC);
        $terminalIds = array_column($terminals, 'id');
        $placeholders = implode(',', array_fill(0, count($terminalIds), '?'));

        // Fetch all Auth Capabilities for these terminals
        // JOINing with a hypothetical tbl_auth_type to get the human-readable name
        $sqlCaps = "SELECT tc.*, at.name as auth_type_name 
                    FROM tbl_terminal_auth_capability tc
                    LEFT JOIN lkup_auth_type at ON tc.auth_type_id = at.id
                    WHERE tc.terminal_id IN ($placeholders)";
    
        $capResult = $this->db->query($sqlCaps, $terminalIds);
        $capsByTerminal = [];
        if ($capResult && $capResult->num_rows > 0) {
            foreach ($capResult->fetch_all(MYSQLI_ASSOC) as $cap) {
                $capsByTerminal[$cap['terminal_id']][] = $cap;
            }
        }

        // 3. Fetch all Access Policies for these terminals
        // JOINing with tbl_group to show which group the policy applies to
        $sqlPolicies = "SELECT tp.*, g.name as group_name, at.name as auth_type_name
                        FROM tbl_terminal_access_policy tp
                        LEFT JOIN tbl_group g ON tp.group_id = g.id
                        LEFT JOIN lkup_auth_type at ON tp.auth_type_id = at.id
                        WHERE tp.terminal_id IN ($placeholders)";
    
        $polResult = $this->db->query($sqlPolicies, $terminalIds);
        $polsByTerminal = [];
        if ($polResult && $polResult->num_rows > 0) {
            foreach ($polResult->fetch_all(MYSQLI_ASSOC) as $pol) {
                $polsByTerminal[$pol['terminal_id']][] = $pol;
            }
        }

        // 4. Map relationships back to the terminals
        foreach ($terminals as &$terminal) {
            $terminal['auth_capabilities'] = $capsByTerminal[$terminal['id']] ?? [];
            $terminal['access_policy'] = $polsByTerminal[$terminal['id']] ?? [];
        }

        return $terminals;
    }

    /**
    * Delete a terminal and all its associated relationships
    * @return bool
    */
    public function delete(): bool
    {
        if (!$this->id) {
            throw new \Exception("Terminal ID is required for deletion.");
        }

        try {
            $this->db->beginTransaction();

            // 1. Delete Child Records First
            $this->db->query("DELETE FROM tbl_terminal_auth_capability WHERE terminal_id = ?", [$this->id]);
            $this->db->query("DELETE FROM tbl_terminal_access_policy WHERE terminal_id = ?", [$this->id]);

            // 2. Delete the Main Terminal Record
            $sql = "DELETE FROM tbl_terminal WHERE id = ?";
            $this->db->query($sql, [$this->id]);

            $this->db->commit();
            return true;

        } catch (\Throwable $e) {
            $this->db->rollback();
            throw $e;
        }
    }

    // Helper to generate a slug from the name
    private function generateSlug(string $text): string {
        return strtolower(trim(preg_replace('/[^A-Za-z0-9-]+/', '-', $text)));
    }

    /**
     * Generate the activation code and returned the hashed string
     * @param int $length
     * @return string
     */
    private function generateSecureCode(int $length = 8): string 
    {
        // Characters that are easy to read (removed 0, O, I, 1, L)
        $chars = '23456789ABCDEFGHJKMNPQRSTUVWXYZ';
        $code = '';
        $max = strlen($chars) - 1;

        for ($i = 0; $i < $length; $i++) {
            $code .= $chars[random_int(0, $max)];
        }

        return $code;
    }

    /**
    * Bulk insert helper for Terminal Auth Capabilities
    */
    private function bulkInsertCapabilities(array $data): void {
        $placeholders = [];
        $params = [];
        foreach ($data as $row) {
            $placeholders[] = "(?, ?, ?)";
            $params[] = $this->id;
            $params[] = $row['auth_type_id'];
            $params[] = $row['auth_step'];
        }
        $sql = "INSERT INTO tbl_terminal_auth_capability (terminal_id, auth_type_id, auth_step) VALUES " . implode(',', $placeholders);
        $this->db->query($sql, $params);
    }

    /**
    * Bulk insert helper for Terminal Access Policies
    */
    private function bulkInsertPolicies(array $data): void {
        $placeholders = [];
        $params = [];
        foreach ($data as $row) {
            $placeholders[] = "(?, ?, ?, ?)";
            $params[] = $this->id;
            $params[] = $row['group_id'];

            // Ensure we pass null, not an empty string or 0
            $subgroup = (!isset($row['subgroup_id']) || $row['subgroup_id'] === '') 
                        ? null 
                        : (int)$row['subgroup_id'];

            $params[] = $subgroup;
            $params[] = $row['auth_type_id'];
        }
        $sql = "INSERT INTO tbl_terminal_access_policy (terminal_id, group_id, subgroup_id, auth_type_id) VALUES " . implode(',', $placeholders);
        $this->db->query($sql, $params);
    }
}
