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
import { AttendanceException, Lookup } from '@/types';

export default function Exception() {
  const [viewMode, setViewMode] = useState('list'); // 'list' | 'calendar'
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [activeEditingData, setActiveEditingData] = useState<AttendanceException | undefined>(undefined);
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
    setActiveEditingData(undefined);
    setIsSheetOpen(true);
  };

  const handleEditException = (exception: AttendanceException) => {
    setActiveEditingData(exception);
    setIsSheetOpen(true);
  }

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
    <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-5 px-6 py-2">
      
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
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full">
        {/* Tile 1: Total Exempt Days (Emerald Theme) */}
        <div className="bg-white border border-slate-200/80 hover:border-emerald-200 rounded-2xl p-5 shadow-sm relative overflow-hidden group transition-all duration-200">
          {/* Subtle Background Accent Gradient */}
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-50/0 to-emerald-50/30 opacity-0 group-hover:opacity-100 transition-opacity" />
    
          <div className="absolute top-0 right-0 p-4 text-slate-200 group-hover:text-emerald-100 transition-colors duration-200">
            <Calendar className="w-12 h-12 stroke-[1.5]" />
          </div>
    
          <p className="text-xs font-bold uppercase tracking-wider text-slate-400 relative z-10">Exempt Active Days</p>
    
          <div className="flex items-baseline gap-2 mt-3 relative z-10">
            <span className="text-3xl font-black text-slate-900 tracking-tight">{metrics.totalExemptDays}</span>
            <span className="text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">System Exclusions</span>
          </div>
    
          <p className="text-[12px] text-slate-500 mt-3 leading-relaxed relative z-10">
            Downtime deducted automatically from annual attendance calculations.
          </p>
        </div>

        {/* Tile 2: Upcoming Closures (Amber Warning Theme) */}
        <div className="bg-white border border-slate-200/80 hover:border-amber-200 rounded-2xl p-5 shadow-sm relative overflow-hidden group transition-all duration-200">
          <div className="absolute inset-0 bg-gradient-to-br from-amber-50/0 to-amber-50/30 opacity-0 group-hover:opacity-100 transition-opacity" />
    
          <div className="absolute top-0 right-0 p-4 text-slate-200 group-hover:text-amber-100 transition-colors duration-200">
            <AlertTriangle className="w-12 h-12 stroke-[1.5]" />
          </div>
    
          <p className="text-xs font-bold uppercase tracking-wider text-slate-400 relative z-10">Upcoming Sync Window</p>
    
          <div className="flex items-baseline gap-2 mt-3 relative z-10">
            <span className="text-3xl font-black text-amber-600 tracking-tight">{metrics.upcomingClosures}</span>
            <span className="text-xs font-medium text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full">Events Slated</span>
          </div>
    
          <p className="text-[12px] text-slate-500 mt-3 leading-relaxed relative z-10">
            Declared overrides pending activation. Sync starts automatically on start date.
          </p>
        </div>
      </div>

        {/* Core Workspace Switch Content Area */}
        {viewMode === 'list' ? (
          <div className="space-y-4">
            {/* List Table Content */}
            <ExceptionList onEdit={handleEditException}/>
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
        initialData={activeEditingData}
      />
    </div>
  );
}
