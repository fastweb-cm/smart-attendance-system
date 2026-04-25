<?php
namespace App\Modules\Events\Models;

use App\Core\Database;
use Throwable;
class EventsModel
{
    protected Database $db;

    private ?int $id = null;
    private string $name;
    private string $start_datetime;
    private string $end_datetime;
    private ?int $affects_attendance = 1;
    private ?int $created_by = null;
    private ?string $handshake = '1';
    private ?string $created_at = null;
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
    public function getStartDatetime(): string { return $this->start_datetime; }
    public function getEndDatetime(): string { return $this->end_datetime; }
    public function getAffectsAttendance(): ?string { return $this->affects_attendance; }
    public function getCreatedBy(): ?int { return $this->created_by; }
    public function getHandshake(): ?string { return $this->handshake; }
    public function getCreatedAt(): ?string { return $this->created_at; }
    public function getUpdatedAt(): ?string { return $this->updated_at; }

    // ==========================================
    // Setters
    // ==========================================
    public function setId(int $id): void { $this->id = $id; }
    public function setName(string $name): void { $this->name = $name; }
    public function setStartDatetime(string $val): void { $this->start_datetime = $val; }
    public function setEndDatetime(string $val): void { $this->end_datetime = $val; }
    public function setAffectsAttendance(int $val): void { $this->affects_attendance = $val; }
    public function setCreatedBy(int $val): void { $this->created_by = $val; }
    public function setHandshake(string $val): void { $this->handshake = $val; }
    public function setCreatedAt(string $val): void { $this->created_at = $val; }
    public function setUpdatedAt(string $val): void { $this->updated_at = $val; }

    public function save(array $accessPolicy, array $checkinOutRange): bool
    {
        try {
            $this->db->beginTransaction();

            $sqlEvent = "INSERT INTO tbl_event (name, start_datetime, end_datetime, affects_attendance, created_by, handshake)
                        VALUES(?,?,?,?,?,?)";

            $paramsEvent = [
                $this->name,
                $this->start_datetime,
                $this->end_datetime,
                $this->affects_attendance,
                $this->created_by,
                $this->handshake
            ];

            $this->db->query($sqlEvent, $paramsEvent);
            $this->id = $this->db->lastInsertId();

            //event access policies
            $this->bulkinsertPolicies($accessPolicy);
            $this->checkInOutInsert($checkinOutRange);

            $this->db->commit();
            return true;
        } catch (Throwable $e) {
            $this->db->rollback();
            throw $e;
        }
    }

    public function update(array $accessPolicy, array $checkinOutRange): bool
    {
        try {
            $this->db->beginTransaction();

            //update the main event record
            $sql = "UPDATE tbl_event
                    SET name = ?, start_datetime = ?, end_datetime = ?, affects_attendance = ?, created_by = ?, handshake = ?, updated_at = ?
                    WHERE id = ?";

            $this->db->query($sql, [
                $this->name,
                $this->start_datetime,
                $this->end_datetime,
                $this->affects_attendance,
                $this->created_by,
                $this->handshake,
                $this->updated_at,
                $this->id
            ]);

            // sync access policy (delete old, insert new)
            $this->db->query("DELETE FROM tbl_event_access_policy WHERE event_id = ?", [$this->id]);
            if (!empty($accessPolicy)) {
                $this->bulkinsertPolicies($accessPolicy);
            }

            //sync check in out ranges (Delete old, insert new)
            $this->db->query("DELETE FROM tbl_event_checkin_checkout_range WHERE event_id = ?", [$this->id]);
            if (!empty($checkinOutRange)) {
                $this->checkInOutInsert($checkinOutRange);
            }

            $this->db->commit();
            return true;
        } catch (Throwable $e) {
            $this->db->rollback();
            throw $e;
        }
    }

