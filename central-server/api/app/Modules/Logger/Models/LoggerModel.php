<?php

namespace App\Modules\Logger\Models;

use App\Core\Database;

class LoggerModel
{
    private Database $db;

    public function __construct()
    {
        $this->db = Database::connect();
    }

    /**
     * Fetch paginated and filtered logs
     * * @param string|null $category 'system', 'sync', 'biometric', etc.
     * @param string|null $level    'info', 'warning', 'error'
     * @param string|null $startDate Y-m-d H:i:s or Y-m-d
     * @param string|null $endDate   Y-m-d H:i:s or Y-m-d
     * @param int $page
     * @param int $limit
     * @return array Contains 'data' (rows) and 'pagination' meta
     */
    public function fetchLogs(
        ?string $category = null,
        ?string $level = null,
        ?string $startDate = null,
        ?string $endDate = null,
        int $page = 1,
        int $limit = 50
    ): array {
        $where = [];
        $params = [];

        // 1. Build dynamic filtering criteria
        if (!empty($category)) {
            $where[] = "l.category = ?";
            $params[] = $category;
        }

        if (!empty($level)) {
            $where[] = "l.log_level = ?";
            $params[] = $level;
        }

        if (!empty($startDate)) {
            $where[] = "l.date_created >= ?";
            $params[] = $startDate;
        }

        if (!empty($endDate)) {
            // If it's just a simple date (Y-m-d), extend it to the end of that day
            if (strlen($endDate) === 10) {
                $endDate .= ' 23:59:59';
            }
            $where[] = "l.date_created <= ?";
            $params[] = $endDate;
        }

        $whereClause = !empty($where) ? "WHERE " . implode(" AND ", $where) : "";

        // 2. Count Total Records matching criteria (for frontend pagination stats)
        $countSql = "SELECT COUNT(*) as total FROM tbl_logs $whereClause";
        $countResult = $this->db->query($countSql, $params);
        $totalRows = $countResult ? (int)$countResult->fetch_assoc()['total'] : 0;

        // 3. Handle Pagination Math safely
        $totalPages = $totalRows > 0 ? ceil($totalRows / $limit) : 1;
        $page = max(1, min($page, $totalPages)); // Clamp page value bounds
        $offset = ($page - 1) * $limit;

        // 4. Retrieve Dataset
        $dataSql = "SELECT l.id, l.category, l.log_level, l.description, l.ip_address,l.request_uri,l.context_data, l.date_created,
                    CONCAT(u.fname, ' ', u.lname) AS name, r.role_name 
                    FROM tbl_logs l
                    LEFT JOIN tbl_user u ON l.user_id = u.id
                    LEFT JOIN tbl_staff s ON u.id = s.user_id
                    LEFT JOIN lkup_role r ON s.role_id = r.id
                    $whereClause 
                    ORDER BY l.id DESC 
                    LIMIT ? OFFSET ?";
        
        // Append limit and offset to parameters array
        $finalParams = array_merge($params, [$limit, $offset]);
        $dataResult = $this->db->query($dataSql, $finalParams);
        $rows = $dataResult ? $dataResult->fetch_all(MYSQLI_ASSOC) : [];

        // Parse JSON fields dynamically back into native PHP structures before returning
        foreach ($rows as &$row) {
            $row['context_data'] = $row['context_data'] ? json_decode($row['context_data'], true) : null;
        }

        return [
            'data' => $rows,
            'pagination' => [
                'total_records' => $totalRows,
                'total_pages'   => $totalPages,
                'current_page'  => $page,
                'limit'         => $limit
            ]
        ];
    }
}
