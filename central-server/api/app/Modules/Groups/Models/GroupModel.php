<?php
namespace App\Modules\Groups\Models;

use App\Core\Database;
use App\Core\Logger;
use App\Modules\Sync\Models\SyncModel;

class GroupModel extends Database {
    protected Database $db;

    private ?int $id = null;
    private ?int $branch_id = null;
    private ?int $grouptype_id = null;
    private string $name;
    private ?int $expected_weekly_hours = 40;
    private ?int $absence_threshold = 0;

    private ?SyncModel $syncModel = null;

    public function __construct()
    {
        $this->db = Database::connect();
        $this->syncModel = new SyncModel();
    }

    // =======================
    // Getters and Setters
    // =======================
    public function getId(): ?int { return $this->id; }
    public function setId(int $id): void { $this->id = $id; }
    public function getBranchId(): ?int { return $this->branch_id; }
    public function setBranchId(int $id): void { $this->branch_id = $id; }
    public function getName():? string { return $this->name; }
    public function setName(string $name): void { $this->name = $name; }
    public function getGroupTypeId(): ?int { return $this->grouptype_id; }
    public function setGroupTypeId(int $id): void { $this->grouptype_id = $id; }
    public function getExpectedWeeklyHours(): ?int { return $this->expected_weekly_hours; }
    public function setExpectedWeeklyHours(int $value): void { $this->expected_weekly_hours = $value; }
    public function getGroupType_id(): ?int { return $this->grouptype_id; }
    public function getAbsenceThreshold(): ?int { return $this->absence_threshold; }
    public function setAbsenseThreshold(int $value): void { $this->absence_threshold = $value; }

    /**
     * create a group and assigned supervisors and members to the group
     * @param array $supervisors
     * @param array $members
     * @return bool
     */
    public function save(array $supervisors, array $members): bool {
        try{
            $this->db->beginTransaction();

            $sqlGroup = "INSERT INTO tbl_group(branch_id,grouptype_id,name,expected_weekly_hours,absence_threshold)
            VALUES(?,?,?,?,?)";
            $groupParams = [
                $this->branch_id,
                $this->grouptype_id,
                $this->name,
                $this->expected_weekly_hours,
                $this->absence_threshold
            ];
            $this->db->query($sqlGroup, $groupParams);
            $this->id = $this->db->lastInsertId();

            if($this->id > 0){
                $terminals = $this->getGroupTerminals($this->id);
                foreach($members as $member) {
                    $sqlMem = "INSERT INTO tbl_group_member(group_id,user_id)
                    VALUES(?,?)";
                    $paramsMem = [$this->id, $member["user_id"]];
                    $this->db->query($sqlMem, $paramsMem);

                    if (!empty($terminals)) {
                        foreach ($terminals as $tId) {
                            $this->syncModel->setTerminalId($tId);
                            $this->syncModel->setEntityType('tbl_user');
                            $this->syncModel->setEntityId($member["user_id"]);
                            $this->syncModel->setAction('upsert');
                            $this->syncModel->save();
                        }
                    }
                }

                foreach($supervisors as $supervisor) {
                    $sqlSup = "INSERT INTO tbl_group_supervisor(group_id,user_id)
                    VALUES(?,?)";
                    $paramsSup = [$this->id, $supervisor["user_id"]];
                    $this->db->query($sqlSup, $paramsSup);
                }
            }
            
            $this->db->commit();

            // -----------------------------------------------------------------
            // SYSTEM AUDIT LOG
            // -----------------------------------------------------------------
            Logger::log(
                'system',
                'info',
                sprintf("Admin created new operational group: '%s' (ID: %d) with %d members and %d supervisors", $this->name, $this->id, count($members), count($supervisors)),
                null, // AppContext auto-picks up active Admin User ID
                ['group_id' => $this->id, 'name' => $this->name, 'action' => 'group_create']
            );

            return true;
            
        }catch(\Throwable $e) {
            $this->db->rollback();
            throw $e;
        }
    }

