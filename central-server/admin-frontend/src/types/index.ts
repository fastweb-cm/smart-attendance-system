import { TerminalCreateFormValues } from "@/schema/terminal.schema";
import { ColumnDef, PaginationState } from "@tanstack/react-table";
import type { AttendanceLedgerData, FetchLogsResponses, GetAllPermissionsResponses, UserResponse } from "@/client";

interface Option {
  label: string
  value: string | number
}
export interface InputFieldProps {
  label?: string;
type?: React.HTMLInputTypeAttribute;
  name: string;
  required?: boolean;
  options?: Option[];
  defaultValue?: string;
  inputProps?: React.InputHTMLAttributes<HTMLInputElement | HTMLSelectElement>;
  valueType?: string | number;
}
export interface InputGroupProps {
  name: string
  label?: string
  description?: string
  type?: React.HTMLInputTypeAttribute
  placeholder?: string
  leftElement?: React.ReactNode
  rightElement?: React.ReactNode
  inputProps?: React.InputHTMLAttributes<HTMLInputElement | HTMLSelectElement>;
}

export interface RHFInputFieldProps {
  name: string
  label?: string
  description?: string
  type?: React.HTMLInputTypeAttribute
  placeholder?: string
}

export interface SelectProps {
  name: string
  label?: string
  description?: string
  placeholder?: string
  options: Option[]
}

export interface User {
  id?: number;
  username: string;
  email?: string;
}

export type AuthMode = 'face' | 'fingerprint' | 'card';

export type AuthType = {
  id: number;
  name: AuthMode;
}

export type WizardStep = 1 | 2;
export interface WizardState {
  currentStep: WizardStep;
  values: TerminalCreateFormValues;
}

export interface DataTableProps<TData, TValue> {
    columns: ColumnDef<TData, TValue>[];
    data: TData[];
}

export interface ExtendedDataTableProps<TData, TValue> extends DataTableProps<TData, TValue> {
  showSearchBar?: boolean;
  emptyText?: string;
  label?: string;

  // custom filters
  filtersComponent?: React.ReactNode;

  // enable or disable global filtering
  enableGlobalFilter?: boolean;

  // allow server side filtering
  manualFiltering?: boolean;

  // external search control
  onGlobalSearchChange?: (value: string) => void;

  // ==========================================
  // NEW: Server-Side Pagination Additions
  // ==========================================
  /** Turns off internal TanStack page-slicing logic */
  manualPagination?: boolean;
  /** Total matching records across all pages from database (meta.total_records) */
  totalRecords?: number;
  /** Current 0-based page index tracked by your parent state */
  pageIndex?: number;
  /** Number of items requested per page window frame */
  pageSize?: number;
  /** Callback emitted when previous/next/page number actions are clicked */
  onPaginationChange?: (pagination: PaginationState) => void;
}

export interface TerminalFetchResponseType {
  id: number;
  name: string;
  branch_id: number;
  branch: string;
  status: string;
  ip_address: string | null;
  last_heartbeat: string | null;
  health_status: string;
}

export interface CardUser {
  id: string;
  firstName: string;
  lastName: string;
  designation: string;
  department: string;
  role?: 'student'| 'staff';
  status?: 'pending'|'active'|'revoked';
  className?: string;
  gender?: string;
  employeeId: string;
  cardUid: string;
  regno?: string;
  photo?: string;
  selected?: boolean;
  issuedAt?: string;
}

export interface LookupClass {
  id: number;
  class_name: string;
}

export interface LookupBranch {
  id: number;
  name: string;
}

export interface Lookup {
  id: number;
  name: string;
}

export interface SubgroupLookup {
  id: number;
  label: string;
}

export interface GroupWithSubgroupsLookup {
  id: number;
  label: string;
  subgroups: SubgroupLookup[];
}

export const EXCEPTION_TYPES = [
  "public_holiday",
  "company_event",
  "system_maintenance",
  "emergency_closure",
  "term_closure",
  "other",
] as const;

export type ExceptionType = (typeof EXCEPTION_TYPES)[number];

