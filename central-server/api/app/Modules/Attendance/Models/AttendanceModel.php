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

public function getAttendanceLedger($start_date, $end_date, $status, $page = 1, $limit = 10, string $attendance_context = 'daily', ?string $searchQuery = null): ?array
{
    try {
        $page = max(1, (int)$page);
        $limit = max(1, (int)$limit);
        $offset = ($page - 1) * $limit;

        // ==========================================
        //  GENERATE COLUMNS BASED ON CONTEXT
        // ==========================================
        $calendarDates = [];
        $eventIds = [];

        if ($attendance_context === 'event') {
            // Fetch real events that fall within the range
            $sqlEvents = "SELECT id, name, DATE(start_datetime) as date_only 
                          FROM tbl_event 
                          WHERE start_datetime BETWEEN ? AND ? 
                          ORDER BY start_datetime ASC";
            $eventsRes = $this->db->query($sqlEvents, [$start_date . ' 00:00:00', $end_date . ' 23:59:59']);
            $rawEvents = $eventsRes ? $eventsRes->fetch_all(MYSQLI_ASSOC) : [];

            foreach ($rawEvents as $evt) {
                $calendarDates[] = [
                    'raw'       => (string)$evt['id'], // Use Event ID as the target lookup handle
                    'label'     => $evt['name'],       // Display name of the event as the column header
                    'isWeekend' => false,
                    'dayName'   => date('M d', strtotime($evt['date_only']))
                ];
                $eventIds[] = $evt['id'];
            }
        } else {
            // Standard Daily Logic: Generate array of calendar dates for column headers
            $current = strtotime($start_date);
            $last = strtotime($end_date);
            while ($current <= $last) {
                $calendarDates[] = [
                    'raw'       => date('Y-m-d', $current),
                    'label'     => date('M d', $current),
                    'isWeekend' => in_array(date('N', $current), [6, 7]),
                    'dayName'   => date('D', $current)
                ];
                $current = strtotime('+1 day', $current);
            }
        }

        //  Fetch global calendar exceptions (Only meaningful for standard daily schedules)
        $attendanceExceptions = [];
        if ($attendance_context === 'daily') {
            $sqlExceptions = "SELECT start_date AS date, title AS name, exception_type AS type FROM tbl_exception
                            WHERE start_date BETWEEN ? AND ?";
            $exceptionsRes = $this->db->query($sqlExceptions, [$start_date, $end_date]);
            $attendanceExceptions = $exceptionsRes ? $exceptionsRes->fetch_all(MYSQLI_ASSOC) : [];
        }

        // ==========================================
        //  PAGINATION META WITH DYNAMIC SEARCH
        // ==========================================
        $countParams = [];
        $sqlCount = "SELECT COUNT(*) as total 
                     FROM tbl_user u 
                     LEFT JOIN tbl_staff s ON u.id = s.user_id
                     LEFT JOIN tbl_student st ON u.id = st.user_id
                     LEFT JOIN lkup_role r ON s.role_id = r.id
                     WHERE u.status = 'active'";
                     
        if ($searchQuery !== null) {
            $sqlCount .= " AND (CONCAT(u.fname, ' ', u.lname) LIKE ? 
                            OR s.sregno LIKE ? 
                            OR st.regno LIKE ? 
                            OR r.role_name LIKE ?)";
            $likeSearch = '%' . $searchQuery . '%';
            $countParams = [$likeSearch, $likeSearch, $likeSearch, $likeSearch];
        }

        $countRes = $this->db->query($sqlCount, $countParams);
        $totalRecords = $countRes ? (int)$countRes->fetch_assoc()['total'] : 0;
        $totalPages = ceil($totalRecords / $limit);

        // System metrics aggregation based on active context window
        $metricsParams = [$attendance_context];
        $sqlMetrics = "SELECT 
            SUM(CASE WHEN LOWER(sess.checkin_status) = 'late' THEN 1 ELSE 0 END) AS total_late,
            SUM(CASE WHEN LOWER(sess.session_status) = 'missed checkout' THEN 1 ELSE 0 END) AS total_missed_checkout,
            SUM(CASE WHEN summary.derived_from_session = 0 THEN 1 ELSE 0 END) AS total_audit_override
        FROM tbl_attendance_summary summary
        LEFT JOIN tbl_attendance_session sess 
            ON summary.user_id = sess.user_id 
            AND summary.first_checkin = sess.checkin_timestamp
        WHERE summary.attendance_context = ?";

        if ($attendance_context === 'event') {
            if (!empty($eventIds)) {
                $eventPlaceholders = implode(',', array_fill(0, count($eventIds), '?'));
                $sqlMetrics .= " AND summary.event_id IN ($eventPlaceholders)";
                $metricsParams = array_merge($metricsParams, $eventIds);
            } else {
                $sqlMetrics .= " AND 1=0";
            }
        } else {
            $sqlMetrics .= " AND summary.attendance_date BETWEEN ? AND ?";
            $metricsParams[] = $start_date;
            $metricsParams[] = $end_date;
        }

        $metricsRes = $this->db->query($sqlMetrics, $metricsParams);
        $rawMetrics = $metricsRes ? $metricsRes->fetch_assoc() : null;

        $globalMetrics = [
            'total_late'            => (int)($rawMetrics['total_late'] ?? 0),
            'total_missed_checkout' => (int)($rawMetrics['total_missed_checkout'] ?? 0),
            'total_audit_override'  => (int)($rawMetrics['total_audit_override'] ?? 0)
        ];

        // ==========================================
        // FETCH ONLY THE MATCHING SEARCH CHUNK OF USERS
        // ==========================================
        $userParams = [];
        $sqlUsers = "SELECT u.id, CONCAT(u.fname, ' ', u.lname) AS name, u.user_type,
                        CASE 
                            WHEN u.user_type = 'staff' THEN r.role_name
                            ELSE 'Student'
                        END AS role,
                        CASE
                            WHEN u.user_type = 'staff' THEN s.sregno
                            ELSE st.regno
                        END AS regno
                    FROM tbl_user u
                    LEFT JOIN tbl_staff s ON u.id = s.user_id
                    LEFT JOIN tbl_student st ON u.id = st.user_id
                    LEFT JOIN lkup_role r ON s.role_id = r.id
                    WHERE u.status = 'active'";

        if ($searchQuery !== null) {
            $sqlUsers .= " AND (CONCAT(u.fname, ' ', u.lname) LIKE ? 
                            OR s.sregno LIKE ? 
                            OR st.regno LIKE ? 
                            OR r.role_name LIKE ?)";
            $likeSearch = '%' . $searchQuery . '%';
            $userParams = [$likeSearch, $likeSearch, $likeSearch, $likeSearch];
        }

        $sqlUsers .= " ORDER BY u.fname, u.lname LIMIT ? OFFSET ?";
        $userParams[] = $limit;
        $userParams[] = $offset;

        $usersRes = $this->db->query($sqlUsers, $userParams);
        $rawUsers = $usersRes ? $usersRes->fetch_all(MYSQLI_ASSOC) : [];

        if (empty($rawUsers) || empty($calendarDates)) {
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

        $pageUserIds = array_column($rawUsers, 'id');
        
        $colors = ['bg-emerald-500','bg-indigo-500','bg-amber-500','bg-rose-500'];
        $formattedUsers = [];
        foreach ($rawUsers as $index => $user) {
            $formattedUsers[] = [
                'id' => $user['id'],
                'name' => $user['name'],
                'role' => $user['role'],
                'regno' => $user['regno'],
                'avatarColor' => $colors[$index % count($colors)]
            ];
        }

        // ==========================================
        // FETCH ATTENDANCE SUMMARY RECORDS
        // ==========================================
        $userIdPlaceholders = implode(',', array_fill(0, count($pageUserIds), '?'));
        
        $sqlSummary = "SELECT 
                summary.user_id, 
                summary.attendance_date AS date, 
                summary.event_id, 
                summary.first_checkin, 
                summary.last_checkout,
                summary.total_hours, 
                summary.attendance_status, 
                summary.derived_from_session,
                COALESCE(sess.checkin_status, 'on time') AS checkin_status,
                COALESCE(sess.session_status, 'completed') AS session_status
               FROM tbl_attendance_summary summary
               LEFT JOIN tbl_attendance_session sess 
                 ON summary.user_id = sess.user_id 
                 AND summary.first_checkin = sess.checkin_timestamp
               WHERE summary.attendance_context = ?
               AND summary.user_id IN ($userIdPlaceholders)";
        
        $summaryParams = [$attendance_context];
        $summaryParams = array_merge($summaryParams, $pageUserIds);

        // Add date or event constraints depending on context
        if ($attendance_context === 'event') {
            if (!empty($eventIds)) {
                $eventPlaceholders = implode(',', array_fill(0, count($eventIds), '?'));
                $sqlSummary .= " AND summary.event_id IN ($eventPlaceholders)";
                $summaryParams = array_merge($summaryParams, $eventIds);
            } else {
                $sqlSummary .= " AND 1=0"; 
            }
        } else {
            $sqlSummary .= " AND summary.attendance_date BETWEEN ? AND ?";
            $summaryParams[] = $start_date;
            $summaryParams[] = $end_date;
        }
        
        if (!empty($status)) {
            $sqlSummary .= " AND summary.attendance_status = ?";
            $summaryParams[] = $status;
        }

        $summaryRes = $this->db->query($sqlSummary, $summaryParams);
        $rawSummary = $summaryRes ? $summaryRes->fetch_all(MYSQLI_ASSOC) : [];

        // Index the records using either event_id or date string as key
        $indexedSummary = [];
        foreach ($rawSummary as $row) {
            $lookupKey = ($attendance_context === 'event') ? (string)$row['event_id'] : $row['date'];
            $indexedSummary[$row['user_id']][$lookupKey] = $row;
        }

        // ==========================================
        // SYNTHESIZE DENSE ATTENDANCE MATRIX
        // ==========================================
        $initialAttendanceSummary = [];
        foreach ($formattedUsers as $user) {
            $uId = $user['id'];

            foreach ($calendarDates as $calDate) {
                $lookupKey = $calDate['raw']; 

                if (isset($indexedSummary[$uId][$lookupKey])) {
                    $record = $indexedSummary[$uId][$lookupKey];

                    $firstCheckin = $record['first_checkin'] ? date('c', strtotime($record['first_checkin'])) : null;
                    $lastCheckout = $record['last_checkout'] ? date('c', strtotime($record['last_checkout'])) : null;
                    $isAbsent = ($record['attendance_status'] === 'absent');

                    $initialAttendanceSummary[] = [
                        'employee_id'          => $uId,
                        'date'                 => $attendance_context === 'event' ? $record['date'] : $lookupKey,
                        'event_id'             => $attendance_context === 'event' ? (int)$lookupKey : null,
                        'first_checkin'        => $firstCheckin,
                        'last_checkout'        => $lastCheckout,
                        'total_hours'          => (float)$record['total_hours'],
                        'checkin_status'       => $isAbsent ? 'absent' : str_replace(' ', '_', $record['checkin_status']), 
                        'session_status'       => $isAbsent ? 'no_show' : str_replace(' ', '_', $record['session_status']),
                        'attendance_status'    => $record['attendance_status'],
                        'derived_from_session' => (int)$record['derived_from_session'],
                        'variance'             => ($record['attendance_status'] === 'late') ? 15 : 0 
                    ];
                } else {
                    $initialAttendanceSummary[] = [
                        'employee_id'          => $uId,
                        'date'                 => $attendance_context === 'event' ? null : $lookupKey,
                        'event_id'             => $attendance_context === 'event' ? (int)$lookupKey : null,
                        'first_checkin'        => null,
                        'last_checkout'        => null,
                        'total_hours'          => 0.0,
                        'checkin_status'       => 'absent',
                        'session_status'       => 'no_show',
                        'attendance_status'    => 'absent',
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
            'metrics' => $globalMetrics,
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

/**
 * Fetches analytical summary metrics and history maps for an individual user
 * 
 * @param int $userId Target user ID
 * @param string|null $startDate Filter date range starting bounds
 * @param string|null $endDate Filter date range closing bounds
 * @param int $page Active page position context
 * @param int $limit Total entry capacity limit restriction per page
 * @return array Structured data engine matching history and dynamic metrics
 */
public function getUserAttendanceDetails(int $userId, ?string $startDate = null, ?string $endDate = null, int $page = 1, int $limit = 15, string $attendance_context = 'daily'): array
{
    try {
        $page = max(1, (int)$page);
        $limit = max(1, (int)$limit);
        $offset = ($page - 1) * $limit;

        // 1. Fetch Aggregated Metrics with context checking constraint
        $sqlMetrics = "SELECT 
            COUNT(summary.id) AS total_expected_days,
            SUM(CASE WHEN LOWER(summary.attendance_status) IN ('present', 'missed checkout', 'late') THEN 1 ELSE 0 END) AS present_days,
            SUM(CASE WHEN LOWER(sess.checkin_status) = 'late' THEN 1 ELSE 0 END) AS late_arrivals,
            SUM(CASE WHEN LOWER(summary.attendance_status) = 'absent' THEN 1 ELSE 0 END) AS absent_days,
            SUM(CASE WHEN LOWER(summary.attendance_status) = 'on permission' THEN 1 ELSE 0 END) AS permission_days
        FROM tbl_attendance_summary summary 
        LEFT JOIN tbl_attendance_session sess 
            ON summary.user_id = sess.user_id 
            AND summary.first_checkin = sess.checkin_timestamp
        WHERE summary.user_id = ? AND summary.attendance_context = ?";
        
        $metricsRes = $this->db->query($sqlMetrics, [$userId, $attendance_context]);
        $metrics = $metricsRes ? $metricsRes->fetch_assoc() : [
            'total_expected_days' => 0, 'present_days' => 0, 
            'late_arrivals' => 0, 'absent_days' => 0, 'permission_days' => 0
        ];

        $adjustedExpected = max(0, (int)$metrics['total_expected_days'] - (int)$metrics['permission_days']);

        // 2. Count matching history rows with context verification
        $sqlCount = "SELECT COUNT(id) AS total FROM tbl_attendance_summary 
                     WHERE user_id = ? AND attendance_context = ?";
        $countParams = [$userId, $attendance_context];
        
        if ($startDate && $endDate) {
            $sqlCount .= " AND attendance_date BETWEEN ? AND ?";
            $countParams[] = $startDate;
            $countParams[] = $endDate;
        }
        $countRes = $this->db->query($sqlCount, $countParams);
        $totalLogs = $countRes ? (int)$countRes->fetch_assoc()['total'] : 0;

        // 3. Detailed Itemized Transaction History Query
        $sqlLogs = "SELECT 
                        summary.attendance_date AS date,
                        summary.first_checkin AS checkin,
                        summary.last_checkout AS checkout,
                        summary.total_hours AS hours,
                        summary.attendance_status AS status,
                        COALESCE(term.slug, 'unknown_terminal') AS terminal_id,
                        COALESCE(sess.sync_status, 'synced') AS sync_status
                    FROM tbl_attendance_summary summary
                    LEFT JOIN tbl_terminal term 
                      ON summary.terminal_id = term.id
                    LEFT JOIN tbl_attendance_session sess 
                      ON summary.user_id = sess.user_id 
                      AND summary.first_checkin = sess.checkin_timestamp
                    WHERE summary.user_id = ? AND summary.attendance_context = ?";
        
        $logParams = [$userId, $attendance_context];
        if ($startDate && $endDate) {
            $sqlLogs .= " AND summary.attendance_date BETWEEN ? AND ?";
            $logParams[] = $startDate;
            $logParams[] = $endDate;
        }
        
        $sqlLogs .= " ORDER BY summary.attendance_date DESC LIMIT ? OFFSET ?";
        $logParams[] = $limit;
        $logParams[] = $offset;

        $logsRes = $this->db->query($sqlLogs, $logParams);
        $rawLogs = $logsRes ? $logsRes->fetch_all(MYSQLI_ASSOC) : [];

        // 4. Sanitize and package metrics maps
        $history = [];
        foreach ($rawLogs as $log) {
            $history[] = [
                'date'        => $log['date'],
                'checkin'     => $log['checkin'] ? date('c', strtotime($log['checkin'])) : null,
                'checkout'    => $log['checkout'] ? date('c', strtotime($log['checkout'])) : null,
                'hours'       => (float)$log['hours'],
                'status'      => str_replace(' ', '_', strtolower($log['status'])),
                'terminal_id' => $log['terminal_id'],
                'sync_status' => strtolower($log['sync_status'])
            ];
        }

        return [
            'metrics' => [
                'expected_days'   => $adjustedExpected,
                'present_days'    => (int)$metrics['present_days'],
                'late_arrivals'   => (int)$metrics['late_arrivals'],
                'absent_days'     => (int)$metrics['absent_days'],
                'permission_days' => (int)$metrics['permission_days']
            ],
            'history' => $history,
            'meta' => [
                'total_records' => $totalLogs,
                'current_page'  => $page,
                'total_pages'   => ceil($totalLogs / $limit),
                'limit'         => $limit
            ]
        ];
    } catch (Throwable $e) {
        throw $e;
    }
}
}
