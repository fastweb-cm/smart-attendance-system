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
