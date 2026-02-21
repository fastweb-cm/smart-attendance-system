
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

export interface Announcements {
  id: number;
  name: string;
  message: string;
}

export interface Events {
  id: number;
  name: string;
  startDateTime: string;
  endDateTime: string;
  handshake: number;
}
