<?php
namespace App\Modules\Terminals\Models;

use App\Core\Database;
use App\Core\Logger;

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
    private ?string $updated_at = null;

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
    public function getUpdatedAt(): ?string { return $this->updated_at; }

    // ==========================================
    // Setters
    // ==========================================
    public function setId(int $id): void { $this->id = $id; }
    
    public function setName(string $name): void { 
        $this->name = $name; 
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
    public function setUpdatedAt(string $val): void { $this->updated_at = $val; }

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

            if($this->id > 0){
                if(!empty($authCapabilities)){
                    $this->bulkInsertCapabilities($authCapabilities);
                }

                if (!empty($accessPolicy)) {
                    $this->bulkInsertPolicies($accessPolicy);
                }
            }

            $this->enqueueTerminalUsersSync($this->id, $accessPolicy);

            $this->db->commit();

            // -----------------------------------------------------------------
            // SYSTEM AUDIT LOG
            // -----------------------------------------------------------------
            Logger::log(
                'system',
                'info',
                sprintf("Admin registered terminal gate '%s' (ID: %d) under branch ID: %d. Generated activation code: %s", $this->name, $this->id, $this->branch_id, $activationCode),
                null,
                ['terminal_id' => $this->id, 'name' => $this->name, 'action' => 'terminal_register']
            );

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

            $sql = "UPDATE tbl_terminal 
                    SET name = ?, slug = ?, branch_id = ?, status = ?, updated_at = ? 
                    WHERE id = ?";
        
            $this->db->query($sql, [
                $this->getName(),
                $this->getSlug(),
                $this->getBranchId(),
                $this->getStatus(),
                $this->getUpdatedAt(),
                $this->getId()
            ]);

            $this->db->query("DELETE FROM tbl_terminal_auth_capability WHERE terminal_id = ?", [$this->id]);
            if (!empty($authCapabilities)) {
                $this->bulkInsertCapabilities($authCapabilities);
            }

            $this->db->query("DELETE FROM tbl_terminal_access_policy WHERE terminal_id = ?", [$this->id]);
            if (!empty($accessPolicy)) {
                $this->bulkInsertPolicies($accessPolicy);
            }

            $this->enqueueTerminalUsersSync($this->id, $accessPolicy);

            $this->db->commit();

            // -----------------------------------------------------------------
            // SYSTEM AUDIT LOG
            // -----------------------------------------------------------------
            Logger::log(
                'system',
                'info',
                sprintf("Admin updated hardware profile and policy permissions for terminal device '%s' (ID: %d)", $this->name, $this->id),
                null,
                ['terminal_id' => $this->id, 'name' => $this->name, 'action' => 'terminal_update']
            );

            return true;

        } catch (\Throwable $e) {
            $this->db->rollback();
            throw $e;
        }
    }

    public function enqueueTerminalUsersSync(int $terminalId, array $accessPolicies): void
    {
        if (empty($accessPolicies)) {
            return;
        }

        try {
            $userIdsToSync = [];

            foreach ($accessPolicies as $policy) {
                $groupId = isset($policy['group_id']) ? (int)$policy['group_id'] : null;
                $subgroupId = isset($policy['subgroup_id']) ? (int)$policy['subgroup_id'] : null;

                if ($subgroupId) {
                    $sql = "SELECT sm.user_id FROM tbl_subgroup_member sm 
                                JOIN tbl_user u ON sm.user_id = u.id
                                WHERE sm.subgroup_id = ? AND u.status = 'active'";
                    $res = $this->db->query($sql, [$subgroupId]);
                    $users = $res ? $res->fetch_all(MYSQLI_ASSOC) : [];
                
                    foreach ($users as $user) {
                        $userIdsToSync[$user['user_id']] = true;
                    }
                } elseif ($groupId) {
                    $sql = "SELECT gm.user_id
                            FROM tbl_group_member gm
                            JOIN tbl_user u ON gm.user_id = u.id
                            WHERE gm.group_id = ? AND u.status = 'active'";

                    $res = $this->db->query($sql, [$groupId]);
                    $users = $res ? $res->fetch_all(MYSQLI_ASSOC) : [];

                    foreach ($users as $user) {
                        $userIdsToSync[$user['user_id']] = true;
                    }
                }
            }

            if (!empty($userIdsToSync)) {
                $this->bulkInsertSyncQueue($terminalId, array_keys($userIdsToSync));
            }

        } catch (\Throwable $e) {
            throw $e;
        }
    }

    private function bulkInsertSyncQueue(int $terminalId, array $userIds): void
    {
        $values = [];
        $placeholders = [];

        foreach ($userIds as $userId) {
            $placeholders[] = "(?, 'tbl_user', ?, 'upsert', 'pending')";
            $values[] = $terminalId;
            $values[] = $userId;
        }

        $sql = "INSERT INTO tbl_sync_queue (terminal_id, entity_type, entity_id, action, status) 
                VALUES " . implode(', ', $placeholders);

        $this->db->query($sql, $values);
    }

    public function fetch(int $branchId = 0, int $terminalId = 0, string $status = ''): array
    {
        $sqlTerminals = "SELECT t.*,b.name AS branch, th.ip_address, th.last_heartbeat,
                            CASE 
                                WHEN th.last_heartbeat >= NOW() - INTERVAL 10 MINUTE THEN 'online'
                                ELSE 'offline'
                            END AS health_status
                            FROM tbl_terminal t
                            JOIN tbl_branch b ON t.branch_id = b.id
                            LEFT JOIN tbl_terminal_health th ON t.id = th.terminal_id";
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
            $sqlTerminals .= " WHERE " . implode(" AND ", $where) . " ORDER BY t.id DESC";
        } else {
            $sqlTerminals .= " ORDER BY t.id DESC";
        }

        $terminalResult = $this->db->query($sqlTerminals, $params);

        if (!$terminalResult || $terminalResult->num_rows === 0) {
            return [];
        }

        $terminals = $terminalResult->fetch_all(MYSQLI_ASSOC);
        $terminalIds = array_column($terminals, 'id');
        $placeholders = implode(',', array_fill(0, count($terminalIds), '?'));

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

        foreach ($terminals as &$terminal) {
            $terminal['auth_capabilities'] = $capsByTerminal[$terminal['id']] ?? [];
            $terminal['access_policy'] = $polsByTerminal[$terminal['id']] ?? [];
        }

        return $terminals;
    }

    public function delete(): bool
    {
        if (!$this->id) {
            throw new \Exception("Terminal ID is required for deletion.");
        }

        try {
            $this->db->beginTransaction();

            $this->db->query("DELETE FROM tbl_terminal_auth_capability WHERE terminal_id = ?", [$this->id]);
            $this->db->query("DELETE FROM tbl_terminal_access_policy WHERE terminal_id = ?", [$this->id]);

            $sql = "DELETE FROM tbl_terminal WHERE id = ?";
            $this->db->query($sql, [$this->id]);

            $this->db->commit();

            // -----------------------------------------------------------------
            // SYSTEM AUDIT LOG
            // -----------------------------------------------------------------
            Logger::log(
                'system',
                'info',
                sprintf("Admin purged physical hardware terminal gate maps for ID: %d from deployment topologies", $this->id),
                null,
                ['terminal_id' => $this->id, 'action' => 'terminal_purge']
            );

            return true;

        } catch (\Throwable $e) {
            $this->db->rollback();
            throw $e;
        }
    }

    public function verifyActivationcode(string $activationCode): int {
        $result = $this->db->query("SELECT * FROM tbl_terminal WHERE status = ?", ['pending']);

        if($result && $result->num_rows > 0) {
            while($row = $result->fetch_assoc()) {
                if (password_verify($activationCode, $row["activation_code"])) {
                    return (int)$row["id"];
                }
            }
        }

        return 0;
    }

    public function getTerminalData(int $id): ?array
    {
        try {
            $this->db->beginTransaction();

            $this->updateStatus('active', (int)$id);
            $result = $this->fetch(0, $id);
            
            if (empty($result)) return null;
            $terminal = $result[0];

            $dailyUsers = $this->getUsersByTerminalPolicy($id);
            $eventUsers = $this->getUsersByEventPolicy($id);

            $uniqueUsers = [];
            foreach (array_merge($dailyUsers, $eventUsers) as $user) {
                $uniqueUsers[$user['id']] = $user;
            }

            $permissions = [];
            foreach ($uniqueUsers as $userId => $userData) {
                $userPerms = $this->getUserPermissions($userId, $id);
                
                foreach ($userPerms as $perm) {
                    $permissions[] = [
                        "user_id"    => $userId,
                        "group_id"   => $perm['group_id'],
                        "subgroup_id"=> $perm['subgroup_id'],
                        "context"    => $perm['context'],
                        "event_id"   => $perm['event_id']
                    ];
                }
            }

            $eventIds = array_filter(array_unique(array_column($permissions, 'event_id')));

            $terminal["members"] = array_values($uniqueUsers);
            $terminal["permissions"] = $permissions;
            $terminal["events"] = !empty($eventIds) ? $this->getEventsMetadata($eventIds) : [];

            $this->db->commit();
            return $terminal;

        } catch (\Throwable $e) { 
            $this->db->rollback();
            throw $e;
        }
    }

    private function getUsersByEventPolicy(int $terminalId): array
    {
        $sql = "SELECT DISTINCT eap.group_id, eap.subgroup_id 
                FROM tbl_event_access_policy eap
                WHERE eap.group_id IN (
                    SELECT group_id FROM tbl_terminal_access_policy WHERE terminal_id = ? AND group_id IS NOT NULL
                ) OR eap.subgroup_id IN (
                    SELECT subgroup_id FROM tbl_terminal_access_policy WHERE terminal_id = ? AND subgroup_id IS NOT NULL
                )";
                
        $result = $this->db->query($sql, [$terminalId, $terminalId]);
        
        $groups = []; 
        $subgroups = [];
        
        if ($result) {
            while ($row = $result->fetch_assoc()) {
                if ($row['group_id']) $groups[] = $row['group_id'];
                if ($row['subgroup_id']) $subgroups[] = $row['subgroup_id'];
            }
        }

        if (empty($groups) && empty($subgroups)) return [];

        $gUsers = !empty($groups) ? $this->getUsersByGroups(array_unique($groups)) : [];
        $sUsers = !empty($subgroups) ? $this->getUsersBySubGroups(array_unique($subgroups)) : [];

        return array_merge($gUsers, $sUsers);
    }

    private function getUsersByTerminalPolicy(int $terminalId): array
    {
        $sqlPolicy = "SELECT group_id, subgroup_id 
                      FROM tbl_terminal_access_policy 
                      WHERE terminal_id = ?";
        
        $policyResult = $this->db->query($sqlPolicy, [$terminalId]);
        if (!$policyResult || $policyResult->num_rows === 0) return [];

        $groupIds = [];
        $subGroupIds = [];

        while ($row = $policyResult->fetch_assoc()) {
            if ($row['group_id']) $groupIds[] = $row['group_id'];
            if ($row['subgroup_id']) $subGroupIds[] = $row['subgroup_id'];
        }

        $groupUsers = !empty($groupIds) ? $this->getUsersByGroups(array_unique($groupIds)) : [];
        $subGroupUsers = !empty($subGroupIds) ? $this->getUsersBySubGroups(array_unique($subGroupIds)) : [];

        $uniqueUsers = [];
        foreach (array_merge($groupUsers, $subGroupUsers) as $user) {
            $uniqueUsers[$user['id']] = $user;
        }

        return array_values($uniqueUsers);
    }

    private function getUserPermissions(int $userId, int $terminalId): array
    {
        $sql = "
            SELECT gm.group_id, sgm.subgroup_id, 'daily' as context, NULL as event_id
            FROM tbl_user u
            LEFT JOIN tbl_group_member gm ON u.id = gm.user_id
            LEFT JOIN tbl_subgroup_member sgm ON u.id = sgm.user_id
            JOIN tbl_terminal_access_policy tap ON ((tap.group_id = gm.group_id) OR (tap.subgroup_id = sgm.subgroup_id))
            WHERE u.id = ? AND tap.terminal_id = ?
            UNION
            SELECT gm.group_id, sgm.subgroup_id, 'event' as context, eap.event_id
            FROM tbl_user u
            LEFT JOIN tbl_group_member gm ON u.id = gm.user_id
            LEFT JOIN tbl_subgroup_member sgm ON u.id = sgm.user_id
            JOIN tbl_event_access_policy eap ON ((eap.group_id = gm.group_id) OR (eap.subgroup_id = sgm.subgroup_id))
            WHERE u.id = ?
        ";

        $result = $this->db->query($sql, [$userId, $terminalId, $userId]);
        return $result ? $result->fetch_all(MYSQLI_ASSOC) : [];
    }

    private function getEventsMetadata(array $eventIds): array
    {
        if (empty($eventIds)) return [];

        $events = [];
        foreach ($eventIds as $eventId) {
            $sqlEvent = "SELECT * FROM tbl_event WHERE id = ?";
            $eventReq = $this->db->query($sqlEvent, [$eventId]);
            $event = $eventReq ? $eventReq->fetch_assoc() : null;

            if ($event) {
                $sqlPolicy = "SELECT ev.group_id, ev.subgroup_id, ev.auth_type_id, at.name as auth_type_name
                              FROM tbl_event_access_policy ev
                              LEFT JOIN lkup_auth_type at ON ev.auth_type_id = at.id
                              WHERE event_id = ?";
                $policyReq = $this->db->query($sqlPolicy, [$eventId]);
                $event['access_policy'] = $policyReq ? $policyReq->fetch_all(MYSQLI_ASSOC) : [];

                $sqlRange = "SELECT checkin_start_datetime, checkin_end_datetime, 
                                    checkout_start_datetime, checkout_end_datetime 
                             FROM tbl_event_checkin_checkout_range WHERE event_id = ?";
                $rangeReq = $this->db->query($sqlRange, [$eventId]);
                $event['checkinout_range'] = $rangeReq ? $rangeReq->fetch_assoc() : null;

                $events[] = $event;
            }
        }

        return $events;
    }

    public function getUsersByGroups(array $groupIds): array
    {
        if (empty($groupIds)) return [];

        $cleanIds = array_values(array_unique($groupIds));
        $placeholders = implode(",", array_fill(0, count($cleanIds), "?"));

        $sql = "SELECT gm.group_id, NULL AS subgroup_id, u.id, u.fname, u.lname,
                    u.gender, u.user_type, u.created_at, u.updated_at, b.face_template,
                    b.fingerprint_template, c.card_uid AS card_serial_code
                FROM tbl_group_member gm
                JOIN tbl_user u ON gm.user_id = u.id
                LEFT JOIN tbl_biometricprofile b ON u.id = b.user_id
                LEFT JOIN tbl_card c ON u.id = c.user_id
                WHERE gm.group_id IN ($placeholders) AND u.status = 'active'";

        $result = $this->db->query($sql, $cleanIds);
        $users = ($result) ? $result->fetch_all(MYSQLI_ASSOC) : [];

        foreach ($users as &$user) {
            $user['face_template'] = $user['face_template'] ? base64_encode($user['face_template']) : null;
            $user['fingerprint_template'] = $user['fingerprint_template'] ? base64_encode($user['fingerprint_template']) : null;
        }

        return $users;
    }

    public function getUsersBySubGroups(array $subGroupIds): array
    {
        if (empty($subGroupIds)) return [];

        $cleanIds = array_values(array_unique($subGroupIds));
        $placeholders = implode(",", array_fill(0, count($cleanIds), "?"));

        $sql = "SELECT sgm.subgroup_id, NULL AS group_id, u.id, u.fname, u.lname,
                    u.gender, u.user_type,u.created_at, u.updated_at, b.face_template,
                    b.fingerprint_template, c.card_uid AS card_serial_code
                FROM tbl_subgroup_member sgm
                JOIN tbl_user u ON sgm.user_id = u.id
                LEFT JOIN tbl_biometricprofile b ON u.id = b.user_id
                LEFT JOIN tbl_card c ON u.id = c.user_id
                WHERE sgm.subgroup_id IN ($placeholders) AND u.status = 'active'";

        $result = $this->db->query($sql, $cleanIds);
        $users = ($result && $result instanceof \mysqli_result) ? $result->fetch_all(MYSQLI_ASSOC) : [];

        foreach ($users as &$user) {
            $user['face_template'] = $user['face_template'] ? base64_encode($user['face_template']) : null;
            $user['fingerprint_template'] = $user['fingerprint_template'] ? base64_encode($user['fingerprint_template']) : null;
        }

        return $users;
    }

    public function updateStatus(string $status, int $id): bool
    {
        $this->db->query("UPDATE tbl_terminal SET status = ? WHERE id = ?", [$status, $id]);

        if ($this->db->affectedRows() > 0) {
            // -----------------------------------------------------------------
            // SYSTEM AUDIT LOG
            // -----------------------------------------------------------------
            Logger::log(
                'system',
                'info',
                sprintf("Terminal device status modified to: '%s' (Terminal ID: %d)", strtoupper($status), $id),
                null,
                ['terminal_id' => $id, 'status' => $status, 'action' => 'terminal_status_change']
            );
            return true;
        }

        return false;
    }

    private function generateSlug(string $text): string {
        return strtolower(trim(preg_replace('/[^A-Za-z0-9-]+/', '-', $text)));
    }

    private function generateSecureCode(int $length = 8): string 
    {
        $chars = '23456789ABCDEFGHJKMNPQRSTUVWXYZ';
        $code = '';
        $max = strlen($chars) - 1;

        for ($i = 0; $i < $length; $i++) {
            $code .= $chars[random_int(0, $max)];
        }

        return $code;
    }

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

    private function bulkInsertPolicies(array $data): void {
        $placeholders = [];
        $params = [];
        foreach ($data as $row) {
            $placeholders[] = "(?, ?, ?, ?)";
            $params[] = $this->id;
            $params[] = $row['group_id'];

            $subgroup = (!isset($row['subgroup_id']) || $row['subgroup_id'] === '') 
                        ? null 
                        : (int)$row['subgroup_id'];

            $params[] = $subgroup;
            $params[] = $row['auth_type_id'];
        }
        $sql = "INSERT INTO tbl_terminal_access_policy (terminal_id, group_id, subgroup_id, auth_type_id) VALUES " . implode(',', $placeholders);
        $this->db->query($sql, $params);
    }

    public function fetchAuthTypes(): array
    {
        $result = $this->db->query("SELECT id, name FROM lkup_auth_type");
        return $result ? $result->fetch_all(MYSQLI_ASSOC) : [];
    }

    public function fetchTerminalDetailsBySlug(string $slug): array
    {
        $sql = "SELECT t.id, t.name, t.slug, t.activation_code, t.branch_id, t.status
                FROM tbl_terminal t WHERE t.slug = ?";

        $result = $this->db->query($sql, [$slug]);
        if (!$result || $result->num_rows === 0) {
            return [];
        }

        $terminalDetails = $result->fetch_assoc();

        $authCapsSql = "SELECT auth_type_id, auth_step 
                        FROM tbl_terminal_auth_capability 
                        WHERE terminal_id = ?";
        $authCapsResult = $this->db->query($authCapsSql, [$terminalDetails['id']]);
        $authCapabilities = $authCapsResult ? $authCapsResult->fetch_all(MYSQLI_ASSOC) : [];

        $accessPolicySql = "SELECT group_id, subgroup_id, auth_type_id
                            FROM tbl_terminal_access_policy 
                            WHERE terminal_id = ?";
        $accessPolicyResult = $this->db->query($accessPolicySql, [$terminalDetails['id']]);
        $authPolicies = $accessPolicyResult ? $accessPolicyResult->fetch_all(MYSQLI_ASSOC) : [];

        return [
            'terminalDetails' => $terminalDetails,
            'authCapabilities' => $authCapabilities,
            'authPolicies' => $authPolicies
        ];
    }
}
