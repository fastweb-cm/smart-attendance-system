"use client";

import { useState, useEffect } from 'react';
import FingerprintVerify from './FingerprintVerify';
import FingerprintVisualGuide from './FingerprintVisualGuide';
import { AttendanceState, AuthType, User } from '@/types';
import { speak } from '@/lib/speaker';

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
  const [currentStage, setCurrentStage] = useState<number | null>(null);
  const [isSuccessState, setIsSuccessState] = useState(false);

  // Spoken voice guidance whenever feedback text updates during active capture
  useEffect(() => {
    if (feedback && attendanceState === "capturing") {
      speak(feedback);
    }
  }, [feedback, attendanceState]);

  return (
    <>
      <div className="flex flex-col items-center justify-center my-2 space-y-2">
        <FingerprintVisualGuide stage={currentStage} isSuccess={isSuccessState} />

        <p className="text-blue-600 font-bold text-base mt-2">
          {attendanceState === "capturing" ? feedback : "Processing verification..."}
        </p>
      </div>

      <FingerprintVerify
        open={attendanceState === "capturing"} 
        onClose={() => setAttendanceState("idle")}
        onFeedback={(msg) => setFeedback(msg)}
        onStageChange={(stage) => setCurrentStage(stage)}
        onResult={(status, msg, user, attendance_status, next_step, attendance_type) => {
          setAttendanceState(status);

          if (status === "success" && user) {
            setIsSuccessState(true);
            setCurrentStage(5);
            speak("Fingerprint verified successfully.");
            onSuccess(user, attendance_status ?? "in_progress", next_step ?? null, attendance_type ?? null);
          } else {
            speak(msg || "Fingerprint verification failed. Please try again.");
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
        action={action}
      />
    </>
  );
}