    /**
     * Fetch paginated groups matching OpenAPI GroupItem structure
     */
    public function fetch(int $page = 1, int $limit = 10): array
    {
        $offset = ($page - 1) * $limit;

        // 1. Get total record count for pagination meta
        $countRes = $this->db->query("SELECT COUNT(*) AS total FROM tbl_group");
        $totalRecords = (int)($countRes->fetch_assoc()['total'] ?? 0);

        if ($totalRecords === 0) {
            return [
                'data' => [],
                'total' => 0
            ];
        }

        // 2. Fetch base groups with group type name
        $sqlGroups = "SELECT 
                        g.id,
                        g.branch_id,
                        g.grouptype_id,
                        gt.name AS group_type_name,
                        g.name,
                        g.expected_weekly_hours,
                        g.absence_threshold,
                        g.date_created AS created_at
                      FROM tbl_group g
                      LEFT JOIN lkup_grouptype gt ON g.grouptype_id = gt.id
                      ORDER BY g.id DESC
                      LIMIT ? OFFSET ?";

        $groupResult = $this->db->query($sqlGroups, [$limit, $offset]);
        if (!$groupResult || $groupResult->num_rows === 0) {
            return ['data' => [], 'total' => $totalRecords];
        }

        $groups = $groupResult->fetch_all(MYSQLI_ASSOC);
        $groupIds = array_column($groups, 'id');
        $placeholders = implode(',', array_fill(0, count($groupIds), '?'));

        // 3. Member counts per group
        $sqlMemberCounts = "SELECT group_id, COUNT(user_id) AS total_members 
                            FROM tbl_group_member 
                            WHERE group_id IN ($placeholders) 
                            GROUP BY group_id";
        $countResult = $this->db->query($sqlMemberCounts, $groupIds);
        $countsByGroup = [];
        if ($countResult && $countResult->num_rows > 0) {
            while ($row = $countResult->fetch_assoc()) {
                $countsByGroup[$row['group_id']] = (int)$row['total_members'];
            }
        }

        // 4. Supervisors per group
        $sqlSupervisors = "SELECT gs.group_id, u.id AS user_id, CONCAT(u.fname, ' ', u.lname) AS name 
                           FROM tbl_group_supervisor gs
                           JOIN tbl_user u ON gs.user_id = u.id
                           WHERE gs.group_id IN ($placeholders)
                           ORDER BY gs.user_id ASC";
        $supResult = $this->db->query($sqlSupervisors, $groupIds);
        $supervisorsByGroup = [];
        if ($supResult && $supResult->num_rows > 0) {
            while ($sup = $supResult->fetch_assoc()) {
                $supervisorsByGroup[$sup['group_id']][] = [
                    'id' => (int)$sup['user_id'],
                    'name' => $sup['name']
                ];
            }
        }

        // 5. Structure final output matrix
        foreach ($groups as &$group) {
            $gId = (int)$group['id'];
            $group['id'] = $gId;
            $group['branch_id'] = (int)$group['branch_id'];
            $group['grouptype_id'] = (int)$group['grouptype_id'];
            $group['expected_weekly_hours'] = (int)$group['expected_weekly_hours'];
            $group['absence_threshold'] = (int)$group['absence_threshold'];
            $group['members_count'] = $countsByGroup[$gId] ?? 0;

            $sups = $supervisorsByGroup[$gId] ?? [];
            if (!empty($sups)) {
                $primary = $sups[0];
                $group['supervisor'] = [
                    'id' => $primary['id'],
                    'name' => $primary['name'],
                    'sup_count' => count($sups) - 1
                ];
            } else {
                $group['supervisor'] = null;
            }
        }

        return [
            'data' => $groups,
            'total' => $totalRecords
        ];
    }

