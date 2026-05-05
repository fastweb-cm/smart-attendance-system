<?php
namespace App\Modules\Sync\Models;

use App\Core\Database;
use Throwable;

class SyncModel
{
    protected Database $db;

    private ?int $id = null;
    private int $terminal_id;
    private string $entity_type;
    private int $entity_id;
    private string $action; // upsert or delete

    private ?string $status;
    private ?string $created_at = null;

    public function __construct()
    {
        $this->db = Database::connect();
    }

    // ==========================================
    // Getters
    // ==========================================
    public function getId(): ?int { return $this->id; }
    public function getTerminalId(): int { return $this->terminal_id; }
    public function getEntityType(): string { return $this->entity_type; }
    public function getEntityId(): int { return $this->entity_id; }
    public function getAction(): string { return $this->action; }
    public function getStatus(): ?string { return $this->status; }
    public function getCreatedAt(): ?string { return $this->created_at; }

    // ==========================================
    // Setters
    // ==========================================
    public function setId(int $id): void { $this->id = $id; }
    public function setTerminalId(int $terminal_id): void { $this->terminal_id = $terminal_id; }
    public function setEntityType(string $entity_type): void { $this->entity_type = $entity_type; }
    public function setEntityId(int $entity_id): void { $this->entity_id = $entity_id; }
    public function setAction(string $action): void { $this->action = $action; }

    public function setStatus(string $status): void { $this->status = $status; }
    public function setCreatedAt(string $created_at): void { $this->created_at = $created_at; }

    public function save(): bool
    {
        try {
            $sql = "INSERT INTO tbl_sync_queue (terminal_id, entity_type, entity_id, action)
                    VALUES(?,?,?,?)";

            $params = [
                $this->terminal_id,
                $this->entity_type,
                $this->entity_id,
                $this->action
            ];

            $this->db->query($sql, $params);
            return true;
        } catch (Throwable $e) {
            // Log error or handle as needed
            return false;
        }
    }

    public function getPendingUpdates(int $terminalId): array
    {
        // fetch pending updates from the queue
        $sql = "SELECT *,
                CASE 
                    WHEN entity_type = 'tbl_event' THEN 1
                    WHEN entity_type = 'tbl_user' THEN 2
                    ELSE 3
                END AS priority
                FROM tbl_sync_queue
                WHERE terminal_id = ? AND status = 'pending'
                ORDER BY priority ASC, created_at ASC 
                LIMIT 100";

        $result = $this->db->query($sql, [$terminalId]);
        if (!$result || $result->num_rows === 0) return [];

        $queueItems = $result->fetch_all(MYSQLI_ASSOC);
        $updates = [];
        $processedId = [];

        foreach ($queueItems as $item) {
            $data = null;

            // fetch data based on type
            if ($item["action"] === "upsert") {
                switch ($item["entity_type"]) {
                    case "tbl_event":
                        $data = $this->getHydratedEvent($item["entity_id"]);
                        break;
                    case "tbl_user":
                        // hydrate the user with full biometric and group data
                        $data = $this->getHydratedUserForTerminal($item["entity_id"], $terminalId);
                        break;
                    // add more cases 
                }
            } else {
                // fors delete the ID is enough
                $data = ["id" => $item["entity_id"]];
            }

            //only add to update if we actually found the data (prevents sync deleted users as active)
            if ($data || $item["action"] === "delete") {
                $updates[] = [
                    "id" => $item["id"],
                    "type" => $item["entity_type"],
                    "action" => $item["action"],
                    "data" => $data
                ];

                $processedId[] = $item["id"];
            }
        }

        //mark as sent, so they aren't fetched next time
        if (!empty($processedId)) {
            $this->makeAsSent($processedId);
        }

        return [
            "updates" => $updates,
            "last_sync_time" => end($result)["created_at"]
        ];
    }

    public function makeAsSent(array $processedId) 
    {
        if (empty($processedId)) {
            return;
        }
        // Create ?, ?, ? placeholders dynamically
        $placeholders = implode(',', array_fill(0, count($processedId), '?'));

        $sql = "
            UPDATE tbl_sync_queue
            SET status = ?
            WHERE id IN ($placeholders)";

        // First parameter is status, followed by IDs
        $params = array_merge(['sent'], $processedId);

        $this->db->query($sql, $params);
    }

