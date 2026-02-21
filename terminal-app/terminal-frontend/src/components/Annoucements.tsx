import { Announcements } from "@/types"

export default function Annoucements({ announcements} : {announcements: Announcements[]}) {
  return (
    <div className="w-full max-w-2x mt-4">
        <h2 className="text-lg font-semibold tracking-tight mb-4">
            Important Announcements
        </h2>
        <div className="space-y-4">
            {announcements.map((announcement) => (
                <div key={announcement.id} className="p-4 bg-gray-100 rounded-md">
                    <h3 className="text-md font-medium text-primary">{announcement.name}</h3>
                    <p className="text-sm text-muted mt-1">{announcement.message}</p>
                </div>
            ))}
        </div>
    </div>
  )
}
