<?php
namespace App\Modules\Sync\Models;

use App\Core\Database;
use App\Core\Logger;
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

            // -----------------------------------------------------------------
            // SYNC AUDIT LOG
            // -----------------------------------------------------------------
            Logger::log(
                'sync',
                'info',
                sprintf("Queued mutation command [%s] for entity '%s' (ID: %d) bound to Terminal ID: %d", strtoupper($this->action), $this->entity_type, $this->entity_id, $this->terminal_id),
                null,
                ['terminal_id' => $this->terminal_id, 'entity_type' => $this->entity_type, 'entity_id' => $this->entity_id, 'action' => $this->action]
            );

            return true;
        } catch (Throwable $e) {
            // Re-throw so exceptions bubble up to Router.php central processor
            throw $e;
        }
    }

    public function getPendingUpdates(int $terminalId): array
    {
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

            if ($item["action"] === "upsert") {
                switch ($item["entity_type"]) {
                    case "tbl_event":
                        $data = $this->getHydratedEvent($item["entity_id"]);
                        break;
                    case "tbl_user":
                        $data = $this->getHydratedUserForTerminal($item["entity_id"], $terminalId);
                        break;
                }
            } else {
                $data = ["id" => $item["entity_id"]];
            }

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

        if (!empty($processedId)) {
            $this->makeAsSent($processedId);
        }

        return [
            "updates" => $updates,
            "last_sync_time" => end($queueItems)["created_at"] ?? null
        ];
    }

    public function makeAsSent(array $processedId) 
    {
        if (empty($processedId)) return;

        $placeholders = implode(',', array_fill(0, count($processedId), '?'));
        $sql = "UPDATE tbl_sync_queue SET status = ? WHERE id IN ($placeholders)";
        $params = array_merge(['sent'], $processedId);

        $this->db->query($sql, $params);

        // -----------------------------------------------------------------
        // SYNC AUDIT LOG
        // -----------------------------------------------------------------
        Logger::log(
            'sync',
            'info',
            sprintf("Dispatched %d pending payload changes to requesting hardware node", count($processedId)),
            null,
            ['dispatched_count' => count($processedId), 'queue_ids' => $processedId]
        );
    }

    private function getHydratedUserForTerminal(int $userId, int $terminalId): ?array
    {
        $sql = "SELECT 
                    u.id, 
                    gm.group_id, 
                    sgm.subgroup_id, 
                    ? as terminal_id, 
                    u.fname, u.lname, u.gender, u.user_type,
                    b.face_template, b.fingerprint_template, c.card_uid AS card_serial_code
                FROM tbl_user u
                LEFT JOIN tbl_group_member gm ON u.id = gm.user_id
                LEFT JOIN tbl_subgroup_member sgm ON u.id = sgm.user_id
                LEFT JOIN tbl_biometricprofile b ON u.id = b.user_id
                LEFT JOIN tbl_card c ON u.id = c.user_id
                WHERE u.id = ? AND u.status = 'active'
                LIMIT 10";

        $result = $this->db->query($sql, [$terminalId, $userId]);
        $user = ($result) ? $result->fetch_assoc() : null;

        if ($user) {
            $user['face_template'] = $user['face_template'] ? base64_encode($user['face_template']) : null;
            $user['fingerprint_template'] = $user['fingerprint_template'] ? base64_encode($user['fingerprint_template']) : null;
        }

        if ($user) {
            $user['permissions'] = $this->getUserPermissions($userId, $terminalId);
        }

        return $user;
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

    private function getHydratedEvent(int $eventId): ?array
    {
        $sql = "SELECT * FROM tbl_event WHERE id = ?";
        $res = $this->db->query($sql, [$eventId]);
        $event = $res ? $res->fetch_assoc() : null;

        if ($event) {
            $sqlrange = "SELECT * FROM tbl_event_checkin_checkout_range WHERE event_id = ?";
            $resrange = $this->db->query($sqlrange, [$eventId]);
            $event['checkinout_range'] = $resrange ? $resrange->fetch_assoc() : null;

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
        if (empty($syncIds)) return;

        $placeholders = implode(',', array_fill(0, count($syncIds), '?'));
        $sql = "UPDATE tbl_sync_queue SET status = ? WHERE id IN ($placeholders)";
        $params = array_merge(['sync'], $syncIds);

        $this->db->query($sql, $params);

        // -----------------------------------------------------------------
        // SYNC AUDIT LOG
        // -----------------------------------------------------------------
        Logger::log(
            'sync',
            'info',
            sprintf("Confirmed remote terminal handshake receipt for %d queue items", count($syncIds)),
            null,
            ['confirmed_queue_ids' => $syncIds]
        );
    }

public function syncAttendanceSession(array $sessions): array
{
    if (empty($sessions)) return [];

    $synced_ids = [];
    $values = [];
    $placeholders = [];

    try {
        $this->db->beginTransaction();

        foreach ($sessions as $s) {
            $synced_ids[] = $s["local_id"];

            $values[] = $s["user_id"];
            $values[] = $s["terminal_id"];               // original terminal_id column
            $values[] = $s["terminal_id"];               // checkin_terminal_id
            $values[] = !empty($s["checkout_timestamp"]) ? $s["terminal_id"] : null;
            $values[] = $s["local_id"];                  // terminal_session_id
            $values[] = $s["context"] ?? $s["attendance_context"] ?? 'general';
            $values[] = !empty($s["event_id"]) ? $s["event_id"] : null;
            $values[] = $s["checkin_timestamp"];
            $values[] = !empty($s["checkout_timestamp"]) ? $s["checkout_timestamp"] : null;
            $values[] = $s["checkin_status"] ?? 'on_time';
            $values[] = !empty($s["checkout_status"]) ? $s["checkout_status"] : null;
            $values[] = $s["session_status"] ?? 'active';
            $values[] = 'synced';                        // central status
            $values[] = $s["created_at"] ?? date('Y-m-d H:i:s');

            $placeholders[] = "(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";
        }

        $sql = "INSERT INTO tbl_attendance_session (
                user_id, 
                terminal_id, 
                checkin_terminal_id, 
                checkout_terminal_id, 
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
                checkout_terminal_id = IF(VALUES(checkout_timestamp) IS NOT NULL, VALUES(terminal_id), checkout_terminal_id),
                checkout_timestamp   = COALESCE(VALUES(checkout_timestamp), checkout_timestamp),
                checkout_status      = COALESCE(VALUES(checkout_status), checkout_status),
                session_status       = IF(VALUES(session_status) = 'completed', 'completed', session_status),
                sync_status          = 'synced'";

        $this->db->query($sql, $values);
        $this->db->commit();

        return $synced_ids;
    } catch (Throwable $e) {
        $this->db->rollBack();
        throw $e;
    }
}

    public function syncAttendanceSummary(array $summaries): bool
    {
        if (empty($summaries)) return false;

        $values = [];
        $placeholders = [];

        try {
            $this->db->beginTransaction();

            foreach ($summaries as $s) {
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
                        user_id, terminal_id, attendance_date, attendance_context, event_id, 
                        first_checkin, last_checkout, total_hours, attendance_status
                    ) VALUES " . implode(', ', $placeholders) . "
                    ON DUPLICATE KEY UPDATE 
                        last_checkout = VALUES(last_checkout),
                        total_hours = VALUES(total_hours),
                        attendance_status = VALUES(attendance_status)";

            $this->db->query($sql, $values);
            $this->db->commit();

            // -----------------------------------------------------------------
            // SYNC AUDIT LOG
            // -----------------------------------------------------------------
            Logger::log(
                'sync',
                'info',
                sprintf("Processed and bundled %d daily metrics summaries from edge node logs", count($summaries)),
                null,
                ['total_summaries_processed' => count($summaries)]
            );

            return true;
        } catch (Throwable $e) {
            $this->db->rollBack();
            throw $e;
        }
    }

    public function syncUserTemplates(array $users): array
    {
        if (empty($users)) return [];

        $syncIds = [];

        try {
            $this->db->beginTransaction();

            foreach ($users as $u) {
                $sql = "UPDATE tbl_biometricprofile SET face_template = ? WHERE user_id = ?";
                $faceTemplate = base64_decode($u["face_template"]);
                $this->db->query($sql, [$faceTemplate, $u["user_id"]]);

                $syncIds[] = $u["user_id"];
            }

            $this->db->commit();

            // -----------------------------------------------------------------
            // SYNC AUDIT LOG
            // -----------------------------------------------------------------
            Logger::log(
                'sync',
                'info',
                sprintf("Successfully updated biometric face templates for %d employees via terminal uplink", count($users)),
                null,
                ['updated_employee_ids' => $syncIds]
            );

            return $syncIds;
        } catch (Throwable $e) {
            $this->db->rollBack();
            throw $e;
        }
    }
}
