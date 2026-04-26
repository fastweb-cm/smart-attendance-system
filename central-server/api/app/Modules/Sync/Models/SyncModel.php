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
        $sql = "SELECT * FROM tbl_sync_queue
                WHERE terminal_id = ? AND status = 'pending'
                ORDER BY created_at ASC LIMIT 100";

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
                    case "tbl_user":
                        // hydrate the user with full biometric and group data
                        $data = $this->getHydratedUserForTerminal($item["entity_id"], $terminalId);
                        break;
                    case "tbl_event":
                        //logic
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
            // Convert Blobs to Base64 so Python/JSON can carry them
            $user['face_template'] = $user['face_template'] ? base64_encode($user['face_template']) : null;
            $user['fingerprint_template'] = $user['fingerprint_template'] ? base64_encode($user['fingerprint_template']) : null;
        }

        return $user;
    }
}
