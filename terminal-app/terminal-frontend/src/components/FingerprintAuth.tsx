"use client";

import { AuthType, User } from "@/types";
import FingerprintVerify from "./FingerprintVerify";
import { useState } from "react";

export default function FingerprintAuth({
  onSuccess,
  onFailure,
  authType,
  userId,
  terminalId,
  authTypeId,
}: {
  onSuccess: (user: User, attendance_status: string, next_step: AuthType | null, attendance_type: string | null) => void;
  onFailure: (msg: string) => void;
  authType: string;
  userId: number | null;
  terminalId: number | null;
  authTypeId: number | null;
}): React.ReactNode {
  const [feedback, setFeedback] = useState("Scanning...");

  return (
    <>
      <p className="text-blue-600 mt-4 mb-2 font-bold text-center">{feedback}</p>
      <FingerprintVerify
        onFeedback={(msg) => setFeedback(msg)}
        onResult={(status, msg, user, attendance_status, next_step, attendance_type) => {
          if (status === "success" && user) {
            onSuccess(user, attendance_status ?? "in_progress", next_step ?? null, attendance_type ?? null);
          } else {
            onFailure(msg);
          }
        }}
        authType={authType}
        userId={userId}
        terminalId={terminalId}
        authTypeId={authTypeId}
      />
    </>
  );
}
