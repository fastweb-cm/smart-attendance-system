import { Announcements } from "@/types";

export const AnnouncementsData: Announcements[] = [
    {
        id: 1,
        name: "System Maintenance",
        message: "The terminal will be undergoing maintenance on Saturday from 2 AM to 4 AM. Please plan accordingly."
    },
    {
        id: 2,
        name: "First Sequence Exams",
        message: "First sequence exams will commence on Monday. Ensure all students have their ID cards ready for attendance."
    }
]

export const EventsData = [
    {
        id: 1,
        name: "PTA Meeting",
        startDateTime: "2026-03-12 10:00 AM",
        endDateTime: "2026-03-12 11:00 AM",
        handshake: 1
    },
    {
        id: 2,
        name: "Science Fair",
        startDateTime: "2026-03-15 09:00 AM",
        endDateTime: "2026-03-15 02:00 PM",
        handshake: 2
    }
]
