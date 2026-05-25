"use client";

import React, { useMemo } from 'react'; // Added useMemo
import { Search, Filter, Layers, RefreshCw } from 'lucide-react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AttendanceFilterBarProps } from '@/types';

export function AttendanceFilterBar({
  filters,
  onFilterChange,
  onReset
}: AttendanceFilterBarProps) {
  
const maxAllowedEndDate = useMemo(() => {
  const localDate = new Date();
  localDate.setDate(localDate.getDate() - 1);
  
  const year = localDate.getFullYear();
  const month = String(localDate.getMonth() + 1).padStart(2, '0');
  const day = String(localDate.getDate()).padStart(2, '0');
  
  return `${year}-${month}-${day}`; // Hard-locked to local yesterday date profile
}, []);

  return (
    /* Soft Muted Charcoal Slate container framework */
    <div className="bg-slate-800/95 backdrop-blur-sm border border-slate-700/60 rounded-2xl p-4 shadow-sm w-full">
      <div className="flex flex-col xl:flex-row xl:items-center gap-4 justify-between w-full">
        
        {/* Responsive Control Layout Matrix */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-2 flex-1 w-full">
          
          {/* 1. Search Filter Input Component */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400/80" />
            <Input
              type="text"
              placeholder="Search employee..."
              value={filters.search}
              onChange={(e) => onFilterChange("search", e.target.value)}
              className="pl-9 h-10 rounded-xl bg-slate-900/40 border-slate-700/50 text-slate-200 placeholder:text-slate-500 focus-visible:ring-blue-500/50 focus-visible:border-blue-500"
            />
          </div>

          {/* 2. Context Filter Dropdown Switcher (Daily vs Event) */}
          <div className="w-full">
            <Select
              value={filters.context || "event"}
              onValueChange={(val) => onFilterChange("context", val)}
            >
              <SelectTrigger className="h-10 rounded-xl bg-slate-900/40 border-slate-700/50 text-slate-300 focus:ring-blue-500/50">
                <div className="flex items-center gap-2 text-slate-300">
                  <Layers className="w-3.5 h-3.5 text-slate-400/80 shrink-0" />
                  <SelectValue placeholder="Context: Event" />
                </div>
              </SelectTrigger>
              <SelectContent className="rounded-xl bg-slate-800 border-slate-700 text-slate-300">
                <SelectItem value="event" className="focus:bg-slate-700 focus:text-white">Context: Event</SelectItem>
                <SelectItem value="daily" className="focus:bg-slate-700 focus:text-white">Context: Daily</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* 4. Start Date Tracking Input Parameter */}
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[10px] font-bold uppercase tracking-wider text-slate-400/70 pointer-events-none">
              From
            </span>
            <Input
              type="date"
              value={filters.start_date}
              onChange={(e) => onFilterChange("start_date", e.target.value)}
              className="pl-14 h-10 rounded-xl bg-slate-900/40 border-slate-700/50 text-slate-300 font-medium focus-visible:ring-blue-500/50"
            />
          </div>

          {/* 5. End Date Tracking Input Parameter (Enforced With native max picker limits) */}
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[10px] font-bold uppercase tracking-wider text-slate-400/70 pointer-events-none">
              To
            </span>
            <Input
              type="date"
              value={filters.end_date}
              max={maxAllowedEndDate} // Added native attribute protection
              onChange={(e) => onFilterChange("end_date", e.target.value)}
              className="pl-10 h-10 rounded-xl bg-slate-900/40 border-slate-700/50 text-slate-300 font-medium focus-visible:ring-blue-500/50"
            />
          </div>

        </div>

        {/* Auxiliary Reset Action Button Wrapper */}
        <div className="flex items-center shrink-0">
          <Button
            variant="outline"
            onClick={onReset}
            className="h-10 px-4 rounded-xl border-slate-700 bg-slate-900/20 text-slate-300 hover:text-white hover:bg-slate-700 hover:border-slate-600 gap-2 w-full xl:w-auto transition-all"
          >
            <RefreshCw className="w-3.5 h-3.5 text-slate-400" />
            Reset Filters
          </Button>
        </div>

      </div>
    </div>
  );
}
