"use client";

import { AuthProps, User } from "@/types";
import apiClient from "@/lib/axiosClient";

export default function CardAuth({ 
  onSuccess,
  onResult,
  authType,
  userId,
  terminalId,
  authTypeId,
  attendanceType

}: AuthProps) {

  const handleRequest = async () => {
    try {
      const res = await apiClient.post("verify/card",)
      
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      
    }
  }

  return (
    <button onClick={() => onSuccess({ id: 1, group_id: 2, fName: "ichami", lName: "brandon" } as User, "in_progress", null, null)}>
      Tap Card
    </button>
  );
}
