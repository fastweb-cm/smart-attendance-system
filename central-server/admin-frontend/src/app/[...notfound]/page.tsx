import { notFound } from "next/navigation"

export default function page() {
    //this explicitely triggers the nearest not-found.tsx
    notFound()
}
