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
        $sqlTerminals = "SELECT t.id,t.name,t.slug,t.branch_id,t.status,t.date_created,b.name AS branch FROM tbl_terminal t
                            JOIN tbl_branch b ON t.branch_id = b.id";
        $where = [];
        $params = [];

        if ($branchId > 0) {
            $where[] = "t.branch_id = ?";
            $params[] = $branchId;
        }

        if ($terminalId > 0) {
            $where[] = "t.id = ?";
            $params[] = $terminalId;
        }

        if (!empty($status)) {
            $where[] = "t.status = ?";
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

    /**
     * Verifies a plain text code against the hashed code in DB
     * Returns terminal ID on success, 0 on failre
     * @param string $activationCode
     * @return int
     */
    public function verifyActivationcode(string $activationCode): int {
        // only fetch terminal that are still pending
        $result = $this->db->query("SELECT * FROM tbl_terminal WHERE status = ?",['pending']);

        if($result && $result->num_rows > 0) {
            while($row = $result->fetch_assoc()) {
                // verify the plain code again stored hash
                if (password_verify($activationCode, $row["activation_code"])) {
                    return (int)$row["id"];
                }
            }
        }

        return 0; // no match found
    }

    /**
     * Get full terminal configuration by ID
     * Reuses the existing fetch method
     * @param int $id
     * @return array|null
     */
    public function getTerminalData(int $id): ?array
    {
        try {
        //begin transaction
        $this->db->beginTransaction();

        // update the terminal status to active
        $this->updateStatus('active', (int)$id);

        $result = $this->fetch(0, $id);
        
        if (empty($result)) return null;

        $groupIds = [];
        $subGroupIds = [];

        $terminal = $result[0];

        foreach ($terminal["access_policy"] as $policy) {
            if (!empty($policy["subgroup_id"])) {
                $subGroupIds[] = $policy["subgroup_id"];
            } else if (!empty($policy["group_id"])) {
                $groupIds[] = $policy["group_id"];
            }
        }


        // fetch from both sources
        $groupUsers = $this->getUsersByGroups(array_unique($groupIds)) ?? [];
        $subGroupUsers = $this->getUsersBySubGroups(array_unique($subGroupIds)) ?? [];


        //merge and remove duplicate (in case a user is in both result)
        $allUsers = array_merge($groupUsers, $subGroupUsers);
        $uniqueUsers = [];
        foreach ($allUsers as $user) {
            $uniqueUsers[$user["id"]] = $user; // keying by ID removes duplicate
        }

        $terminal["members"] = array_values($uniqueUsers);

        $this->db->commit();

        return $terminal;
        } catch (\Throwable $e) { 
            $this->db->rollback();
            throw $e;
        }
    }

    /**
     * Get active users by an array of group ids
     * @param array $groups
     * @return void
     */
    public function getUsersByGroups(array $groupIds): array
    {
        if (empty($groupIds)) return [];

        $cleanIds = array_values(array_unique($groupIds));
        $placeholders = implode(",", array_fill(0, count($cleanIds), "?"));

        $sql = "SELECT gm.group_id, NULL AS subgroup_id, u.id, u.fname, u.lname,
                    u.gender, u.user_type, b.face_template,
                    b.fingerprint_template, b.card_serial_code
                FROM tbl_group_member gm
                JOIN tbl_user u ON gm.user_id = u.id
                LEFT JOIN tbl_biometricprofile b ON u.id = b.user_id
                WHERE gm.group_id IN ($placeholders) AND u.status = 'active'";

        $result = $this->db->query($sql, $cleanIds);
        $users = ($result) ? $result->fetch_all(MYSQLI_ASSOC) : [];

        // Transform BLOBs to JSON-safe Strings
        foreach ($users as &$user) {
            $user['face_template'] = $user['face_template'] ? base64_encode($user['face_template']) : null;
            $user['fingerprint_template'] = $user['fingerprint_template'] ? base64_encode($user['fingerprint_template']) : null;
        }

        return $users;
    }

    /**
     * Get active users by an array of sub group ids
     * @param array $subgroups
     * @return void
     */
    public function getUsersBySubGroups(array $subGroupIds): array
    {
        if (empty($subGroupIds)) return [];

        // Clean IDs (unique and reset keys)
        $cleanIds = array_values(array_unique($subGroupIds));
        $placeholders = implode(",", array_fill(0, count($cleanIds), "?"));

        // 3. The Query (Fixed JOIN to LEFT JOIN and corrected 'group_id' typo)
        $sql = "SELECT sgm.subgroup_id, NULL AS group_id, u.id, u.fname, u.lname,
                    u.gender, u.user_type, b.face_template,
                    b.fingerprint_template, b.card_serial_code
                FROM tbl_subgroup_member sgm
                JOIN tbl_user u ON sgm.user_id = u.id
                LEFT JOIN tbl_biometricprofile b ON u.id = b.user_id
                WHERE sgm.subgroup_id IN ($placeholders) AND u.status = 'active'";

        $result = $this->db->query($sql, $cleanIds);
        $users = ($result && $result instanceof \mysqli_result) ? $result->fetch_all(MYSQLI_ASSOC) : [];

        // Transform BLOBs to JSON-safe Strings
        foreach ($users as &$user) {
            $user['face_template'] = $user['face_template'] ? base64_encode($user['face_template']) : null;
            $user['fingerprint_template'] = $user['fingerprint_template'] ? base64_encode($user['fingerprint_template']) : null;
        }

        return $users;
    }

    /**
     * Update terminal status
     * returns true if update was successfull, otherwose false
     */
    public function updateStatus(string $status, int $id): bool
    {
        $this->db->query("UPDATE tbl_terminal SET status = ? WHERE id = ?", [$status, $id]);

        if ($this->db->affectedRows() > 0) {
            return true;
        }

        return false;
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
