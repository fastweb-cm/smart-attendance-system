<?php

namespace App\Modules\Exceptions\Models;

use App\Core\Database;
use App\Core\Logger;
use Throwable;

class ExceptionModel extends Database
{
    protected Database $db;
    private ?int $id = null;

    private string $title;
    private string $exception_type;
    private ?string $description = null;
    private string $start_date;
    private string $end_date;
    private int $created_by;
    private ?string $date_created = null;

    public function __construct()
    {
        $this->db = Database::connect();
    }

    public function getId(): ?int { return $this->id; }
    public function getTitle(): string { return $this->title; }
    public function getExceptionType(): string { return $this->exception_type; }
    public function getDescription(): ?string { return $this->description; }
    public function getStartDate(): string { return $this->start_date; }
    public function getEndDate(): string { return $this->end_date; }
    public function getCreatedBy(): int { return $this->created_by; }
    public function getDateCreated(): ?string { return $this->date_created; }

    public function setId(int $id): void { $this->id = $id; }
    public function setTitle(string $title): void { $this->title = $title; }
    public function setExceptionType(string $exception_type): void { $this->exception_type = $exception_type; }
    public function setDescription(?string $description): void { $this->description = $description; }
    public function setStartDate(string $start_date): void { $this->start_date = $start_date; }
    public function setEndDate(string $end_date): void { $this->end_date = $end_date; }
    public function setCreatedBy(int $created_by): void { $this->created_by = $created_by; }
    public function setDateCreated(?string $date_created): void { $this->date_created = $date_created; }

    public function upsert(): bool
    {
        try {
            // Determine if this operation is an Update or a fresh Creation beforehand
            $isNewInsert = (is_null($this->id) || $this->id === 0);

            $sql = "INSERT INTO tbl_exception (id, title, exception_type, description, start_date, end_date, created_by, date_created) 
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                ON DUPLICATE KEY UPDATE 
                    title = VALUES(title),
                    exception_type = VALUES(exception_type),
                    description = VALUES(description),
                    start_date = VALUES(start_date),
                    end_date = VALUES(end_date),
                    created_by = VALUES(created_by),
                    date_created = VALUES(date_created)";
                    
            $params = [
                $this->id,
                $this->title,
                $this->exception_type,
                $this->description,
                $this->start_date,
                $this->end_date,
                $this->created_by,
                $this->date_created
            ];
            
            $this->db->query($sql, $params);
            
            // Safe fallback logic for identity assignment
            $insertId = $this->db->lastInsertId();
            $this->id = ($insertId > 0) ? $insertId : $this->id;

            // -----------------------------------------------------------------
            // SYSTEM AUDIT LOG
            // -----------------------------------------------------------------
            $action = $isNewInsert ? 'exception_create' : 'exception_update';
            $logMsg = $isNewInsert 
                ? sprintf("Admin created calendar exception override: '%s' (%s) from %s to %s", $this->title, $this->exception_type, $this->start_date, $this->end_date)
                : sprintf("Admin modified calendar exception configurations for override ID: %d ('%s')", $this->id, $this->title);

            Logger::log(
                'system',
                'info',
                $logMsg,
                null, // AppContext auto-picks up active Admin User ID 
                [
                    'exception_id'   => $this->id,
                    'title'          => $this->title,
                    'exception_type' => $this->exception_type,
                    'action'         => $action
                ]
            );

            return true;
        } catch (Throwable $e) {
            throw $e;
        }
    }

    public function delete(int $id): bool
    {
        try {
            $sql = "DELETE FROM tbl_exception WHERE id = ?";
            $this->db->query($sql, [$id]);

            // -----------------------------------------------------------------
            // SYSTEM AUDIT LOG
            // -----------------------------------------------------------------
            Logger::log(
                'system',
                'info',
                sprintf("Admin deleted calendar exception schedule override entry ID: %d", $id),
                null,
                ['exception_id' => $id, 'action' => 'exception_delete']
            );

            return true;
        } catch (Throwable $e) {
            throw $e;
        }
    }

    public function findById(int $id): ?array
    {
        try {
            // Read actions bypass system modification logging tracking rules
            $sql = "SELECT ex.*, CONCAT(u.fname, ' ', u.lname) AS created_by_name 
                    FROM tbl_exception ex 
                    LEFT JOIN tbl_user u ON ex.created_by = u.id 
                    WHERE ex.id = ?";
            $result = $this->db->query($sql, [$id]);
            return $result ? $result->fetch_assoc() : [];
        } catch (Throwable $e) {
            throw $e;
        }
    }

    public function findAll(string $exception_type = ''): array
    {
        try {
            $sql = "SELECT ex.*, CONCAT(u.fname, ' ', u.lname) AS created_by_name 
                    FROM tbl_exception ex 
                    LEFT JOIN tbl_user u ON ex.created_by = u.id";
            $params = [];
            if ($exception_type) {
                $sql .= " WHERE ex.exception_type LIKE ?";
                $params[] = "%$exception_type%";
            }
            $result = $this->db->query($sql, $params);
            return $result ? $result->fetch_all(MYSQLI_ASSOC) : [];
        } catch (Throwable $e) {
            throw $e;
        }
    }
}