    private function getHydratedUserForTerminal(int $userId, int $terminalId): ?array
    {
        // We query the user and check their group/subgroup membership 
        // specifically in the context of what this terminal allows.
        $sql = "SELECT 
                    u.id, 
                    gm.group_id, 
                    sgm.subgroup_id, 
                    ? as terminal_id, 
                    u.fname, u.lname, u.gender, u.user_type,
                    b.face_template, b.fingerprint_template, b.card_serial_code
                FROM tbl_user u
                LEFT JOIN tbl_group_member gm ON u.id = gm.user_id
                LEFT JOIN tbl_subgroup_member sgm ON u.id = sgm.user_id
                LEFT JOIN tbl_biometricprofile b ON u.id = b.user_id
                WHERE u.id = ? AND u.status = 'active'
                LIMIT 1";

        $result = $this->db->query($sql, [$terminalId, $userId]);
        $user = ($result) ? $result->fetch_assoc() : null;


        if ($user) {
            $user['face_template'] = $user['face_template'] ? base64_encode($user['face_template']) : null;
            $user['fingerprint_template'] = $user['fingerprint_template'] ? base64_encode($user['fingerprint_template']) : null;
        }

        $user['permissions'] = $this->getUserPermissions($userId, $terminalId);

        return $user;
    }

        private function getUserPermissions(int $userId, int $terminalId): array
{
    $sql = "
        -- 1. Check for Daily Context
        SELECT 
            gm.group_id, 
            sgm.subgroup_id, 
            'daily' as context, 
            NULL as event_id
        FROM tbl_user u
        LEFT JOIN tbl_group_member gm ON u.id = gm.user_id
        LEFT JOIN tbl_subgroup_member sgm ON u.id = sgm.user_id
        JOIN tbl_terminal_access_policy tap ON (
            (tap.group_id = gm.group_id) OR (tap.subgroup_id = sgm.subgroup_id)
        )
        WHERE u.id = ? AND tap.terminal_id = ?

        UNION

        -- 2. Check for Event Context
        SELECT 
            gm.group_id, 
            sgm.subgroup_id, 
            'event' as context, 
            eap.event_id
        FROM tbl_user u
        LEFT JOIN tbl_group_member gm ON u.id = gm.user_id
        LEFT JOIN tbl_subgroup_member sgm ON u.id = sgm.user_id
        JOIN tbl_event_access_policy eap ON (
            (eap.group_id = gm.group_id) OR (eap.subgroup_id = sgm.subgroup_id)
        )
        WHERE u.id = ?
    ";

    $result = $this->db->query($sql, [$userId, $terminalId, $userId]);
    return $result ? $result->fetch_all(MYSQLI_ASSOC) : [];
}

    private function getHydratedEvent (int $eventId): ?array
    {
        $sql = "SELECT * FROM tbl_event WHERE id = ?";
        $res = $this->db->query($sql, [$eventId]);
        $event = $res ? $res->fetch_assoc() : null;

        if ($event) {
            //fetch the checking checkout range
            $sqlrange = "SELECT * FROM tbl_event_checkin_checkout_range WHERE event_id = ?";
            $resrange = $this->db->query($sqlrange, [$eventId]);
            $event['checkinout_range'] = $resrange ? $resrange->fetch_assoc() : null;

            // get the event policies
            $sqlPol = "SELECT ev.*, at.name AS auth_type_name FROM tbl_event_access_policy ev 
                       LEFT JOIN lkup_auth_type at ON ev.auth_type_id = at.id
                       WHERE ev.event_id = ?";
            $resPol = $this->db->query($sqlPol, [$eventId]);
            $event['access_policies'] = $resPol ? $resPol->fetch_all(MYSQLI_ASSOC) : [];
        }

        return $event;
    }

