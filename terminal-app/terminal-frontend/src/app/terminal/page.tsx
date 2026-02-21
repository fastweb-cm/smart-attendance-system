import Annoucements from '@/components/Annoucements'
import ClockDisplay from '@/components/ClockDisplay'
import EventsList from '@/components/Events'
import HeaderBar from '@/components/HeaderBar'
import { AnnouncementsData, EventsData } from '@/utils/data'
import React from 'react'

export default function TerminalPage() {
  return (
    <div className="w-full max-w-4xl bg-white shadow-lg rounded-lg py-2 px-8">
        <HeaderBar />
        <ClockDisplay />
        <p className="text-primary text-center text-2xl">Swipe Card to Begin</p>
        <div className="flex gap-2 items-center justify-center">
            <div className="w-1/4 h-12 bg-gray-200 rounded-md animate-pulse text-center py-3 px-2">Take Attendance</div>
            <div className="w-1/4 h-12 bg-warning rounded-md animate-pulse text-center py-3 px-2">Event Attendance</div>
        </div>
        <Annoucements announcements={AnnouncementsData} />
        <EventsList events={EventsData} />
    </div>
  )
}