    /**
     * Fetch detailed supervisors and members for a single group
     */
    public function getGroupMembersDetail(int $groupId): ?array
    {
        $check = $this->db->query("SELECT id FROM tbl_group WHERE id = ?", [$groupId]);
        if (!$check || $check->num_rows === 0) {
            return null;
        }

        $sqlSupervisors = "SELECT u.id, CONCAT(u.fname, ' ', u.lname) AS name, u.email,
                                  CASE WHEN u.user_type = 'staff' THEN st.sregno ELSE s.regno END AS regno
                           FROM tbl_group_supervisor gs
                           JOIN tbl_user u ON gs.user_id = u.id
                           LEFT JOIN tbl_student s ON u.id = s.user_id
                           LEFT JOIN tbl_staff st ON u.id = st.user_id
                           WHERE gs.group_id = ?";
        $supResult = $this->db->query($sqlSupervisors, [$groupId]);
        $supervisors = $supResult ? $supResult->fetch_all(MYSQLI_ASSOC) : [];

        $sqlMembers = "SELECT u.id, CONCAT(u.fname, ' ', u.lname) AS name, u.email,
                              CASE WHEN u.user_type = 'staff' THEN st.sregno ELSE s.regno END AS regno
                       FROM tbl_group_member gm
                       JOIN tbl_user u ON gm.user_id = u.id
                       LEFT JOIN tbl_student s ON u.id = s.user_id
                       LEFT JOIN tbl_staff st ON u.id = st.user_id
                       WHERE gm.group_id = ?";
        $memResult = $this->db->query($sqlMembers, [$groupId]);
        $members = $memResult ? $memResult->fetch_all(MYSQLI_ASSOC) : [];

        $format = function ($row) {
            $row['id'] = (int)$row['id'];
            return $row;
        };

        return [
            'group_id' => $groupId,
            'supervisors' => array_map($format, $supervisors),
            'members' => array_map($format, $members)
        ];
    }

    /**
     * update groups
     */
    public function update(array $supervisors, array $members): bool
    {
        if (is_null($this->id)){
            throw new \RuntimeException("group id is required for update operation");
        }

        try {
            $this->db->beginTransaction();

            $sqlGroup = "UPDATE tbl_group 
                        SET branch_id = ?, grouptype_id = ?, name = ?, 
                            expected_weekly_hours = ?, absence_threshold = ?
                        WHERE id = ?";
        
            $this->db->query($sqlGroup, [
                $this->branch_id, 
                $this->grouptype_id, 
                $this->name, 
                $this->expected_weekly_hours, 
                $this->absence_threshold,
                $this->id 
            ]);

            $this->db->query("DELETE FROM tbl_group_member WHERE group_id = ?", [$this->id]);
            $this->db->query("DELETE FROM tbl_group_supervisor WHERE group_id = ?", [$this->id]);

            if($this->id > 0){
                foreach($members as $member) {
                    $sqlMem = "INSERT INTO tbl_group_member(group_id,user_id)
                    VALUES(?,?)";
                    $paramsMem = [$this->id, $member["user_id"]];
                    $this->db->query($sqlMem, $paramsMem);
                }

                foreach($supervisors as $supervisor) {
                    $sqlSup = "INSERT INTO tbl_group_supervisor(group_id,user_id)
                    VALUES(?,?)";
                    $paramsSup = [$this->id, $supervisor["user_id"]];
                    $this->db->query($sqlSup, $paramsSup);
                }
            }

            $this->db->commit();

            // -----------------------------------------------------------------
            // SYSTEM AUDIT LOG
            // -----------------------------------------------------------------
            Logger::log(
                'system',
                'info',
                sprintf("Admin updated settings for group: '%s' (ID: %d), syncing %d total members and %d supervisors", $this->name, $this->id, count($members), count($supervisors)),
                null,
                ['group_id' => $this->id, 'name' => $this->name, 'action' => 'group_update']
            );

            return true;

        } catch(\Throwable $e) {
            $this->db->rollback();
            throw $e;
        }
    }

    /**
     * Delete group by id including it assoc members and supervisors
     */
    public function delete(int $groupId): bool {
        try {
            $this->db->beginTransaction();

            $this->db->query("DELETE FROM tbl_group_member WHERE group_id = ?", [$groupId]);
            $this->db->query("DELETE FROM tbl_group_supervisor WHERE group_id = ?", [$groupId]);
            $this->db->query("DELETE FROM tbl_group WHERE id = ?", [$groupId]);

            $this->db->commit();

            // -----------------------------------------------------------------
            // SYSTEM AUDIT LOG
            // -----------------------------------------------------------------
            Logger::log(
                'system',
                'info',
                sprintf("Admin deleted organization group ID: %d and dropped member relational sync maps", $groupId),
                null,
                ['group_id' => $groupId, 'action' => 'group_delete']
            );

            return true;
        } catch (\Throwable $e) {
            $this->db->rollback();
            // FIXED: Re-throw so it registers inside Router global logging block!
            throw $e;
        }
    }

