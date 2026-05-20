import { TerminalCreateFormValues } from "@/schema/terminal.schema";
import { ColumnDef } from "@tanstack/react-table";

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

  //enable or disable global filtering
  enableGlobalFilter?: boolean;

  //allow server side filtering
  manualFiltering?: boolean;

  //external search control
  onGlobalSearchChange?: (value: string) => void;
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
}
