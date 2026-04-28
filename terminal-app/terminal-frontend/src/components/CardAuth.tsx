"use client";

import { AuthProps, AuthType, User } from "@/types";
import apiClient from "@/lib/axiosClient";
import CardVerify from "./CardVerify";
import { useState } from "react";

export default function CardAuth({onSuccess, onFailure, authType, userId, terminalId, authTypeId}: { onSuccess: (user: User, attendance_status: string, next_step: AuthType | null, attendance_type: string | null) => void; onFailure: (msg: string) => void; authType: string; userId: number | null; terminalId: number | null; authTypeId: number | null }): React.ReactNode {

  const [feedback, setFeedback] = useState("Scanning...");
  const [message, setMessage] = useState("");

  return (
    <CardVerify 
      onFeedback={(msg) => setFeedback(msg)}
      onResult={(status,msg,user, attendance_status, next_step, attendance_type) => {
            setMessage(msg);

            if (status === "success" && user) {
                onSuccess(user, attendance_status ?? "in_progress", next_step ?? null, attendance_type ?? null);
            }else{
                onFailure(msg);
            }
        }}
    />
  );
}