    /**
     * Fetch all terminals associated to this group
     */
    public function getGroupTerminals(int $groupId): array
    {
        $sql = "SELECT DISTINCT terminal_id FROM tbl_terminal_access_policy WHERE group_id = ?";
        $result = $this->db->query($sql, [$groupId]);
        $terminalIds = [];
        if ($result) {
            while ($row = $result->fetch_assoc()) {
                $terminalIds[] = $row['terminal_id'];
            }
        }
        return $terminalIds;
    }

    public function fetchGroupsAndCorrespondingSubgroups(): array
    {
        $sql = "SELECT 
                    g.id AS group_id, 
                    g.name AS group_name, 
                    sg.id AS subgroup_id, 
                    sg.name AS subgroup_name
                FROM tbl_group g
                LEFT JOIN tbl_subgroup sg ON g.id = sg.group_id
                ORDER BY g.name ASC, sg.name ASC";

        $result = $this->db->query($sql);
        $groups = [];

        if ($result) {
            while ($row = $result->fetch_assoc()) {
                $groupId = $row['group_id'];

                if (!isset($groups[$groupId])) {
                    $groups[$groupId] = [
                        'id' => (int)$groupId,
                        'label' => $row['group_name'],
                        'subgroups' => []
                    ];
                }

                if ($row['subgroup_id'] !== null) {
                    $groups[$groupId]['subgroups'][] = [
                        'id' => (int)$row['subgroup_id'],
                        'label' => $row['subgroup_name']
                    ];
                }
            }
        }

        return array_values($groups);
    }

    public function fetchGroupTypes(): array
    {
        $sql = "SELECT id, name, abbreviation AS abbr FROM lkup_grouptype";
        $res = $this->db->query($sql, []);
        return $res ? mysqli_fetch_all($res, MYSQLI_ASSOC) : [];
    }

    /**
     * Add a single member to an existing group and push sync records to terminals.
     *
     * @param int $groupId
     * @param int $userId
     * @return bool
     */
    public function addMember(int $groupId, int $userId): bool {
        try {
            $this->db->beginTransaction();

            // 1. Prevent duplicate assignment
            $checkRes = $this->db->query(
                "SELECT COUNT(*) as cnt FROM tbl_group_member WHERE group_id = ? AND user_id = ?",
                [$groupId, $userId]
            );
            $existing = $checkRes ? $checkRes->fetch_assoc() : null;
            if ($existing && (int)($existing['cnt'] ?? 0) > 0) {
                $this->db->rollback();
                return true; // Already a member
            }

            // 2. Insert into tbl_group_member
            $sqlMem = "INSERT INTO tbl_group_member(group_id, user_id) VALUES(?, ?)";
            $this->db->query($sqlMem, [$groupId, $userId]);

            // 3. Queue Terminal Sync
            $terminals = $this->getGroupTerminals($groupId);
            if (!empty($terminals)) {
                foreach ($terminals as $tId) {
                    $this->syncModel->setTerminalId($tId);
                    $this->syncModel->setEntityType('tbl_user');
                    $this->syncModel->setEntityId($userId);
                    $this->syncModel->setAction('upsert');
                    $this->syncModel->save();
                }
            }

            $this->db->commit();

            Logger::log(
                'system',
                'info',
                sprintf("Admin added user ID %d to group ID %d", $userId, $groupId),
                null,
                ['group_id' => $groupId, 'user_id' => $userId, 'action' => 'group_add_member']
            );

            return true;
        } catch (\Throwable $e) {
            $this->db->rollback();
            throw $e;
        }
    }

