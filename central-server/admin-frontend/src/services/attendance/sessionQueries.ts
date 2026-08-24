import { getAttendanceSessionsOptions, getAttendanceSessionsQueryKey } from "@/client/@tanstack/react-query.gen";
import { AttendanceSessionQueryParams } from "@/types";

const buildQuery = (filters?: AttendanceSessionQueryParams) => ({
  from_date: filters?.from_date,
  to_date: filters?.to_date,
  context: filters?.context,
  event_id: filters?.event_id,
  terminal_ids: filters?.terminal_ids,
  status: filters?.status,
  search: filters?.search,
  page: filters?.page,
  limit: filters?.limit,
});

export const getAttendanceSessionsQuery = (filters?: AttendanceSessionQueryParams) =>
  getAttendanceSessionsOptions({ query: buildQuery(filters) });

export const attendanceSessionsQueryKey = (filters?: AttendanceSessionQueryParams) =>
  getAttendanceSessionsQueryKey({ query: buildQuery(filters) });
