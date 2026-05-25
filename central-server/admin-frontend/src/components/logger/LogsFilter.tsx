"use client";

import React from 'react';
import { SlidersHorizontal, Layers, RefreshCw } from 'lucide-react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { LogsFilterBarProps } from '@/types';

export function LogsFilter({
  filters,
  onFilterChange,
  onReset,
  disabled
}: LogsFilterBarProps) {
  return (
    <div className="bg-slate-800/95 backdrop-blur-sm border border-slate-700/60 rounded-2xl p-4 shadow-sm w-full">
      <div className="flex items-center gap-2 mb-4 text-slate-300 font-semibold text-sm">
        <SlidersHorizontal className="w-4 h-4 text-indigo-400" />
        <span>Filter Audit Trails</span>
      </div>
      
      <div className="flex flex-col xl:flex-row xl:items-center gap-4 justify-between w-full">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 flex-1 w-full">
          
          {/* 1. Category Switcher Component */}
          <div className="w-full">
            <Select
              value={filters.category || ""}
              onValueChange={(val) => onFilterChange("category", val || undefined)}
              disabled={disabled}
            >
              <SelectTrigger className="h-10 rounded-xl bg-slate-900/40 border-slate-700/50 text-slate-300 focus:ring-blue-500/50">
                <div className="flex items-center gap-2 text-slate-300">
                  <Layers className="w-3.5 h-3.5 text-slate-400/80 shrink-0" />
                  <SelectValue placeholder="All Categories" />
                </div>
              </SelectTrigger>
              <SelectContent className="rounded-xl bg-slate-800 border-slate-700 text-slate-300">
                <SelectItem value="system" className="focus:bg-slate-700 focus:text-white">Cat: System</SelectItem>
                {disabled && <SelectItem value="error" className="focus:bg-slate-700 focus:text-white">Cat: Error</SelectItem> }
                <SelectItem value="sync" className="focus:bg-slate-700 focus:text-white">Cat: Sync</SelectItem>
                <SelectItem value="database" className="focus:bg-slate-700 focus:text-white">Cat: Database</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* 2. Log Level Switcher Component */}
          {!disabled && <div className="w-full">
            <Select
              value={filters.level || "all"}
              onValueChange={(val) => onFilterChange("level", val === "all" ? undefined : val)}
            >
              <SelectTrigger className="h-10 rounded-xl bg-slate-900/40 border-slate-700/50 text-slate-300 focus:ring-blue-500/50">
                <div className="flex items-center gap-2 text-slate-300">
                  <Layers className="w-3.5 h-3.5 text-slate-400/80 shrink-0" />
                  <SelectValue placeholder="All Levels" />
                </div>
              </SelectTrigger>
              <SelectContent className="rounded-xl bg-slate-800 border-slate-700 text-slate-300">
                <SelectItem value="all" className="focus:bg-slate-700 focus:text-white">Level: All</SelectItem>
                <SelectItem value="info" className="focus:bg-slate-700 focus:text-white">Level: Info</SelectItem>
                <SelectItem value="warning" className="focus:bg-slate-700 focus:text-white">Level: Warning</SelectItem>
                {/* <SelectItem value="error" className="focus:bg-slate-700 focus:text-white">Level: Error</SelectItem> */}
              </SelectContent>
            </Select>
          </div>}

          {/* 3. Start Date Tracking Input Parameter */}
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[10px] font-bold uppercase tracking-wider text-slate-400/70 pointer-events-none">
              From
            </span>
            <Input
              type="date"
              value={filters.start_date || ""}
              onChange={(e) => onFilterChange("start_date", e.target.value)}
              className="pl-14 h-10 rounded-xl bg-slate-900/40 border-slate-700/50 text-slate-300 font-medium focus-visible:ring-blue-500/50"
            />
          </div>

          {/* 4. End Date Tracking Input Parameter */}
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[10px] font-bold uppercase tracking-wider text-slate-400/70 pointer-events-none">
              To
            </span>
            <Input
              type="date"
              value={filters.end_date || ""}
              onChange={(e) => onFilterChange("end_date", e.target.value)}
              className="pl-10 h-10 rounded-xl bg-slate-900/40 border-slate-700/50 text-slate-300 font-medium focus-visible:ring-blue-500/50"
            />
          </div>

        </div>

        {/* Action Controls Container */}
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
