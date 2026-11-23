"use client";

import { useState, useRef, useEffect } from "react";
import WebcamCaptureModal from "@/components/WebcamVerify";
import FaceVisualGuide from "./FaceVisualGuide";
import { AttendanceState, AuthType, User } from "@/types";
import { speak } from "@/lib/speaker";

export default function FaceAuth({
  onSuccess,
  onFailure,
  userId,
  auth_type,
  terminal_id,
  auth_type_id,
}: {
  onSuccess: (
    user: User,
    attendance_status: string,
    next_step: AuthType | null,
    attendance_type: string | null
  ) => void;
  onFailure: (msg: string) => void;
  userId: number | null;
  auth_type: string;
  terminal_id: number | null;
  auth_type_id: number | null;
}) {
  const [attendanceState, setAttendanceState] = useState<AttendanceState>("capturing");
  const [message, setMessage] = useState("");
  const [feedback, setFeedback] = useState("Looking for face...");
  const [isSuccessState, setIsSuccessState] = useState(false);

  const MAX_FACE_RETRIES = 3;

  // ref to track retry attempts without causing re-renders
  const retryRef = useRef(0);

  // ref to prevent multiple rapid captures
  const isCurrentlyActiveRef = useRef(false);

  useEffect(() => {
    // Reset retry count when user starts a new capture session
    if (attendanceState === "capturing") {
      retryRef.current = 0;
      isCurrentlyActiveRef.current = false; // allow capture when starting
    }
  }, [attendanceState]);

  // Spoken voice guidance whenever feedback text updates during active capture
  useEffect(() => {
    if (feedback && attendanceState === "capturing") {
      speak(feedback);
    }
  }, [feedback, attendanceState]);

  return (
    <>
      <div className="flex flex-col items-center justify-center my-2 space-y-2">
        <FaceVisualGuide
          isSuccess={isSuccessState}
          isVerifying={attendanceState === "verifying"}
        />

        <p className="text-blue-600 font-bold text-base mt-2">
          {attendanceState === "capturing"
            ? feedback || "Focus your face on the webcam"
            : "Verifying..."}
        </p>
      </div>

      {attendanceState === "capturing" && (
        <div className="text-center text-yellow-600">{feedback}</div>
      )}

      <WebcamCaptureModal
        open={attendanceState === "capturing"}
        onClose={() => setAttendanceState("idle")}
        onCaptureStart={() => setAttendanceState("verifying")}
        onFeedback={(msg) => setFeedback(msg)}
        onResult={(status, msg, user, attendance_status, next_step, attendance_type) => {
          setMessage(msg);
          setAttendanceState(status);

          if (status === "success" && user) {
            setIsSuccessState(true);
            speak("Face verified successfully.");
            onSuccess(
              user,
              attendance_status ?? "in_progress",
              next_step ?? null,
              attendance_type ?? null
            );
          } else {
            speak(msg || "Face verification failed. Please try again.");
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
      />
    </>
  );
}
