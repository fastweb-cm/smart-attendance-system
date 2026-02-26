<?php

namespace App\Modules\Users\Models;

use App\Core\Database;

class Users
{
    private Database $db;

    // Core User Properties
    private ?int $id = null;
    private ?int $class_id = null;
    private ?string $fname = null;
    private ?string $lname = null;
    private ?string $email = null;
    private ?string $gender = null;
    private ?string $username = null;
    private ?string $password_hash = null;
    private ?string $user_type = null;
    private ?string $status = 'active';
    private ?string $biometric_enrollment_status = 'pending';

    // Student/Staff Specific
    private ?string $regno = null;
    private ?int $role_id = null;

    public function __construct()
    {
        $this->db = Database::connect();
    }

    // =======================
    // Getters and Setters
    // =======================
    public function getId(): ?int { return $this->id; }
    public function setId(int $id): void { $this->id = $id; }

    public function getClassId(): ?int { return $this->class_id; }
    public function setClassId(?int $class_id): void { $this->class_id = $class_id; }

    public function getFname(): ?string { return $this->fname; }
    public function setFname(string $fname): void { $this->fname = $fname; }

    public function getLname(): ?string { return $this->lname; }
    public function setLname(string $lname): void { $this->lname = $lname; }

    public function getEmail(): ?string { return $this->email; }
    public function setEmail(?string $email): void { $this->email = $email; }

    public function getGender(): ?string { return $this->gender; }
    public function setGender(?string $gender): void { $this->gender = $gender; }

    public function getUsername(): ?string { return $this->username; }
    public function setUsername(?string $username): void { $this->username = $username; }

    public function getPasswordHash(): ?string { return $this->password_hash; }
    public function setPasswordHash(?string $password_hash): void { $this->password_hash = $password_hash; }

    public function getUserType(): ?string { return $this->user_type; }
    public function setUserType(string $user_type): void { $this->user_type = $user_type; }

    public function getStatus(): ?string { return $this->status; }
    public function setStatus(string $status): void { $this->status = $status; }

    public function getBiometricEnrollmentStatus(): ?string { return $this->biometric_enrollment_status; }
    public function setBiometricEnrollmentStatus(string $status): void { $this->biometric_enrollment_status = $status; }

    public function getRegno(): ?string { return $this->regno; }
    public function setRegno(?string $regno): void { $this->regno = $regno; }

    public function getRoleId(): ?int { return $this->role_id; }
    public function setRoleId(?int $role_id): void { $this->role_id = $role_id; }

    // =======================
    // CRUD Methods
    // =======================

    public function createUser(): ?array
    {
        $sqlUser = "INSERT INTO tbl_user
            (class_id, fname, lname, email, gender, username, password_hash, user_type, status, biometric_enrollment_status)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";
        
        $paramsUser = [
            $this->class_id,
            $this->fname,
            $this->lname,
            $this->email,
            $this->gender,
            $this->username,
            $this->password_hash,
            $this->user_type,
            $this->status,
            $this->biometric_enrollment_status
        ];

        $this->db->query($sqlUser, $paramsUser);
        $this->id = $this->db->lastInsertId();

        if ($this->user_type === 'student') {
            $sqlStudent = "INSERT INTO tbl_student (user_id, regno, class_id) VALUES (?, ?, ?)";
            $this->db->query($sqlStudent, [$this->id, $this->regno, $this->class_id]);
        } elseif ($this->user_type === 'staff') {
            $sqlStaff = "INSERT INTO tbl_staff (user_id, role_id) VALUES (?, ?)";
            $this->db->query($sqlStaff, [$this->id, $this->role_id]);
        }

        return $this->getUserById($this->id);
    }

    public function storeRefresh($userid, $hash)
    {
        $expiresAt = date('Y-m-d H:i:s', time() + 86400 * 30); // 30 days
        
        $sql = "INSERT INTO tbl_refreshtokens(user_id,token_hash,expires_at)
            VALUES(?,?,?)";
        $params = [$userid, $hash, $expiresAt];

        $this->db->query($sql, $params);
    }

