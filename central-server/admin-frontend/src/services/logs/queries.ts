
import { fetchLogsOptions, fetchLogsQueryKey } from "@/client/@tanstack/react-query.gen";
import { LogsQueryParams } from "@/types";

export const fetchLogs = (filters?: LogsQueryParams) => fetchLogsOptions({
    query:{
        category: filters?.category,
        level: filters?.level,
        start_date: filters?.start_date,
        end_date: filters?.end_date,
        page: filters?.page,
        limit: filters?.limit
    }
});

export const LogsQueryKey = (filters?: LogsQueryParams) => fetchLogsQueryKey({
    query:{
        category: filters?.category,
        level: filters?.level,
        start_date: filters?.start_date,
        end_date: filters?.end_date,
        page: filters?.page,
        limit: filters?.limit
    }
})
