<?php
namespace App\Modules\Attendance\Models;

use App\Core\Database;
use Throwable;

class AttendanceModel extends Database
{
    protected Database $db;

    public function __construct()
    {
        $this->db = Database::connect();
    }

public function getAttendanceLedger($start_date, $end_date, $status, $page = 1, $limit = 10): ?array
{
    try {
        $page = max(1, (int)$page);
        $limit = max(1, (int)$limit);
        $offset = ($page - 1) * $limit;

        // 1. Generate array of calendar dates for column headers
        $calendarDates = [];
        $current = strtotime($start_date);
        $last = strtotime($end_date);
        while ($current <= $last) {
            $calendarDates[] = [
                'raw' => date('Y-m-d', $current),
                'label' => date('M d', $current),
                'isWeekend' => in_array(date('N', $current), [6, 7]),
                'dayName' => date('D', $current)
            ];
            $current = strtotime('+1 day', $current);
        }

        // 2. Fetch global calendar exceptions
        $sqlExceptions = "SELECT start_date AS date, title AS name, exception_type AS type FROM tbl_exception
                        WHERE start_date BETWEEN ? AND ?";
        $exceptionsRes = $this->db->query($sqlExceptions, [$start_date, $end_date]);
        $attendanceExceptions = $exceptionsRes ? $exceptionsRes->fetch_all(MYSQLI_ASSOC) : [];

        // 3. PAGINATION META: Get total matching users count first
        $sqlCount = "SELECT COUNT(*) as total FROM tbl_user u WHERE u.status = 'active'";
        $countRes = $this->db->query($sqlCount);
        $totalRecords = $countRes ? (int)$countRes->fetch_assoc()['total'] : 0;
        $totalPages = ceil($totalRecords / $limit);

        // 4. Fetch ONLY the specific chunk of users for the current page
        $sqlUsers = "SELECT u.id, CONCAT(u.fname, ' ', u.lname) AS name, u.user_type,
                        CASE 
                            WHEN u.user_type = 'staff' THEN r.role_name
                            ELSE 'Student'
                        END AS role
                    FROM tbl_user u
                    LEFT JOIN tbl_staff s ON u.id = s.user_id
                    LEFT JOIN lkup_role r ON s.role_id = r.id
                    WHERE u.status = 'active'
                    ORDER BY u.fname, u.lname
                    LIMIT ? OFFSET ?";

        $usersRes = $this->db->query($sqlUsers, [$limit, $offset]);
        $rawUsers = $usersRes ? $usersRes->fetch_all(MYSQLI_ASSOC) : [];

        if (empty($rawUsers)) {
            return [
                'calendarDates' => $calendarDates,
                'exceptions' => $attendanceExceptions,
                'users' => [],
                'initialAttendanceSummary' => [],
                'meta' => [
                    'total_records' => $totalRecords,
                    'current_page' => $page,
                    'total_pages' => $totalPages,
                    'limit' => $limit
                ]
            ];
        }

        // Collect specific user IDs on this page to optimize the attendance summary query
        $pageUserIds = array_column($rawUsers, 'id');
        
        $colors = ['bg-emerald-100', 'bg-sky-100', 'bg-yellow-100', 'bg-pink-100', 'bg-purple-100', 'bg-orange-100'];
        $formattedUsers = [];
        foreach ($rawUsers as $index => $user) {
            $formattedUsers[] = [
                'id' => $user['id'],
                'name' => $user['name'],
                'role' => $user['role'],
                'avatarColor' => $colors[$index % count($colors)]
            ];
        }

        // 5. Fetch attendance records *exclusively* for the users on this page
        // This stops the DB from parsing rows for users we aren't displaying!
        $userIdPlaceholders = implode(',', array_fill(0, count($pageUserIds), '?'));
        
        $sqlSummary = "SELECT 
                summary.user_id, 
                summary.attendance_date AS date, 
                summary.first_checkin, 
                summary.last_checkout,
                summary.total_hours, 
                summary.attendance_status, 
                summary.derived_from_session,
                -- Fetching raw transaction records from the session table
                COALESCE(sess.checkin_status, 'on time') AS checkin_status,
                COALESCE(sess.session_status, 'completed') AS session_status
               FROM tbl_attendance_summary summary
               LEFT JOIN tbl_attendance_session sess 
                 ON summary.user_id = sess.user_id 
                 AND summary.first_checkin = sess.checkin_timestamp
               WHERE summary.attendance_date BETWEEN ? AND ? 
               AND summary.user_id IN ($userIdPlaceholders)";
        
        $summaryParams = array_merge([$start_date, $end_date], $pageUserIds);
        
        if (!empty($status)) {
            $sqlSummary .= " AND attendance_status = ?";
            $summaryParams[] = $status;
        }

        $summaryRes = $this->db->query($sqlSummary, $summaryParams);
        $rawSummary = $summaryRes ? $summaryRes->fetch_all(MYSQLI_ASSOC) : [];

        // Index summary records
        $indexedSummary = [];
        foreach ($rawSummary as $row) {
            $indexedSummary[$row['user_id']][$row['date']] = $row;
        }

        // 6. Synthesize dense attendance matrix for this page's users
        $initialAttendanceSummary = [];
        foreach ($formattedUsers as $user) {
            $uId = $user['id'];

            foreach ($calendarDates as $calDate) {
                $targetDate = $calDate['raw'];

                if (isset($indexedSummary[$uId][$targetDate])) {
                    $record = $indexedSummary[$uId][$targetDate];

                    $firstCheckin = $record['first_checkin'] ? date('c', strtotime($record['first_checkin'])) : null;
                    $lastCheckout = $record['last_checkout'] ? date('c', strtotime($record['last_checkout'])) : null;

                    // If the user's summary status says absent, let that trump raw connection statuses
                    $isAbsent = ($record['attendance_status'] === 'absent');

                    $initialAttendanceSummary[] = [
                        'employee_id'          => $uId,
                        'date'                 => $targetDate,
                        'first_checkin'        => $firstCheckin,
                        'last_checkout'        => $lastCheckout,
                        'total_hours'          => (float)$record['total_hours'],
                        'checkin_status'       => $isAbsent ? 'absent' : str_replace(' ', '_', $record['checkin_status']), 
                        'session_status'       => $isAbsent ? 'no_show' : str_replace(' ', '_', $record['session_status']),
                        'derived_from_session' => (int)$record['derived_from_session'],
                        'variance'             => ($record['attendance_status'] === 'late') ? 15 : 0 
                    ];
                } else {
                    $initialAttendanceSummary[] = [
                        'employee_id'          => $uId,
                        'date'                 => $targetDate,
                        'first_checkin'        => null,
                        'last_checkout'        => null,
                        'total_hours'          => 0.0,
                        'checkin_status'       => 'absent',
                        'session_status'       => 'no_show',
                        'derived_from_session' => 1,
                        'variance'             => 0
                    ];
                }
            }
        }

        return [
            'calendarDates' => $calendarDates,
            'exceptions' => $attendanceExceptions,
            'users' => $formattedUsers,
            'initialAttendanceSummary' => $initialAttendanceSummary,
            'meta' => [
                'total_records' => $totalRecords,
                'current_page' => $page,
                'total_pages' => $totalPages,
                'limit' => $limit
            ]
        ];
    } catch (Throwable $e) {
        throw $e;
    }
}
}
