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
    * Fetch groups with their supervisors and members
    */
    public function fetch(int $groupId = 0, int $branchId = 0): array
    {
        // Read operations do not require mutation log tracking
        $sqlGroups = "SELECT * FROM tbl_group";
        $where = [];
        $params = [];

        if ($branchId > 0) {
            $where[] = "branch_id = ?";
            $params[] = $branchId;
        }

        if ($groupId > 0) {
            $where[] = "id = ?";
            $params[] = $groupId;
        }

        if(!empty($where)){
            $sqlGroups .= " WHERE " . implode(" AND ", $where);
        }

        $groupResult = $this->db->query($sqlGroups, $params);

        if (!$groupResult || $groupResult->num_rows === 0) {
            return [];
        }

        $groups = $groupResult->fetch_all(MYSQLI_ASSOC);
        $groupIds = array_column($groups, 'id');
        $placeholders = implode(',', array_fill(0, count($groupIds), '?'));

        $sqlSupervisors = "SELECT gs.group_id, u.id AS user_id, u.fname, u.lname 
                        FROM tbl_group_supervisor gs
                        JOIN tbl_user u ON gs.user_id = u.id
                        WHERE gs.group_id IN ($placeholders)";
    
        $supResult = $this->db->query($sqlSupervisors, $groupIds);
        $supervisorsByGroup = [];
        if ($supResult && $supResult->num_rows > 0) {
            foreach ($supResult->fetch_all(MYSQLI_ASSOC) as $sup) {
                $supervisorsByGroup[$sup['group_id']][] = $sup;
            }
        }

        $sqlMembers = "SELECT gm.group_id, u.id AS user_id, u.fname, u.lname 
                    FROM tbl_group_member gm
                    JOIN tbl_user u ON gm.user_id = u.id
                    WHERE gm.group_id IN ($placeholders)";
    
        $memResult = $this->db->query($sqlMembers, $groupIds);
        $membersByGroup = [];
        if ($memResult && $memResult->num_rows > 0) {
            foreach ($memResult->fetch_all(MYSQLI_ASSOC) as $mem) {
                $membersByGroup[$mem['group_id']][] = $mem;
            }
        }

        foreach ($groups as &$group) {
            $group['supervisors'] = $supervisorsByGroup[$group['id']] ?? [];
            $group['members'] = $membersByGroup[$group['id']] ?? [];
        }

        return $groups;
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
}
