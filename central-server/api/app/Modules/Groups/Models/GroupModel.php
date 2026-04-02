<?php
namespace App\Modules\Groups\Models;

use App\Core\Database;
class GroupModel extends Database {
    protected Database $db;

    private ?int $id = null;
    private ?int $branch_id = null;
    private ?int $grouptype_id = null;
    private string $name;
    private ?int $expected_weekly_hours = 40;
    private ?int $absence_threshold = 0;

    public function __construct()
    {
        $this->db = Database::connect();
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
            //begin the transation
            $this->db->beginTransaction();

            //create the group
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

            //now let insert the group supervisors and group members record
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
            return true;
            
        }catch(\Throwable $e) {
            throw $e;
        }
    }

    /**
    * Fetch groups with their supervisors and members
    * @param int $branchId Optional filter by branch
    * @return array
    */
    public function fetch(int $groupId = 0, int $branchId = 0): array
    {
        // 1. Fetch the main Group records
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
        } // limit result just to this group

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

        // 2. Fetch all Supervisors for these groups in one go
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

        // 3. Fetch all Members for these groups in one go
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

        // 4. Stitch everything together
        foreach ($groups as &$group) {
            $group['supervisors'] = $supervisorsByGroup[$group['id']] ?? [];
            $group['members'] = $membersByGroup[$group['id']] ?? [];
        }

        return $groups;
    }

    /**
     * update groups
     * @param array $supervisors
     * @param array $members
     * @throws \RuntimeException
     * @return bool
     */
    public function update(array $supervisors, array $members): bool
    {
        if (is_null($this->id)){
            throw new \RuntimeException("group id is required for update operation");
        }

        try {
            //start transaction
            $this->db->beginTransaction();

            // Update the main group details
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

            // Clear old relationships
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
            return true;

        } catch(\Throwable $e) {
            $this->db->rollback();
            throw $e;
        }
    }

    /**
     * Delete group by id including it assoc members and supervisors
     * @param int $groupId
     * @return bool
     */
    public function delete(int $groupId): bool {
        try {
            $this->db->beginTransaction();

            // delete old relationships
            $this->db->query("DELETE FROM tbl_group_member WHERE group_id = ?", [$groupId]);
            $this->db->query("DELETE FROM tbl_group_supervisor WHERE group_id = ?", [$groupId]);

            // now delete the parant table
            $this->db->query("DELETE FROM tbl_group WHERE id = ?", [$groupId]);

            $this->db->commit();
            return true;
        } catch (\Throwable $e) {
            $this->db->rollback();

            return false;
        }
    }

}
