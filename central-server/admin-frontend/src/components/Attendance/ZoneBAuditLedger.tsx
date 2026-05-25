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

  const [editingRowKey, setEditingRowKey] = useState<string | null>(null);
  const [selectedAuditDate, setSelectedAuditDate] = useState<string>(() => getPreviousDay());
  const [editHours, setEditHours] = useState<number>(0);
  const [editStatus, setEditStatus] = useState<string>("");

  const { data, isLoading } = useAttendanceLedger(queryParams);
  const isEventContext = queryParams.context === 'event';

  const chronologicalAuditLedger = useMemo(() => {
    if (!data) return [];

    type AttendanceRecord = AttendanceTableProps["attendanceSummary"] extends Array<infer U> ? U : never;
    type AuditLedgerRecord = AttendanceRecord & { 
      isHolidayShift: boolean; 
      holidayName?: string; 
      rowKey: string; 
      displayLabel: string; 
      isWeekend: boolean;
    };

    const userRecords = data.attendanceSummary.filter(u => u.employee_id === userId);

    return data.calendarDates.reduce<AuditLedgerRecord[]>((acc, cd) => {
      const targetExactDate = cd.exact_date ?? "";
      const targetRaw = cd.raw ?? "";
      const targetDisplayLabel = cd.dayName ?? cd.label ?? "";

      const exception = data.exceptions?.find((ex) => ex.date === targetExactDate);
      
      // Look at the display label or the actual date object to detect weekends
      const lowerLabel = targetDisplayLabel.toLowerCase();
      const isWeekendDay = lowerLabel.startsWith("sat") || lowerLabel.startsWith("sun");

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

      const uniqueRowKey = isEventContext ? `${targetRaw}_${targetExactDate}` : targetExactDate;

      acc.push({
        ...record,
        isHolidayShift: !!exception,
        holidayName: exception?.name ?? "",
        rowKey: uniqueRowKey,
        displayLabel: targetDisplayLabel,
        isWeekend: isWeekendDay
      });

      return acc;
    }, []);
  }, [data, userId, isEventContext]);

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
      date: targetDate,
      context: queryParams.context,
      eventId: eventId
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

              // =========================================================================
              // PRIORITY STATUS EVALUATION (Type-Safe Fix)
              // =========================================================================
              const hasActiveStatus = record.attendance_status === 'present' || record.attendance_status === 'on permission';
              const isAbsentState = record.attendance_status === 'absent';

              // FIX: Explicitly type statusLabel as a generic string so it can safely accept 'exempt' and '—'
              let statusLabel: string = record.attendance_status ?? 'absent';
              let badgeStyle = "bg-slate-100 text-slate-600 border border-slate-200";

              if (hasActiveStatus) {
                if (record.attendance_status === 'present') {
                  statusLabel = 'Present';
                  badgeStyle = 'bg-emerald-50 text-emerald-700 border border-emerald-200';
                } else {
                  statusLabel = 'On Permission';
                  badgeStyle = 'bg-amber-50 text-amber-700 border border-amber-200';
                }
              } else if (isAbsentState) {
                if (record.isHolidayShift) {
                  statusLabel = 'Exempt';
                  badgeStyle = 'bg-indigo-50 text-indigo-700 border border-indigo-200';
                } else if (record.isWeekend && !isEventContext) {
                  statusLabel = '—';
                  badgeStyle = 'text-slate-400 font-normal py-0.5 text-center block w-full';
                } else {
                  statusLabel = 'Absent';
                  badgeStyle = 'bg-rose-50 text-rose-700 border border-rose-200';
                }
              }

              return (
                <tr 
                  key={record.rowKey}
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
                      <span>{isEventContext ? record.displayLabel : (record.date ? record.date.substring(5) : "")}</span>
                      {record.isHolidayShift && (
                        <span className="text-[8px] text-indigo-600 font-bold truncate tracking-tight uppercase">
                          {record.holidayName || "Holiday"}
                        </span>
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

                  {/* Hours */}
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

                  {/* Attendance Status Badge Cell */}
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
                      <span className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-bold font-mono w-full text-center ${badgeStyle}`}>
                        {statusLabel}
                      </span>
                    )}
                  </td>

                  {/* Actions */}
                  <td className="p-2.5 text-center" onClick={(e) => e.stopPropagation()}>
                    {isEditing ? (
                      <div className="flex gap-1 justify-center">
                        <button 
                          onClick={() => handleSaveCorrection(record.id ?? 0, record.date ?? "", record.event_id ?? null)}
                          className="p-1 bg-emerald-50 border border-emerald-300 text-emerald-700 rounded hover:bg-emerald-100 transition shadow-sm cursor-pointer"
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
