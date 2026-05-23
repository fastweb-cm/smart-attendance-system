"use client";

import { useUserAttendanceAnalytics } from "@/hooks/useAttendance";
import { ZoneCRawTrailsProps } from "@/types";
import { Fingerprint, RefreshCw, Terminal, CheckCircle2, AlertTriangle } from "lucide-react";
import { useMemo, useState } from "react";

// Local structural typing interface mapped to your true runtime type
interface RawSessionInstance {
  date?: string;
  checkin?: string | null;
  checkout?: string | null;
  hours?: number;
  status?: string;
  terminal_id?: string;
  sync_status?: string;
}

export function ZoneCRawTrail({
  userId, 
  selectedAuditDate, 
  queryParams
}: ZoneCRawTrailsProps) {

  const [isSyncing, setIsSyncing] = useState(false);
  
  // Pull records from cache
  const { data, isLoading } = useUserAttendanceAnalytics(userId, queryParams);

  // Split and sort incoming session blocks into chronological timeline milestones
  const timelineEvents = useMemo(() => {
    if (!data?.attendanceSessions) return [];

    // Filter sessions matching our highlighted selection date hook
    const activeDaySessions = (data.attendanceSessions as RawSessionInstance[]).filter(
      (s) => s.date === selectedAuditDate
    );

    const logs: Array<{
      time: string;
      category: "Check-In" | "Check-Out";
      terminal_id: string;
      sync_status: string;
      hours?: number;
    }> = [];

    activeDaySessions.forEach((session) => {
      const defaultTerminal = session.terminal_id || "TRM-01";
      const defaultSync = session.sync_status || "synced";

      // If checkin exists, unpack it as a distinct entry
      if (session.checkin) {
        logs.push({
          time: session.checkin.includes("T") ? session.checkin.split("T")[1].substring(0, 5) : session.checkin.substring(0, 5),
          category: "Check-In",
          terminal_id: defaultTerminal,
          sync_status: defaultSync,
        });
      }

      // If checkout exists, unpack it as a distinct entry
      if (session.checkout) {
        logs.push({
          time: session.checkout.includes("T") ? session.checkout.split("T")[1].substring(0, 5) : session.checkout.substring(0, 5),
          category: "Check-Out",
          terminal_id: defaultTerminal,
          sync_status: defaultSync,
          hours: session.hours,
        });
      }
    });

    // Chronologically sort transactions so morning logs come before evening ones
    return logs.sort((a, b) => a.time.localeCompare(b.time));
  }, [selectedAuditDate, data]);

  const handleSimulateSync = () => {
    setIsSyncing(true);
    // Simulate cache synchronization window clearing out pending node transactions
    setTimeout(() => {
      setIsSyncing(false);
      console.log("Hardware node synchronized successfully.");
    }, 1500);
  };

  if (isLoading) {
    return <div className="text-xs font-mono text-slate-400 p-4">Streaming Audit Trails matrix...</div>;
  }

  return (
    <div className="bg-white p-4 border border-slate-200 rounded-xl space-y-3 shadow-sm">
      <div className="flex items-center justify-between">
        <h4 className="text-[10px] font-bold text-slate-600 tracking-widest font-mono uppercase flex items-center gap-2">
          <Terminal className="w-3.5 h-3.5 text-blue-600" />
          Raw Terminal Trail (Evidence)
        </h4>
        <span className="text-[10px] bg-slate-100 border border-slate-200 text-slate-700 font-bold font-mono px-2 py-0.5 rounded">
          DATE: {selectedAuditDate || "None Selected"}
        </span>
      </div>

      {!selectedAuditDate ? (
        <div className="bg-slate-50 rounded-lg p-6 text-center border border-slate-200 border-dashed">
          <p className="text-xs text-slate-400 font-mono">
            Select an operational row from the ledger grid above to evaluate raw biometric trail evidence.
          </p>
        </div>
      ) : timelineEvents.length === 0 ? (
        <div className="bg-slate-50 rounded-lg p-6 text-center border border-slate-200 border-dashed">
          <p className="text-xs text-slate-400 font-mono">
            No physical terminal transactions logged for {selectedAuditDate}.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          
          {/* Vertical Timeline sequence structure */}
          <div className="relative border-l-2 border-slate-100 pl-4 ml-2.5 space-y-3.5">
            {timelineEvents.map((punch, index) => {
              const isSynced = punch.sync_status === "synced";
              const isPending = punch.sync_status === "pending";

              return (
                <div key={index} className="relative">
                  
                  {/* Status-colored timeline Node anchor dots matching category scopes */}
                  <div className={`absolute -left-[21.5px] top-1.5 w-2.5 h-2.5 rounded-full border-2 border-white ${
                    punch.category === "Check-In" ? "bg-emerald-500" :
                    punch.category === "Check-Out" ? "bg-blue-500" : "bg-slate-400"
                  }`} />

                  <div className="flex items-center justify-between bg-slate-50/60 hover:bg-slate-50 p-2.5 rounded-lg border border-slate-200/60 transition">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-900 font-mono">{punch.time}</span>
                        <span className={`text-[9px] font-bold font-mono px-1.5 py-0.2 rounded border ${
                          punch.category === "Check-In" ? "bg-emerald-50 text-emerald-700 border-emerald-200" :
                          punch.category === "Check-Out" ? "bg-blue-50 text-blue-700 border-blue-200" :
                          "bg-slate-100 text-slate-600 border-slate-200"
                        }`}>
                          {punch.category}
                        </span>
                        {punch.hours !== undefined && (
                          <span className="text-[9px] font-mono text-slate-400">({punch.hours}h session)</span>
                        )}
                      </div>
                      
                      <div className="text-[10px] text-slate-400 font-mono mt-1 flex items-center gap-1">
                        <Fingerprint className="w-3 h-3 text-slate-400" /> 
                        Terminal Node: <code className="bg-slate-100 px-1 py-0.2 rounded text-slate-600 text-[9px]">{punch.terminal_id}</code>
                      </div>
                    </div>

                    {/* Terminal synchronization statuses check */}
                    <div>
                      <span className={`inline-flex items-center gap-1 text-[9px] font-bold font-mono px-2 py-0.5 rounded border ${
                        isSynced ? "bg-emerald-50 text-emerald-700 border-emerald-200" :
                        isPending ? "bg-amber-50 text-amber-700 border-amber-200" :
                        "bg-rose-50 text-rose-700 border-rose-200"
                      }`}>
                        <span className={`w-1 h-1 rounded-full ${
                          isSynced ? "bg-emerald-500" : 
                          isPending ? "bg-amber-500 animate-pulse" : "bg-rose-500"
                        }`} />
                        {punch.sync_status.toUpperCase()}
                      </span>
                    </div>

                  </div>
                </div>
              );
            })}
          </div>

          {/* Pending Logs Sync trigger component button */}
          {timelineEvents.some(p => p.sync_status === "pending") && (
            <div className="pt-1.5">
              <button 
                onClick={handleSimulateSync}
                disabled={isSyncing}
                className="w-full flex items-center justify-center gap-2 bg-blue-50 hover:bg-blue-100/80 border border-blue-200 text-blue-700 py-2 px-3 rounded-lg text-[11px] font-bold font-mono transition shadow-sm disabled:opacity-60 cursor-pointer"
              >
                <RefreshCw className={`w-3.5 h-3.5 text-blue-600 ${isSyncing ? "animate-spin" : ""}`} />
                {isSyncing ? "Processing transaction queues..." : "Sync edge terminal hardware log queue (Pendings exist)"}
              </button>
            </div>
          )}

        </div>
      )}
    </div>
  );
}
