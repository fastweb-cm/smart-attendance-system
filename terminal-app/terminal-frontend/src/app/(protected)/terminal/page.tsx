"use client";

import Annoucements from '@/components/Annoucements'
import ClockDisplay from '@/components/ClockDisplay'
import EventsList from '@/components/Events'
import HeaderBar from '@/components/HeaderBar'
import WebcamCapture from '@/components/WebcamCapture';
import { AnnouncementsData, EventsData } from '@/lib/data'
import { useState } from 'react'

export default function TerminalPage() {
  const [showWebcam, setShowWebcam] = useState(false);
  return (
    <div className="w-full max-w-4xl bg-white shadow-lg rounded-lg py-2 px-8">
        <HeaderBar />
        <ClockDisplay />
        {/* <p className="text-primary text-center text-2xl">Swipe Card to Begin</p> */}
        <div className="flex gap-2 items-center justify-center my-6">
            <div className="w-1/4 h-18 bg-gray-200 rounded-md animate-pulse text-center py-6 px-2"
            onClick={() => setShowWebcam(true)}
            >Record Attendance</div>
            {/* <div className="w-1/4 h-18 bg-warning rounded-md animate-pulse text-center py-6 px-2">Event Attendance</div> */}
        </div>
        {/* <Annoucements announcements={AnnouncementsData} />
        <EventsList events={EventsData} /> */}

        {/* Webcam Section */}
        {showWebcam && (
          <div className="my-4 flex justify-center">
            <WebcamCapture open={showWebcam} onClose={() => setShowWebcam(false)}/>
          </div>
        )}
    </div>
  )
}
