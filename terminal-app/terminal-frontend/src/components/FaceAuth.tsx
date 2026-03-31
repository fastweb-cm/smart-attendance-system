"use client";

import StatusModal from '@/components/StatusModal'
import { useState } from 'react'
import WebcamCaptureModal from '@/components/WebcamVerify';
import { AttendanceState } from '@/types';

export default function FaceAuth({ onSuccess, onFailure }: { onSuccess: (userId: number) => void; onFailure: (msg: string) => void }) {
  const [attendanceState, setAttendanceState] = useState<AttendanceState>("idle"); //default the terminal is in idle state
  const [message, setMessage] = useState("");
  const [feedback, setFeedback] = useState("Capturing...");

  return (
    <>
    <div className="flex gap-2 items-center justify-center my-6">
        <div title="Click to begin" className="w-full h-18 bg-gray-200 rounded-md animate-pulse text-center py-6 px-2 cursor-pointer"
        onClick={() => setAttendanceState("capturing")}
        >Face Recognition</div>
        {/* <div className="w-1/4 h-18 bg-warning rounded-md animate-pulse text-center py-6 px-2">Event Attendance</div> */}
    </div>

    {attendanceState === "capturing" && <div className="text-center text-yellow-600">{feedback}</div>}

    <WebcamCaptureModal 
        open={attendanceState === "capturing"} 
        onClose={() => setAttendanceState("idle")}
        onCaptureStart={() => setAttendanceState("verifying")}
        onFeedback={(msg) => setFeedback(msg)}
        onResult={(status,msg,userId) => {
            setMessage(msg);
            setAttendanceState(status);

            if (status === "success" && typeof userId === "number") {
                onSuccess(userId);
            }else{
                onFailure(msg);
            }

            setTimeout(() => {
            setAttendanceState("idle")
            },2000)
        }}
    />

    {/* verifying loader */}
    <StatusModal
        isOpen={attendanceState === "verifying"}
        status="verifying"
        message="Verifying..."
    />
    
    {/* Result */}
    <StatusModal
        isOpen={attendanceState === "success" || attendanceState === "error"}
        status={attendanceState}
        message={message}
    />

    </>
  )
}
