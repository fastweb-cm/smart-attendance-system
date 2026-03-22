"use client";

import Annoucements from '@/components/Annoucements'
import ClockDisplay from '@/components/ClockDisplay'
import EventsList from '@/components/Events'
import HeaderBar from '@/components/HeaderBar'
import { AnnouncementsData, EventsData } from '@/lib/data'
import StatusModal from '@/components/StatusModal'
import { useState } from 'react'
import WebcamCaptureModal from '@/components/WebcamVerify';
import { AttendanceState } from '@/types';

export default function TerminalPage() {
  const [attendanceState, setAttendanceState] = useState<AttendanceState>("idle"); //default the terminal is in idle state
  const [message, setMessage] = useState("");
  const [feedback, setFeedback] = useState("Capturing...");

  return (
    <div className="w-full max-w-4xl bg-white shadow-lg rounded-lg py-2 px-8">
        <HeaderBar />
        <ClockDisplay />
        {/* <p className="text-primary text-center text-2xl">Swipe Card to Begin</p> */}
        <div className="flex gap-2 items-center justify-center my-6">
            <div className="w-1/4 h-18 bg-gray-200 rounded-md animate-pulse text-center py-6 px-2"
            onClick={() => setAttendanceState("capturing")}
            >Record Attendance</div>
            {/* <div className="w-1/4 h-18 bg-warning rounded-md animate-pulse text-center py-6 px-2">Event Attendance</div> */}
        </div>
        {attendanceState === "capturing" && <div className="text-center text-yellow-600">{feedback}</div>}
        <Annoucements announcements={AnnouncementsData} />
        <EventsList events={EventsData} />

        {/* Webcam Section */}
        <div className="my-4 flex justify-center">
          <WebcamCaptureModal 
            open={attendanceState === "capturing"} 
            onClose={() => setAttendanceState("idle")}
            onCaptureStart={() => setAttendanceState("verifying")}
            onFeedback={(msg) => setFeedback(msg)}
            onResult={(status,msg) => {
              setMessage(msg);
              setAttendanceState(status);

              setTimeout(() => {
                setAttendanceState("idle")
              },2000)
            }}
          />
        </div>

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
    </div>
  )
}
