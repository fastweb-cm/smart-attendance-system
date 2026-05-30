import React from "react";
import UsersDirectoryView from "@/components/Users/UserDirectoryView";
import { Users } from "lucide-react"; // Swapped out GraduationCap for an operational group icon

export const metadata = {
  title: "Staff Corporate Registry Matrix",
  description: "System credential administration matrix for faculty and workforce accounts.",
};

export default function StaffPage() {
  return (
    <main className="my-4 max-w-6xl space-y-6">
      {/* Header Framework Layout Block */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center gap-2 text-slate-800 font-extrabold text-2xl tracking-tight">
            <Users className="w-7 h-7 text-emerald-600 shrink-0" /> {/* Changed color to emerald for distinct branding */}
            <h1>Staff & Operations Directory</h1>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Maintain staff organizational access identities, view corporate email links, and manage secure biometrics.
          </p>
        </div>
      </div>

      {/* Primary Polymorphic Directory Client View - Hardlocked to staff context */}
      <UsersDirectoryView />
    </main>
  );
}
