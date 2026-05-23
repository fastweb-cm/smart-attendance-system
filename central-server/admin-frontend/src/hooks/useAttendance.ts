import { queryClient } from "@/lib/queryClient";
import { updateAttendanceMutation } from "@/services/attendance/mutation";
import { getAttendanceLedgerQuery, attendanceLedgerQueryKey, getUserAttendanceAnalyticsQuery, UserAttendanceAnalyticsQueryKey } from "@/services/attendance/queries";
import { AttendanceQueryParams } from "@/types";
import { useMutation, useQuery } from "@tanstack/react-query";
import { toast } from "react-toastify";

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
            calendarDates: response.data?.calendarDates || [],
            metrics: response?.data?.metrics || {},
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

// update attendance status and invalidate stale record
export const useUpdateAttendance = () => {
    return useMutation({
        ...updateAttendanceMutation(),
        onSuccess: async (res) => {
            toast.success(res.message || "Attendance system override was successfull")

            // invalidate global ledger matrix
            await queryClient.invalidateQueries({
                queryKey: attendanceLedgerQueryKey()
            })

            // Clear out targeted raw terminal trails (Zone C) if the backend returns the scoped userId
            if (res?.userId) {
                await queryClient.invalidateQueries({
                    queryKey: UserAttendanceAnalyticsQueryKey(res.userId),
                });
            }
        },
        onError: (error) => {
            toast.error(error.message || "Error performing system override on attendance record")
        }
    })
}
