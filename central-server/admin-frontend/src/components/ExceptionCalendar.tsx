"use client";

import {useMemo } from 'react';

import {ChevronLeft, ChevronRight } from "lucide-react";
import { ExceptionType, AttendanceException } from '@/types';
import { CURRENT_DATE_STRING } from '@/lib/utils';

export default function ExceptionCalendar({ exceptions, currentMonthDate, onNavigateMonth }: { exceptions: AttendanceException[]; currentMonthDate: Date; onNavigateMonth: (delta: number) => void }) {
  const currentYear = currentMonthDate.getFullYear();
  const currentMonth = currentMonthDate.getMonth();

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];


  // Helper arrays for calendar offsets
  // computed inside memo to keep dependencies accurate

  // Create array representing day objects in calendar view
  const calendarCells = useMemo(() => {
    const cells = [];
    
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const firstDayIndex = new Date(currentYear, currentMonth, 1).getDay();

    // Fill prior month offset padding
    const prevMonthDays = new Date(currentYear, currentMonth, 0).getDate();
    for (let i = firstDayIndex - 1; i >= 0; i--) {
      cells.push({
        dayNumber: prevMonthDays - i,
        isCurrentMonth: false,
        dateString: null
      });
    }

    // Fill current month days
    for (let day = 1; day <= daysInMonth; day++) {
      const formattedMonth = String(currentMonth + 1).padStart(2, '0');
      const formattedDay = String(day).padStart(2, '0');
      const dateString = `${currentYear}-${formattedMonth}-${formattedDay}`;

      // Check exception hits
      const exceptionsFound = exceptions.filter((item: AttendanceException) => {
        return dateString >= item.start_date && dateString <= item.end_date;
      });

      cells.push({
        dayNumber: day,
        isCurrentMonth: true,
        dateString,
        exceptions: exceptionsFound
      });
    }

    // Fill post month padding cells for complete grid alignment
    const totalGridSize = 42; // standard 6-row layout grid
    const remainingCells = totalGridSize - cells.length;
    for (let i = 1; i <= remainingCells; i++) {
      cells.push({
        dayNumber: i,
        isCurrentMonth: false,
        dateString: null
      });
    }

    return cells;
  }, [currentYear, currentMonth, exceptions]);

  // Map exception category themes onto specific grid block styles
  const getStyleForExceptionType = (type: ExceptionType) => {
    switch (type) {
      case 'public_holiday':
        return 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300';
      case 'company_event':
        return 'bg-sky-500/15 border-sky-500/40 text-sky-300';
      case 'system_maintenance':
        return 'bg-amber-500/15 border-amber-500/40 text-amber-300';
      case 'emergency_closure':
        return 'bg-rose-500/15 border-rose-500/40 text-rose-300';
      default:
        return 'bg-slate-500/15 border-slate-500/40 text-slate-300';
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
      {/* Calendar Switcher Bar */}
      <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-800">
        <div>
          <h3 className="text-base font-semibold text-slate-200">Exclusion Mapping Matrix</h3>
          <p className="text-xs text-slate-400 mt-0.5">Visually track upcoming operating downtime on the dashboard calendar grid</p>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={() => onNavigateMonth(-1)}
            className="p-1.5 rounded-lg border border-slate-800 bg-slate-950 hover:bg-slate-800 text-slate-400 hover:text-slate-100 transition-all"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-sm font-semibold text-slate-200 min-w-30 text-center">
            {monthNames[currentMonth]} {currentYear}
          </span>
          <button 
            onClick={() => onNavigateMonth(1)}
            className="p-1.5 rounded-lg border border-slate-800 bg-slate-950 hover:bg-slate-800 text-slate-400 hover:text-slate-100 transition-all"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Grid Days of Week Labels */}
      <div className="grid grid-cols-7 gap-1 text-center mb-1">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
          <div key={day} className="py-2 text-xs font-semibold text-slate-400 bg-slate-950/40 rounded-md">
            {day}
          </div>
        ))}
      </div>

      {/* Real Grid System Mapping */}
      <div className="grid grid-cols-7 gap-1.5">
        {calendarCells.map((cell, index) => {
          const isToday = cell.dateString === CURRENT_DATE_STRING;
          const hasExceptions = cell.exceptions && cell.exceptions.length > 0;
          const firstEx = hasExceptions ? cell.exceptions[0] : null;

          return (
            <div 
              key={index}
              className={`min-h-22.5 p-2 rounded-lg border transition-all duration-150 flex flex-col justify-between group cursor-default
                ${cell.isCurrentMonth ? 'bg-slate-950' : 'bg-slate-950/20 text-slate-600'}
                ${isToday ? 'ring-1 ring-emerald-500 border-emerald-500' : 'border-slate-800/60 hover:border-slate-700'}
                ${firstEx ? getStyleForExceptionType(firstEx.exception_type) : ''}
              `}
            >
              <div className="flex justify-between items-center">
                <span className={`text-xs font-bold ${cell.isCurrentMonth ? 'text-slate-200' : 'text-slate-700'} ${isToday ? 'bg-emerald-500 text-slate-950 px-1.5 py-0.5 rounded' : ''}`}>
                  {cell.dayNumber}
                </span>
                {isToday && <span className="text-[9px] text-emerald-400 font-bold uppercase tracking-widest">Today</span>}
              </div>

              {/* Day Exceptions Block Content */}
              {hasExceptions && (
                <div className="mt-1 space-y-1">
                  {cell.exceptions.map((ex: AttendanceException) => (
                    <div 
                      key={ex.id} 
                      className="text-[10px] truncate leading-tight font-medium px-1.5 py-0.5 rounded bg-slate-950/40 border border-current/10"
                      title={`${ex.title}: ${ex.description || 'No description provided'}`}
                    >
                      {ex.title}
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Calendar Legend indicators */}
      <div className="mt-6 pt-4 border-t border-slate-800 flex flex-wrap gap-4 items-center justify-center text-xs text-slate-400">
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded bg-emerald-500/20 border border-emerald-500" /> Public Holidays
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded bg-sky-500/20 border border-sky-500" /> Company Events
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded bg-amber-500/20 border border-amber-500" /> System Maintenance
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded bg-rose-500/20 border border-rose-500" /> Emergency Closures
        </span>
      </div>
    </div>
  );
}