    /**
     * Remove a member from an existing group and push removal sync if applicable.
     *
     * @param int $groupId
     * @param int $userId
     * @return bool
     */
    public function removeMember(int $groupId, int $userId): bool {
        try {
            $this->db->beginTransaction();

            // 1. Delete member record
            $sqlDelete = "DELETE FROM tbl_group_member WHERE group_id = ? AND user_id = ?";
            $this->db->query($sqlDelete, [$groupId, $userId]);

            // 2. Fetch linked terminals for this group
            $terminals = $this->getGroupTerminals($groupId);

            if (!empty($terminals)) {
                foreach ($terminals as $tId) {
                    // Check if user still belongs to any other group linked to this terminal
                    $sqlCheckOtherGroups = "
                        SELECT COUNT(*) as cnt 
                        FROM tbl_group_member gm
                        JOIN tbl_terminal_access_policy tap ON gm.group_id = tap.group_id
                        WHERE gm.user_id = ? AND tap.terminal_id = ?
                    ";
                    $checkRes = $this->db->query($sqlCheckOtherGroups, [$userId, $tId]);
                    $otherGroupCount = $checkRes ? $checkRes->fetch_assoc() : null;

                    if ((int)($otherGroupCount['cnt'] ?? 0) === 0) {
                        // User no longer has access to this terminal -> send delete sync
                        $this->syncModel->setTerminalId($tId);
                        $this->syncModel->setEntityType('tbl_user');
                        $this->syncModel->setEntityId($userId);
                        $this->syncModel->setAction('delete');
                        $this->syncModel->save();
                    } else {
                        // User is still present in another group on this terminal -> issue upsert
                        $this->syncModel->setTerminalId($tId);
                        $this->syncModel->setEntityType('tbl_user');
                        $this->syncModel->setEntityId($userId);
                        $this->syncModel->setAction('upsert');
                        $this->syncModel->save();
                    }
                }
            }

            $this->db->commit();

            Logger::log(
                'system',
                'info',
                sprintf("Admin removed user ID %d from group ID %d", $userId, $groupId),
                null,
                ['group_id' => $groupId, 'user_id' => $userId, 'action' => 'group_remove_member']
            );

            return true;
        } catch (\Throwable $e) {
            $this->db->rollback();
            throw $e;
        }
    }

    /**
     * Add a supervisor to a group.
     *
     * @param int $groupId
     * @param int $userId
     * @return bool
     */
    public function addSupervisor(int $groupId, int $userId): bool
    {
        try {
            // 1. Prevent duplicate supervisor assignment
            $checkRes = $this->db->query(
                "SELECT COUNT(*) as cnt FROM tbl_group_supervisor WHERE group_id = ? AND user_id = ?",
                [$groupId, $userId]
            );
            $existing = $checkRes ? $checkRes->fetch_assoc() : null;
            if ($existing && (int)($existing['cnt'] ?? 0) > 0) {
                return true; // Already a supervisor
            }

            // 2. Insert into tbl_group_supervisor
            $sql = "INSERT INTO tbl_group_supervisor(group_id, user_id) VALUES(?, ?)";
            $this->db->query($sql, [$groupId, $userId]);

            Logger::log(
                'system',
                'info',
                sprintf("Admin added supervisor user ID %d to group ID %d", $userId, $groupId),
                null,
                ['group_id' => $groupId, 'user_id' => $userId, 'action' => 'group_add_supervisor']
            );

            return true;
        } catch (\Throwable $e) {
            throw $e;
        }
    }

    /**
     * Remove a supervisor from a group.
     *
     * @param int $groupId
     * @param int $userId
     * @return bool
     */
    public function removeSupervisor(int $groupId, int $userId): bool
    {
        try {
            $sql = "DELETE FROM tbl_group_supervisor WHERE group_id = ? AND user_id = ?";
            $this->db->query($sql, [$groupId, $userId]);

            Logger::log(
                'system',
                'info',
                sprintf("Admin removed supervisor user ID %d from group ID %d", $userId, $groupId),
                null,
                ['group_id' => $groupId, 'user_id' => $userId, 'action' => 'group_remove_supervisor']
            );

            return true;
        } catch (\Throwable $e) {
            throw $e;
        }
    }
}