export interface AttendanceException {
  id?: number  | null;
  exception_type: ExceptionType;
  title: string;
  description?: string;
  created_by?: number;
  created_by_name?: string;
  start_date: string;
  end_date: string;
}

export interface AttendanceQueryParams {
  start_date?: string;
  end_date?: string;
  status?: string;
  page?: number;
  limit?: number
  context?: 'daily' | 'event';
  search?: string;
}

export interface PaginationMetaProps {
  total_records: number;
  current_page: number;
  total_pages: number;
  limit: number;
  onPageChange: (page: number) => void;
}
export interface AttendanceFilterBarProps {
  filters: AttendanceQueryParams;
  onFilterChange: (key: keyof AttendanceQueryParams, value: string) => void;
  onReset: () => void;
}

export interface AttendanceLedgerMetrics {
  total_late?: number;
  total_missed_checkout?: number;
  total_audit_override?: number;
}

export interface AttendanceTableProps {
  calendarDates: AttendanceLedgerData['calendarDates'];
  users: AttendanceLedgerData['users'];
  exceptions: AttendanceLedgerData['exceptions'];
  attendanceSummary: AttendanceLedgerData['initialAttendanceSummary'];
  context: 'daily' | 'event';
  onRowClick: (id: number) => void;
  paginationMeta: PaginationMetaProps;
}


export interface IndividualReportSheetProps {
    isOpen: boolean;
    onClose: () => void;
    filteredEmployee: AttendanceLedgerData['users'][number];
    queryParams: AttendanceQueryParams;
}

export interface AttendanceStatusCellProps {
  record: AttendanceLedgerData['initialAttendanceSummary'][number] | null;
  isHoliday: boolean;
  isWeekend: boolean;
}

export interface AttendanceUserAnalyticsMetrics {
  expected_days?: number;
  present_days?: number;
  late_arrivals?: number;
  absent_days?: number;
  permission_days?: number;
  queryParams: AttendanceQueryParams;
  user: string;
}

export interface ZoneBAuditLedgerProps {
  userId: number;
  queryParams: AttendanceQueryParams;
  onRowClick?: (date: string) => void;
}

export interface ZoneCRawTrailsProps {
  userId: number;
  selectedAuditDate: string;
  queryParams: AttendanceQueryParams;
}

export type logsCategories = 'system' | 'database' | 'error' | 'sync';
export type logLevels = 'info'|'warning'|'error';
export interface LogsQueryParams {
  category?: logsCategories;
  level?: logLevels;
  start_date?: string;
  end_date?: string;
  page?: number;
  limit?: number;
}

export interface LogsFilterBarProps {
  filters: LogsQueryParams;
  onFilterChange: (key: keyof LogsQueryParams, value: string | undefined) => void;
  onReset: () => void;
  disabled: boolean;
}

export interface LogsTableProps {
  logs: FetchLogsResponses["200"]["data"];
  paginationMeta: PaginationMetaProps;
}

export type permissionStatuses = 'pending' | 'approved' | 'rejected';
export interface PermissionQueryParams {
  search?: string;
  status?: permissionStatuses;
  page?: number;
  limit?: number;
  start_date?: string;
  end_date?: string;
}

export type PermissionRowType = NonNullable<GetAllPermissionsResponses["200"]["data"]>[number];
export interface PermissionTableProps {
  data?: GetAllPermissionsResponses["200"]["data"];
  onEdit: (permission: PermissionRowType) => void;
  onReview: (permission: PermissionRowType) => void;
  onDelete: (permission: PermissionRowType) => void;
  paginationMeta: PaginationMetaProps;
}

export interface PermissionFilterProps {
  filters: PermissionQueryParams;
  onFilterChange: (key: keyof PermissionQueryParams, value: string | undefined) => void;
  onReset: () => void;
}

export interface UserTableProps {
  users: UserResponse[];
  paginationMeta: PaginationMetaProps;
  onView: (id: number) => void;
  onEdit: (user: UserResponse) => void;
  onDelete: (user: UserResponse) => void;
}