    public function updateSyncStatus(array $syncIds): void
    {
        if (empty($syncIds)) {
            return;
        }
        // Create ?, ?, ? placeholders dynamically
        $placeholders = implode(',', array_fill(0, count($syncIds), '?'));

        $sql = "
            UPDATE tbl_sync_queue
            SET status = ?
            WHERE id IN ($placeholders)";

        // First parameter is status, followed by IDs
        $params = array_merge(['sync'], $syncIds);

        $this->db->query($sql, $params);
    }

public function syncAttendanceSession(array $sessions): array
{
    if (empty($sessions)) {
        return [];
    }

    $synced_ids = [];
    $values = [];
    $placeholders = [];

    try {
        // Start transaction within the model
        $this->db->beginTransaction();

        foreach ($sessions as $s) {
            // Collect IDs for acknowledgment
            $synced_ids[] = $s["local_id"];

            // Add values in the exact order of the columns below
            $values[] = $s["user_id"];
            $values[] = $s["terminal_id"];
            $values[] = $s["local_id"];
            $values[] = $s["context"];
            $values[] = $s["event_id"] ?? null;
            $values[] = $s["checkin_timestamp"];
            $values[] = $s["checkout_timestamp"] ?? null;
            $values[] = $s["checkin_status"];
            $values[] = $s["checkout_status"] ?? null;
            $values[] = $s["session_status"];
            $values[] = $s["sync_status"];
            $values[] = $s["created_at"];

            // Create the placeholder string (?, ?, ..., ?)
            $placeholders[] = "(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";
        }

        // Single Batch Query
        $sql = "INSERT INTO tbl_attendance_session (
                    user_id, 
                    terminal_id,
                    terminal_session_id, 
                    attendance_context, 
                    event_id, 
                    checkin_timestamp, 
                    checkout_timestamp, 
                    checkin_status, 
                    checkout_status, 
                    session_status, 
                    sync_status,
                    created_at
                ) VALUES " . implode(', ', $placeholders) . "
                ON DUPLICATE KEY UPDATE 
                    checkout_timestamp = VALUES(checkout_timestamp),
                    checkout_status = VALUES(checkout_status),
                    sync_status = VALUES(sync_status),
                    session_status = VALUES(session_status)";

        $this->db->query($sql, $values);

        // Commit everything
        $this->db->commit();

        return $synced_ids;

    } catch (Throwable $e) {
        // Rollback on any failure
        $this->db->rollBack();
        error_log("Error syncing attendance sessions: " . $e->getMessage());
        throw $e; // Rethrow to let the controller handle the error message
    }
}

public function syncAttendanceSummary(array $summaries): bool
{
    if (empty($summaries)) {
        return false;
    }

    $synced_ids = [];
    $values = [];
    $placeholders = [];

    try {
        $this->db->beginTransaction();

        foreach ($summaries as $s) {
            // Track the local ID to return to Python for confirmation

            $values[] = $s["user_id"];
            $values[] = $s["terminal_id"];
            $values[] = $s["attendance_date"];
            $values[] = $s["attendance_context"];
            $values[] = $s["event_id"] ?? null;
            $values[] = $s["first_checkin"];
            $values[] = $s["last_checkout"] ?? null;
            $values[] = $s["total_hours"];
            $values[] = $s["attendance_status"];

            $placeholders[] = "(?, ?, ?, ?, ?, ?, ?, ?, ?)";
        }

        $sql = "INSERT INTO tbl_attendance_summary (
                    user_id, 
                    terminal_id, 
                    attendance_date, 
                    attendance_context, 
                    event_id, 
                    first_checkin, 
                    last_checkout, 
                    total_hours, 
                    attendance_status
                ) VALUES " . implode(', ', $placeholders) . "
                ON DUPLICATE KEY UPDATE 
                    last_checkout = VALUES(last_checkout),
                    total_hours = VALUES(total_hours),
                    attendance_status = VALUES(attendance_status)";

        $this->db->query($sql, $values);

        $this->db->commit();
        return true;

    } catch (Throwable $e) {
        $this->db->rollBack();
        error_log("Database Error in syncAttendanceSummary: " . $e->getMessage());
        throw $e;
    }
}

public function syncUserTemplates(array $users): array
    {
        if (empty($users)) {
            return [];
        }

        $syncIds = [];

        try{
            $this->db->beginTransaction();

            foreach ($users as $u) {
                $sql = "UPDATE tbl_biometricprofile 
                        SET face_template = ?
                        WHERE user_id = ?";

                $faceTemplate = base64_decode($u["face_template"]);
                $this->db->query($sql, [$faceTemplate, $u["user_id"]]);

                $syncIds[] = $u["user_id"];
            }

            $this->db->commit();
            return $syncIds;
        }catch(Throwable $e) {
            $this->db->rollBack();
            error_log("Error in userTemplatesUplink: " . $e->getMessage());
            throw $e;
        }
    }
}
