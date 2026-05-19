"use client";
import { INITIAL_EXCEPTIONS } from '@/lib/data';
import { CURRENT_DATE_STRING, getDaysDifference } from '@/lib/utils';
import React, { useEffect, useMemo, useState } from 'react'
import ExceptionCalendar from './ExceptionCalendar';
import ExceptionList from './ExceptionList';
import { Activity, AlertTriangle, Calendar, List, Plus } from 'lucide-react';
import ExceptionForm from './forms/ExceptionForm';
import { useExceptions } from '@/hooks/useExceptions';
import { getUsers } from '@/lib/actions/lookups';
import { Lookup } from '@/types';

export default function Exception() {
  const [viewMode, setViewMode] = useState('list'); // 'list' | 'calendar'
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [activeEditingData, setActiveEditingData] = useState(null);
  const { data: exceptions = [], isLoading } = useExceptions();


  // Month navigation controller state for dynamic calendar
  const [calendarMonth, setCalendarMonth] = useState<Date>(new Date(CURRENT_DATE_STRING));

  // Calculate high-end analytics metrics dynamically from live exception array
  const metrics = useMemo(() => {
    let totalDays = 0;
    let upcomingCount = 0;

    exceptions.forEach((item) => {
      const days = getDaysDifference(item.start_date, item.end_date);
      totalDays += days;

      if (item.start_date > CURRENT_DATE_STRING) {
        upcomingCount++;
      }
    });

    // Default base net operational business weeks formula minus cumulative system overrides
    const baseOperatingDays = 260; 
    const remainingDays = Math.max(0, baseOperatingDays - totalDays);
    const netOperatingWeeks = (remainingDays / 5).toFixed(1);

    return {
      totalExemptDays: totalDays,
      upcomingClosures: upcomingCount,
      netOperatingWeeks
    };
  }, [exceptions]);

  // Handler CRUD controls
  const handleAddNewClick = () => {
    setActiveEditingData(null);
    setIsSheetOpen(true);
  };

  const handleNavigateMonth = (offset: number) => {
    setCalendarMonth((prev: Date) => new Date(prev.getFullYear(), prev.getMonth() + offset, 1));
  };

  if (isLoading) return <div className="text-center">loading...</div>

  return (
    <div>

      <div className="max-w-7xl w-full space-y-8">
        
        {/* Dynamic Context and Page Heading */}
<div className="sticky top-0 z-30">
  <div className="bg-white backdrop-blur-xl shadow-xl">
    
    {/* Top navigation content */}
    <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-5 px-6 py-5">
      
      {/* Left contextual section */}
      <div className="min-w-0">
        <h2 className="text-2xl font-bold tracking-tight text-text">
          Attendance Exceptions
        </h2>

        <p className="text-sm text-slate-400 mt-1 max-w-2xl leading-relaxed">
          Declare global holidays, emergency events, and maintenance windows to
          automatically exempt attendance records from operational calculations.
        </p>
      </div>

      {/* Right actions */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        
        {/* View mode toggle */}
        <div className="inline-flex items-center bg-slate-900/90 border border-slate-700 rounded-xl p-1">
          <button
            onClick={() => setViewMode('list')}
            className={`flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all duration-200 ${
              viewMode === 'list'
                ? 'bg-slate-100 text-slate-900 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            <List className="w-3.5 h-3.5" />
            List
          </button>

          <button
            onClick={() => setViewMode('calendar')}
            className={`flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all duration-200 ${
              viewMode === 'calendar'
                ? 'bg-slate-100 text-slate-900 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            Calendar
          </button>
        </div>

        {/* Add button */}
        <button
          onClick={handleAddNewClick}
          className="flex items-center cursor-pointer justify-center gap-2 bg-primary text-white font-bold px-5 py-2 rounded-xl text-sm transition-all duration-200 shadow-lg shadow-emerald-500/20"
        >
          <Plus className="w-4 h-4" strokeWidth={2.5} />
          Add Exception
        </button>
      </div>
    </div>

    {/* Bottom subtle navigation border glow */}
    <div className="h-px w-full bg-gradient-to-r from-transparent via-slate-700 to-transparent" />
  </div>
</div>

        {/* Dynamic Metric Display Tiles Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Tile 1: Total Exempt Days */}
          <div className="bg-slate-900 border border-slate-800/80 rounded-xl p-5 shadow-sm relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
              <Calendar className="w-16 h-16 text-emerald-400" />
            </div>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Exempt Active Days</p>
            <div className="flex items-baseline gap-2 mt-3">
              <span className="text-3xl font-extrabold text-slate-100 tracking-tight">{metrics.totalExemptDays}</span>
              <span className="text-xs text-slate-400">Defined System Exclusions</span>
            </div>
            <p className="text-[11px] text-slate-400 mt-2">
              Downtime deducted automatically from annual attendance calculations.
            </p>
          </div>

          {/* Tile 2: Upcoming Closures */}
          <div className="bg-slate-900 border border-slate-800/80 rounded-xl p-5 shadow-sm relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
              <AlertTriangle className="w-16 h-16 text-amber-400" />
            </div>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Upcoming Sync Window</p>
            <div className="flex items-baseline gap-2 mt-3">
              <span className="text-3xl font-extrabold text-amber-400 tracking-tight">{metrics.upcomingClosures}</span>
              <span className="text-xs text-slate-400">Events Slated</span>
            </div>
            <p className="text-[11px] text-slate-400 mt-2">
              Declared overrides pending activation. Sync starts automatically on start date.
            </p>
          </div>

          {/* Tile 3: Net Operating Weeks */}
          {/* <div className="bg-slate-900 border border-slate-800/80 rounded-xl p-5 shadow-sm relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
              <Activity className="w-16 h-16 text-sky-400" />
            </div>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Adjusted Operating Weeks</p>
            <div className="flex items-baseline gap-2 mt-3">
              <span className="text-3xl font-extrabold text-slate-100 tracking-tight">{metrics.netOperatingWeeks}</span>
              <span className="text-xs text-slate-400">Weeks Remaining</span>
            </div>
            <p className="text-[11px] text-slate-400 mt-2">
              Calculated dynamically using standard 5-day payroll weeks.
            </p>
          </div> */}
        </div>

        {/* Core Workspace Switch Content Area */}
        {viewMode === 'list' ? (
          <div className="space-y-4">
            {/* List Table Content */}
            <ExceptionList />
          </div>
        ) : (
          /* Calendar Visual Grid Map View */
          <ExceptionCalendar 
            exceptions={exceptions}
            currentMonthDate={calendarMonth}
            onNavigateMonth={handleNavigateMonth}
          />
        )}
      </div>


      {/* Slide-over Workspace Modal Panel Drawer Container */}
      <ExceptionForm 
        isOpen={isSheetOpen}
        onClose={() => setIsSheetOpen(false)}
        // initialData={activeEditingData}
      />
    </div>
  );
}
