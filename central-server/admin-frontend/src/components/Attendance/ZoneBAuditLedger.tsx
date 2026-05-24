"use client";

import { useAttendanceLedger, useUpdateAttendance } from "@/hooks/useAttendance";
import { getPreviousDay } from "@/lib/utils";
import { AttendanceTableProps, ZoneBAuditLedgerProps } from "@/types";
import { Edit3, Info, Save, X } from "lucide-react";
import { useMemo, useState } from "react";

export default function ZoneBAuditLedger({ 
  userId,
  queryParams,
  onRowClick
}: ZoneBAuditLedgerProps) {

  // We are now tracking the unique composite string identity (date or event-date combination)
  const [editingRowKey, setEditingRowKey] = useState<string | null>(null);
  
  // Track currently active audit selection line
  const [selectedAuditDate, setSelectedAuditDate] = useState<string>(() => getPreviousDay());
  
  // Dedicated state machines initialized on operational row selection events
  const [editHours, setEditHours] = useState<number>(0);
  const [editStatus, setEditStatus] = useState<string>("");

  // Pull records from cache
  const { data, isLoading } = useAttendanceLedger(queryParams);

  const isEventContext = queryParams.context === 'event';

  const chronologicalAuditLedger = useMemo(() => {
    if (!data) return [];

    type AttendanceRecord = AttendanceTableProps["attendanceSummary"] extends Array<infer U> ? U : never;
    // We attach a unique 'rowKey' to completely eliminate React key collisions on multi-day events
    type AuditLedgerRecord = AttendanceRecord & { isHolidayShift: boolean; holidayName?: string; rowKey: string; displayLabel: string };

    const userRecords = data.attendanceSummary.filter(u => u.employee_id === userId);

    return data.calendarDates.reduce<AuditLedgerRecord[]>((acc, cd) => {
      // Safely extract string constants with guaranteed fallbacks to appease the compiler
      const targetExactDate = cd.exact_date ?? "";
      const targetRaw = cd.raw ?? "";
      const targetDisplayLabel = cd.dayName ?? cd.label ?? "";

      const exception = data.exceptions?.find((ex) => ex.date === targetExactDate);
      
      // Match records using BOTH date and event validation parameters accurately
      const record = userRecords.find(r => {
        if (isEventContext) {
          return String(r.event_id) === targetRaw && r.date === targetExactDate;
        }
        return r.date === targetRaw;
      }) || {
        id: null,
        employee_id: userId,
        date: targetExactDate,
        event_id: isEventContext ? parseInt(targetRaw !== "" ? targetRaw : "0") : undefined,
        first_checkin: null,
        last_checkout: null,
        total_hours: 0,
        checkin_status: 'absent',
        session_status: 'no_show',
        derived_from_session: 1,
        attendance_status: 'absent',
        variance: 0
      };

      // Create a truly unique DOM key identifier (e.g., "13_2026-05-20" or "2026-05-20")
      const uniqueRowKey = isEventContext ? `${targetRaw}_${targetExactDate}` : targetExactDate;

      acc.push({
        ...record,
        isHolidayShift: !!exception,
        holidayName: exception?.name ?? "",
        rowKey: uniqueRowKey,
        displayLabel: targetDisplayLabel
      });

      return acc;
    }, []);
  }, [data, userId, isEventContext]);
  // Safely intercept and populate inputs when editing mode is triggered
  const startEditingRow = (
    e: React.MouseEvent,
    record: AttendanceTableProps["attendanceSummary"][number] & { rowKey: string }
  ) => {
    e.stopPropagation(); 
    setEditingRowKey(record.rowKey);
    setEditHours(record.total_hours ?? 0);
    setEditStatus(record.attendance_status ?? "");
  };

  const saveCorrectionMutation = useUpdateAttendance();

  const handleSaveCorrection = async (id: number, targetDate: string, eventId: number | null) => {
    const reqBody = {
      id: id,
      status: editStatus as "absent" | "present" | "on permission",
      hours: editHours,
      userId: userId,
      date: targetDate, // Passes down the exact single-day date slice of that event
      context: queryParams.context,
      eventId: eventId // Matches backend input parsing key expectation name
    };
    
    await saveCorrectionMutation.mutateAsync({
        body: reqBody
    });

    setEditingRowKey(null);
  };

  if (isLoading) {
    return <div className="text-xs font-mono text-slate-400 p-4">Streaming logs matrix...</div>;
  }

  return (
    <div className="my-6">
      <div className="flex items-center justify-between mb-2">
        <h4 className="text-[10px] font-bold text-slate-600 tracking-widest font-mono uppercase">Attendance session Overrides</h4>
        <span className="text-[9px] text-blue-600 font-semibold font-mono animate-pulse">Select row to review corresponding terminal trail</span>
      </div>

      <div className="border border-slate-200 rounded-lg max-h-80 overflow-y-auto bg-white shadow-sm">
        <table className="w-full text-left border-collapse table-fixed">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 text-[10px] sticky top-0 z-10 font-bold font-mono text-slate-500 tracking-wider">
              <th className="p-2.5 w-[22%]">Date</th>
              <th className="p-2.5 w-[16%]">First In</th>
              <th className="p-2.5 w-[16%]">Last Out</th>
              <th className="p-2.5 w-[13%] text-center">Hours</th>
              <th className="p-2.5 text-center w-[21%]">Att. Status</th>
              <th className="p-2.5 text-center w-[12%]">Action</th>
            </tr>
          </thead>
          
          <tbody className="divide-y divide-slate-100">
            {chronologicalAuditLedger.map((record) => {
              const isEditing = editingRowKey === record.rowKey;
              const isSelected = selectedAuditDate === record.date;

              return (
                <tr 
                  key={record.rowKey} // FIX 2: Completely resolves duplicate key warnings
                  className={`transition text-[11px] font-mono cursor-pointer relative ${
                    isSelected ? 'bg-blue-50/70 text-slate-900 font-medium' : 'hover:bg-slate-50 text-slate-600'
                  }`}
                  onClick={() => {
                    if (record.date) {
                      setSelectedAuditDate(record.date);
                      if (onRowClick) onRowClick(record.date);
                    }
                  }}
                >
                  
                  {/* Date Column */}
                  <td className="p-2.5 font-bold text-slate-900 relative">
                    <div className="flex flex-col">
                      {/* FIX 3: Safely display readable day names for events without string slice errors */}
                      <span>{isEventContext ? record.displayLabel : (record.date ? record.date.substring(5) : "")}</span>
                      {record.isHolidayShift && (
                        <span className="text-[8px] text-blue-600 font-bold truncate tracking-tight">{record.holidayName}</span>
                      )}
                    </div>
                    {isSelected && (
                      <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-[75%] bg-blue-600 rounded-r" />
                    )}
                  </td>

                  {/* Check-in Timestamp */}
                  <td className="p-2.5 text-slate-500">
                    {record.first_checkin ? record.first_checkin.split('T')[1].substring(0, 5) : '—'}
                  </td>

                  {/* Check-out Timestamp */}
                  <td className="p-2.5 text-slate-500">
                    {record.last_checkout ? record.last_checkout.split('T')[1].substring(0, 5) : '—'}
                  </td>

                  {/* Hours Dynamic Input Adjuster */}
                  <td className="p-2.5 text-center text-slate-700">
                    {isEditing ? (
                        <input 
                          type="number" 
                          value={editHours}
                          onChange={(e) => setEditHours(parseFloat(e.target.value) || 0)}
                          step="0.5"
                          min="0"
                          max="24"
                          className="w-12 bg-white border border-slate-300 rounded px-1 text-center font-bold text-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-500 py-0.5"
                          onClick={(e) => e.stopPropagation()}
                        />
                    ) : (
                      <span className={record.session_status === 'missed_checkout' ? 'text-amber-700 underline decoration-dotted font-bold' : ''}>
                        {record.total_hours}h
                      </span>
                    )}
                  </td>

                  {/* Inline Dropdown Class Selection Status */}
                  <td className="p-2.5 text-center" onClick={(e) => e.stopPropagation()}>
                    {isEditing ? (
                      <select 
                        value={editStatus}
                        onChange={(e) => setEditStatus(e.target.value)}
                        className="bg-white border border-slate-300 rounded px-1 py-0.5 text-[11px] font-mono text-slate-700 w-full focus:outline-none focus:ring-1 focus:ring-blue-500"
                      >
                        <option value="present">Present</option>
                        <option value="absent">Absent</option>
                        <option value="on permission">On Permission</option>
                      </select>
                    ) : (
                      <span className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-bold font-mono w-full text-center ${
                        record.attendance_status === 'present' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                        record.attendance_status === 'on permission' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                        record.attendance_status === 'absent' ? 'bg-rose-50 text-rose-700 border border-rose-200' :
                        'bg-slate-100 text-slate-600 border border-slate-200'
                      }`}>
                        {record.attendance_status === 'present' ? 'Present' :
                         record.attendance_status === 'absent' ? 'Absent' :
                         record.attendance_status === 'on permission' ? 'On Permission' : 'Exempt'}
                      </span>
                    )}
                  </td>

                  {/* Actions Column Controls */}
                  <td className="p-2.5 text-center" onClick={(e) => e.stopPropagation()}>
                    {isEditing ? (
                      <div className="flex gap-1 justify-center">
                        <button 
                          onClick={() => handleSaveCorrection(record.id ?? 0, record.date ?? "", record.event_id ?? null)}
                          className="p-1 bg-emerald-50 border border-emerald-300 text-emerald-700 rounded hover:bg-emerald-100 transition shadow-sm cursor-pointer"
                          title="Commit Override (derived_from_session = 0)"
                        >
                          <Save className="w-3.5 h-3.5" />
                        </button>
                        <button 
                          onClick={() => setEditingRowKey(null)}
                          className="p-1 bg-slate-50 border border-slate-200 text-slate-600 rounded hover:bg-slate-100 transition shadow-sm cursor-pointer"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ) : (
                      <button 
                        onClick={(e) => startEditingRow(e, record)}
                        className="p-1 hover:bg-slate-100 text-blue-600 border border-transparent hover:border-slate-200 rounded transition mx-auto block cursor-pointer"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </td>

                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      
      <p className="text-[10px] text-slate-600 font-mono mt-1.5 flex items-center gap-1.5">
        <Info className="w-3.5 h-3.5 text-blue-500 shrink-0" />
        Overriding row values immediately commits changes and sets <code className="bg-slate-100 px-1 py-0.5 rounded text-slate-600 text-[9px]">derived_from_session = 0</code>.
      </p>
    </div>
  );
}
