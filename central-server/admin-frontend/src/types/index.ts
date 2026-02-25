import { ColumnDef } from "@tanstack/react-table";

interface Option {
  label: string
  value: string
}
export interface InputFieldProps {
  label?: string;
  type?: "text" | "email" | "password" | "select" | "checkbox";
  name: string;
  required?: boolean;
  options?: Option[];
  defaultValue?: string;
  inputProps?: React.InputHTMLAttributes<HTMLInputElement | HTMLSelectElement>;
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

