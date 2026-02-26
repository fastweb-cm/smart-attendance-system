// app/admin/not-found.tsx
import Link from "next/link"
import { AlertTriangle } from "lucide-react"

export default function AdminNotFound() {
  return (
    <div className="flex h-full flex-col items-center justify-center text-center gap-4">
      <AlertTriangle className="h-10 w-10 text-yellow-500" />
      <h1 className="text-2xl font-semibold">Page not found</h1>
      <p className="text-muted-foreground max-w-md">
        The page {`you're`} trying to access {`doesn't`} exist or has been moved.
      </p>

      <Link
        href="/admin"
        className="mt-4 rounded-md bg-primary px-4 py-2 text-primary-foreground"
      >
        Back to Home
      </Link>
    </div>
  )
}
