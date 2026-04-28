import React from "react";

export type AttendanceState = 
  | "idle"
  | "capturing"
  | "verifying"
  | "success"
  | "error"

export type AuthType = "face" | "card" | "fingerprint";

export interface WebcamCaptureModalProps {
  open: boolean;
  onClose: () => void;
  onCaptureStart: () => void;
  onResult: (status: "success" | "error",message: string, user?: User | null, attendance_status?: string | null, next_step?: AuthType | null, attendance_type?: string | null) => void;
  onFeedback: (msg: string) => void;
  userId?: number | null;
  auth_type?: string;
  terminal_id?: number | null;
  auth_type_id?: number | null;
  attendance_type?: string | null;
}

export interface AuthProps {
  onFeedback: (msg: string) => void;
  onResult: (status: "success" | "error",message: string, user?: User | null, attendance_status?: string | null, next_step?: AuthType | null, attendance_type?: string | null) => void;
  userId?: number | null;
  authType?: string;
  terminalId?: number | null;
  authTypeId?: number | null;
  attendanceType?: string | null;
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
  id: number;
  name: string;
  terminal_code: string;
  branch: string;
  branch_id: number;
  status: TerminalStatus;
  auth_capabilities: {
    auth_step: number;
    auth_type_id: number;
    auth_type_name: AuthType;
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

export interface AuthStep {
  step: number;
  type: AuthType;
  type_id: number;
}
export interface AuthCapabilities {
  auth_step: number;
  auth_type_name: AuthType;
  auth_type_id: number;
}

export interface User {
  id: number;
  fName?: string;
  lName?: string;
  groupId?: number;
  subgroupId?: number | null;
  email?: string;
}


export type { CentralOpenapiTerminalData as terminalConfiguration } from "@/client/facerecognition";

