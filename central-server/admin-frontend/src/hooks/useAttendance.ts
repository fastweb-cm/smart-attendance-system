import { getAttendanceLedgerQuery, attendanceLedgerQueryKey, getUserAttendanceAnalyticsQuery, UserAttendanceAnalyticsQueryKey } from "@/services/attendance/queries";
import { AttendanceQueryParams } from "@/types";
import { useQuery } from "@tanstack/react-query";

// get attendance records with optional filters
export const useAttendanceLedger = (
    filters?: AttendanceQueryParams
) => useQuery({
    ...getAttendanceLedgerQuery(filters),
    queryKey: attendanceLedgerQueryKey(filters),
    select: (response) => {
        return {
            users: response.data?.users || [],
            exceptions: response.data?.exceptions || [],
            attendanceSummary: response.data?.initialAttendanceSummary || [],
            meta: response.meta
        }
    }
})

// get user attendance analytics with optional filters
export const useUserAttendanceAnalytics = (
    userId: number,
    filters?: AttendanceQueryParams
) => useQuery({
    ...getUserAttendanceAnalyticsQuery(userId, filters),
    queryKey: UserAttendanceAnalyticsQueryKey(userId, filters),
    select: (response) => {
        return {
            attendanceSessions: response?.history || [],
            metrics: response?.metrics || {},
            meta: response.meta
        }
    }
})
