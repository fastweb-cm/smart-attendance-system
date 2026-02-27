import { notFound } from "next/navigation";

export default function AdminCatchAll() {
  // This explicitly triggers the nearest not-found.tsx
  notFound();
}
