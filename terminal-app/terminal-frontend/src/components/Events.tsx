import { Events } from "@/types"

export default function EventsList({ events } : {events: Events[]}) {
  return (
    <div className="w-full max-w-2x mt-4">
        <h2 className="text-lg font-semibold tracking-tight mb-4">
            Upcoming Events
        </h2>
        <div className="space-y-4">
            {events.map((event) => (
                <div key={event.id} className="p-4 bg-gray-100 rounded-md">
                    <h3 className="text-md font-medium text-primary">{event.name}</h3>
                    <p className="text-sm text-muted mt-1">Start Time: {event.startDateTime} - End Time: {event.endDateTime}, {event.handshake === 1 ? "requires checkin only.": "requires checkin and checkout"}</p>
                </div>
            ))}
        </div>
    </div>
  )
}