    public function fetch(int $eventId = 0): array
    {
        $sqlEvs = "SELECT e.*, u.fname, u.lname FROM tbl_event e
                    JOIN tbl_user u ON e.created_by = u.id";

        $where = [];
        $params = [];

        if ($eventId > 0) {
            $where[] = "e.id = ?";
            $params[] = $eventId;
        }

        if (!empty($where)) {
            $sqlEvs .= " WHERE " . implode(" AND ", $where);
        }

        $evsRes = $this->db->query($sqlEvs, $params);
        if (!$evsRes || $evsRes->num_rows == 0) {
            return [];
        }

        $events = $evsRes->fetch_all(MYSQLI_ASSOC);
        $eventsId = array_column($events, 'id');
        $placeholders = implode(', ', array_fill(0, count($events), '?'));

        //fetch all events policies
        $sqlPolicies = "SELECT ep.*, g.name as group_name, at.name as auth_type_name
                        FROM tbl_event_access_policy ep
                        LEFT JOIN tbl_group g ON ep.group_id = g.id
                        LEFT JOIN lkup_auth_type at ON ep.auth_type_id = at.id
                        WHERE ep.event_id IN ($placeholders)";

        $polRes = $this->db->query($sqlPolicies, $eventsId);
        $polByEvent = [];
        if ($polRes && $polRes->num_rows > 0) {
            foreach ($polRes->fetch_all(MYSQLI_ASSOC) as $pol) {
                $polByEvent[$pol['event_id']][] = $pol;
            }
        }

        // fetch all events checkin checkout ranges
        $sqlCheckInOut = "SELECT * FROM tbl_event_checkin_checkout_range WHERE event_id IN ($placeholders)";
        $checkInOutRes = $this->db->query($sqlCheckInOut, $eventsId);
        $checkInOutByEvent = [];
        if ($checkInOutRes && $checkInOutRes->num_rows > 0) {
            foreach ($checkInOutRes->fetch_all(MYSQLI_ASSOC) as $range) {
                $checkInOutByEvent[$range['event_id']][] = $range;
            }
        }

        //map relationship back to events
        // & is used to ensure we modify the original event array by reference, not a copy
        foreach ($events as &$ev) {
            $ev['access_policy'] = $polByEvent[$ev['id']] ?? [];
            $ev['checkin_checkout_ranges'] = $checkInOutByEvent[$ev['id']] ?? [];
        }

        return $events;
    }

    public function delete(int $eventId): bool
    {
        try {
            $this->db->beginTransaction();

            //delete access policies
            $this->db->query("DELETE FROM tbl_event_access_policy WHERE event_id = ?", [$eventId]);

            //delete checkin checkout ranges
            $this->db->query("DELETE FROM tbl_event_checkin_checkout_range WHERE event_id = ?", [$eventId]);

            //delete the main event record
            $this->db->query("DELETE FROM tbl_event WHERE id = ?", [$eventId]);

            $this->db->commit();
            return true;
        } catch (Throwable $e) {
            $this->db->rollback();
            throw $e;
        }
    }

    private function bulkinsertPolicies(array $data): void
    {
        if (empty($data)) return;

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

        // Move these TWO lines OUTSIDE the loop
        $sql = "INSERT INTO tbl_event_access_policy (event_id, group_id, subgroup_id, auth_type_id)
                VALUES " . implode(',', $placeholders);
            
        $this->db->query($sql, $params);
    }

    private function checkInOutInsert(array $checkinOutRange): void
    {
        //event access policies
        if ($this->id > 0) {
            if (!empty($accessPolicy)) {
                $this->bulkinsertPolicies($accessPolicy);
            }

            //checkin checkout time ranges
            $sqlInOut = "INSERT INTO tbl_event_checkin_checkout_range (event_id, checkin_start_datetime,checkin_end_datetime,checkout_start_datetime,checkout_end_datetime)
                        VALUES (?,?,?,?,?)";

            $paramInOut = [
                $this->id,
                $checkinOutRange[0]["checkin_start_datetime"],
                $checkinOutRange[0]["checkin_end_datetime"],
                (isset($checkinOutRange[0]["checkout_start_datetime"]) ? $checkinOutRange[0]["checkout_start_datetime"] : null),
                (isset($checkinOutRange[0]["checkout_end_datetime"]) ? $checkinOutRange[0]["checkout_end_datetime"] : null)
            ];

            $this->db->query($sqlInOut, $paramInOut);
        }
    }

}
