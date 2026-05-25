
import { fetchLogs, LogsQueryKey } from "@/services/logs/queries";
import { LogsQueryParams } from "@/types";
import { useQuery } from "@tanstack/react-query";

export const useLogs = (
    filters?: LogsQueryParams
) => useQuery({
    ...fetchLogs(filters),
    queryKey: LogsQueryKey(filters),
    select: (res) => {
        return {
            meta: res.meta,
            data: res.data
        }
    }
})
