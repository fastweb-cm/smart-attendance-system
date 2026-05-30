import React from "react";
import UsersDirectoryView from "@/components/Users/UserDirectoryView";
import { Shield } from "lucide-react";

export const metadata = {
  title: "Omni Tenant Directory Ledger",
  description: "Global cross-platform account matrix and registry mapping tools.",
};

export default function GlobalUsersDirectoryPage() {
  return (
    <div className="my-4 max-w-6xl space-y-6">
      {/* Header Framework Layout Block */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center gap-2 text-slate-800 font-extrabold text-2xl tracking-tight">
            <Shield className="w-7 h-7 text-indigo-600 shrink-0" />
            <h1>Global Registry Control</h1>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            System identity mapping registry supporting multi-organizational user bases, roles, and device sync matrices.
          </p>
        </div>
      </div>

      {/* Client-side directory component handles state safely below */}
      <UsersDirectoryView />
    </div>
  );
}
