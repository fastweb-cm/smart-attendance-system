import React from "react";

export type AttendanceState = 
  | "idle"
  | "capturing"
  | "verifying"
  | "success"
  | "error"

export interface WebcamCaptureModalProps {
  open: boolean;
  onClose: () => void;
  onCaptureStart: () => void;
  onResult: (status: "success" | "error",message: string) => void;
  userId?: number;
}

export interface ModalProps {
  isOpen: boolean;
  btnx?: boolean;
  btn?: boolean;
  onClose?: () => void;
  title?: string;
  children: React.ReactNode;
}

export interface StatusModalProps extends Partial<ModalProps> {
  status: AttendanceState;
  message: string;
}
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

type TerminalStatus = 'pending' | 'active' | 'revoked';
export interface TerminalConfig {
  terminal_id: number;
  name: string;
  terminal_code: string;
  branch: string;
  status: TerminalStatus;
  auth_capabilities: {
    auth_type_id: number;
    auth_type: string;
  }[];
  access_rule: {
    group_id: number | null;
    subgroup_id: number | null;
    auth_type_id: number;
  }[];
  access_policy: {
    group_id: number | null;
    subgroup_id: number | null;
    auth_type_id: number;
    auth_step: number;
  }[];
}