    public function updateUser(): ?array
    {
        if (!$this->id) return null;

        $fields = [];
        $params = [];

        $props = [
            'fname', 'lname', 'email', 'gender', 'username', 'password_hash', 
            'status', 'biometric_enrollment_status', 'class_id', 'user_type'
        ];

        foreach ($props as $prop) {
            $getter = "get" . ucfirst($prop);
            if ($this->$prop !== null) {
                $fields[] = "$prop = ?";
                $params[] = $this->$prop;
            }
        }

        if (!empty($fields)) {
            $params[] = $this->id;
            $sql = "UPDATE tbl_user SET " . implode(", ", $fields) . " WHERE id = ?";
            $this->db->query($sql, $params);
        }

        // Update student/staff table
        if ($this->user_type === 'student') {
            $fieldsStudent = [];
            $paramsStudent = [];
            if ($this->regno !== null) {
                $fieldsStudent[] = "regno = ?";
                $paramsStudent[] = $this->regno;
            }
            if ($this->class_id !== null) {
                $fieldsStudent[] = "class_id = ?";
                $paramsStudent[] = $this->class_id;
            }
            if (!empty($fieldsStudent)) {
                $paramsStudent[] = $this->id;
                $sqlStudent = "UPDATE tbl_student SET " . implode(", ", $fieldsStudent) . " WHERE user_id = ?";
                $this->db->query($sqlStudent, $paramsStudent);
            }
        } elseif ($this->user_type === 'staff' && $this->role_id !== null) {
            $sqlStaff = "UPDATE tbl_staff SET role_id = ? WHERE user_id = ?";
            $this->db->query($sqlStaff, [$this->role_id, $this->id]);
        }

        return $this->getUserById($this->id);
    }

    public function deleteUser(): bool
    {
        if (!$this->id) return false;
        $sql = "DELETE FROM tbl_user WHERE id = ?";
        $this->db->query($sql, [$this->id]);
        return $this->db->affectedRows() > 0;
    }

    public function getUserById(int $id): ?array
    {
        $sql = "SELECT u.*, s.regno, s.class_id AS student_class_id, st.role_id
                FROM tbl_user u
                LEFT JOIN tbl_student s ON u.id = s.user_id
                LEFT JOIN tbl_staff st ON u.id = st.user_id
                WHERE u.id = ?";
        $result = $this->db->query($sql, [$id]);
        return $result && $result->num_rows > 0 ? $result->fetch_assoc() : null;
    }

    public function findByUsername(string $username): ?array
    {
        $sql = "SELECT u.*,st.role_id,r.role_name AS role FROM tbl_user u
                JOIN tbl_staff st ON u.id = st.user_id
                JOIN lkup_role r ON r.id = st.role_id
                WHERE u.username = ?";
        $result = $this->db->query($sql, [$username]);
        return $result && $result->num_rows > 0 ? $result->fetch_assoc() : null;
    }

    public function findAdmin(int $userId)
    {
        $sql = "SELECT u.*,st.role_id,r.role_name AS role FROM tbl_user u
                JOIN tbl_staff st ON u.id = st.user_id
                JOIN lkup_role r ON r.id = st.role_id
                WHERE u.id = ?";
        $result = $this->db->query($sql, [$userId]);
        return $result && $result->num_rows > 0 ? $result->fetch_assoc() : null;
    }

    public function findValidByUserToken(string $token): ?array
    {
        $sql = "SELECT * FROM tbl_refreshtokens 
            WHERE revoked 0 AND expires_at > NOW()
            LIMIT 1";
        $result = $this->db->query($sql);
        if ($result){
            $row = $result->fetch_assoc();
            // lets verify the token against the stored hashed token
            if(password_verify($token, $row['token_hash'])){
                return $row;
            }
        }

        return null; // no match
    }

    public function revokeToken(int $id): bool {
        $sql = 'UPDATE tbl_refreshtokens
            SET  revoked = 1
            WHERE id = ?';
        $result = $this->db->query($sql, [$id]);

        return $result ? true : false;
    }

    public function revokeByToken(string $tokenHash)
    {
        $sql = 'UPDATE tbl_refreshtokens
            SET  revoked = 1
            WHERE token_hash = ?';
        $this->db->query($sql, [$tokenHash]);

    }

    public function listUsers(?string $userType = null, ?string $status = null, int $limit = 100, int $offset = 0): array
    {
        $sql = "SELECT u.id, u.gender, u.status, u.biometric_enrollment_status,
               CONCAT(u.fname, ' ', u.lname) AS name,
               c.class_name AS class,
               r.role_name AS role,
               s.regno AS studentregno
        FROM tbl_user u
        LEFT JOIN tbl_student s ON u.id = s.user_id
        LEFT JOIN tbl_class c ON u.class_id = c.id
        LEFT JOIN tbl_staff st ON u.id = st.user_id
        LEFT JOIN lkup_role r ON st.role_id = r.id";
        
        $conditions = [];
        $params = [];

        if ($userType) {
            $conditions[] = "u.user_type = ?";
            $params[] = $userType;
        }
        if ($status) {
            $conditions[] = "u.status = ?";
            $params[] = $status;
        }

        if (!empty($conditions)) {
            $sql .= " WHERE " . implode(" AND ", $conditions);
        }

        // $sql .= " ORDER BY u.id DESC LIMIT ? OFFSET ?";
        // $params[] = $limit;
        // $params[] = $offset;

        $result = $this->db->query($sql, $params);
        $users = [];
        if ($result) {
            while ($row = $result->fetch_assoc()) {
                $users[] = $row;
            }
        }
        return $users;
    }
}
