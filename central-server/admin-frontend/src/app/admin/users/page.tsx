import React from "react";
import UsersDirectoryView from "@/components/Users/UserDirectoryView";
import { Shield } from "lucide-react";

export const metadata = {
  title: "User Directory | Attendance Management",
  description: "Manage accounts, institutional roles, and system access settings across the platform.",
};

export default function GlobalUsersDirectoryPage() {
  return (
    <div className="my-4 space-y-6">
      
      {/* Page Header Header Row */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center gap-2 text-slate-800 font-bold text-2xl tracking-tight">
            <Shield className="w-6 h-6 text-indigo-600 shrink-0" />
            <h1>User Directory & Accounts</h1>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Central management hub for all semployees, system permissions, and credential controls.
          </p>
        </div>
      </div>

      {/* Client-side directory list view toggle interface */}
      <UsersDirectoryView />
    </div>
  );
}
