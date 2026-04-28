"use client";

import { useState, useRef, useEffect } from 'react'
import WebcamCaptureModal from '@/components/WebcamVerify';
import { AttendanceState, AuthType, User } from '@/types';

export default function FaceAuth({ onSuccess, onFailure, userId, auth_type, terminal_id, auth_type_id }: { onSuccess: (user: User, attendance_status: string, next_step: AuthType | null, attendance_type: string | null) => void; onFailure: (msg: string) => void; userId: number | null; auth_type: string; terminal_id: number | null; auth_type_id: number | null; }) {
  const [attendanceState, setAttendanceState] = useState<AttendanceState>("capturing"); // auto start the webcam when the components mounts
  const [message, setMessage] = useState("");
  const [feedback, setFeedback] = useState("Capturing...");

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
  },[]);


  return (
    <>
    <div className="flex gap-2 items-center justify-center my-6">
        {/* <div title="Click to begin" className="w-full h-18 bg-gray-200 rounded-md animate-pulse text-center py-6 px-2 cursor-pointer"
        onClick={() => setAttendanceState("capturing")}
        >Face Recognition</div> */}
        {/* <div className="w-1/4 h-18 bg-warning rounded-md animate-pulse text-center py-6 px-2">Event Attendance</div> */}
        <p className="text-blue-600 mt-4 font-bold animate">
            {attendanceState === "capturing" ? "Focus your face on the webcam" : "Verifying..."}
        </p>
    </div>

    {attendanceState === "capturing" && <div className="text-center text-yellow-600">{feedback}</div>}

    <WebcamCaptureModal 
        open={attendanceState === "capturing"} 
        onClose={() => setAttendanceState("idle")}
        onCaptureStart={() => setAttendanceState("verifying")}
        onFeedback={(msg) => setFeedback(msg)}
        onResult={(status,msg,user, attendance_status, next_step, attendance_type) => {
            setMessage(msg);
            setAttendanceState(status);

            if (status === "success" && user) {
                onSuccess(user, attendance_status ?? "in_progress", next_step ?? null, attendance_type ?? null);
            }else{
                onFailure(msg);
            }

            setTimeout(() => {
            setAttendanceState("idle")
            },2000)
        }}
        userId={userId}
        auth_type={auth_type}
        terminal_id={terminal_id}
        auth_type_id={auth_type_id}
    />
    </>
  )
}
