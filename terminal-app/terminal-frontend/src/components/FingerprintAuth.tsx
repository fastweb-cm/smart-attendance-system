"use client";

import { useState, useEffect } from 'react';
import FingerprintVerify from './FingerprintVerify';
import { AttendanceState, AuthType, User } from '@/types';

export default function FingerprintAuth({ 
  onSuccess, 
  onFailure, 
  userId, 
  auth_type, 
  terminal_id, 
  auth_type_id,
  action="VERIFY"
}: { 
  onSuccess: (user: User, attendance_status: string, next_step: AuthType | null, attendance_type: string | null) => void; 
  onFailure: (msg: string) => void; 
  userId: number | null; 
  auth_type: string; 
  terminal_id: number | null; 
  auth_type_id: number | null; 
  action?: "VERIFY" | "ENROLL";
}) {
  const [attendanceState, setAttendanceState] = useState<AttendanceState>("capturing"); 
  const [feedback, setFeedback] = useState("Place finger on scanner...");

  return (
    <>
      <div className="flex flex-col items-center justify-center my-6 space-y-3">
        <div className="w-20 h-20 bg-blue-50 border-2 border-blue-200 rounded-full flex items-center justify-center animate-pulse">
          <svg className="w-10 h-10 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 11c0 3.517-1.009 6.567-2.75 9M12 11a3.001 3.001 0 000-6M12 11c0 3.517 1.009 6.567 2.75 9m-5.5 0C6.567 17.009 5.5 13.959 5.5 11c0-3.866 3.134-7 7-7s7 3.134 7 7c0 2.959-1.009 6.009-2.75 9M4.5 19.5h15" />
          </svg>
        </div>
        <p className="text-blue-600 font-bold text-lg">
          {attendanceState === "capturing" ? feedback : "Processing verification..."}
        </p>
      </div>

      <FingerprintVerify
        open={attendanceState === "capturing"} 
        onClose={() => setAttendanceState("idle")}
        onFeedback={(msg) => setFeedback(msg)}
        onResult={(status, msg, user, attendance_status, next_step, attendance_type) => {
          setAttendanceState(status);

          if (status === "success" && user) {
            onSuccess(user, attendance_status ?? "in_progress", next_step ?? null, attendance_type ?? null);
          } else {
            onFailure(msg);
          }

          setTimeout(() => {
            setAttendanceState("idle");
          }, 2000);
        }}
        userId={userId}
        auth_type={auth_type}
        terminal_id={terminal_id}
        auth_type_id={auth_type_id}
        action={action} // Automatically decides based on user context
      />
    </>
  );
}
