
import { getAttendanceLedgerOptions, getAttendanceLedgerQueryKey, getUserAttendanceAnalyticsOptions, getUserAttendanceAnalyticsQueryKey } from "@/client/@tanstack/react-query.gen";
import { AttendanceQueryParams } from "@/types";

export const getAttendanceLedgerQuery = (filters?: AttendanceQueryParams) => getAttendanceLedgerOptions({
    query: {
        start_date: filters?.start_date,
        end_date: filters?.end_date,
        status: filters?.status,
        page: filters?.page,
        limit: filters?.limit,
        context: filters?.context,
        search: filters?.search
    }
})

//attendance ledger query key generator for cache management
export const attendanceLedgerQueryKey = (filters?: AttendanceQueryParams) => getAttendanceLedgerQueryKey({
    query: {
        start_date: filters?.start_date,
        end_date: filters?.end_date,
        status: filters?.status,
        page: filters?.page,
        limit: filters?.limit,
        context: filters?.context,
        search: filters?.search
    }
})

export const getUserAttendanceAnalyticsQuery = (userId: number, filters?: AttendanceQueryParams) => getUserAttendanceAnalyticsOptions({
    path: {
        id: userId
    },
    query: {
        start_date: filters?.start_date,
        end_date: filters?.end_date,
        page: filters?.page,
        limit: filters?.limit,
        context: filters?.context
    }
})

export const UserAttendanceAnalyticsQueryKey = (userId: number, filters?: AttendanceQueryParams) => getUserAttendanceAnalyticsQueryKey({
    path: {
        id: userId
    },
    query: {
        start_date: filters?.start_date,
        end_date: filters?.end_date,
        page: filters?.page,
        limit: filters?.limit,
        context: filters?.context
    }
})
