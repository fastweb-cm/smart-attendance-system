"use client";

import React from 'react';
import { Search, Filter, RefreshCw } from 'lucide-react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PermissionFilterProps } from '@/types';


export function PermissionFilter({
  filters,
  onFilterChange,
  onReset
}: PermissionFilterProps) {
  return (
    /* Soft Muted Charcoal Slate container framework matching layout defaults */
    <div className="bg-slate-800/95 backdrop-blur-sm border border-slate-700/60 rounded-2xl p-4 shadow-sm w-full">
      <div className="flex flex-col lg:flex-row lg:items-center gap-4 justify-between w-full">
        
        {/* Responsive Grid Matrix for dynamic query parameters */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2 flex-1 w-full">
          
          {/* 1. Employee Search Filter Input Component */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400/80" />
            <Input
              type="text"
              placeholder="Search employee..."
              value={filters.search || ""}
              onChange={(e) => onFilterChange("search", e.target.value)}
              className="pl-9 h-10 rounded-xl bg-slate-900/40 border-slate-700/50 text-slate-200 placeholder:text-slate-500 focus-visible:ring-blue-500/50 focus-visible:border-blue-500"
            />
          </div>

          {/* 2. Permission Evaluation Status Select Box */}
          <div className="w-full">
            <Select
              value={filters.status || "all"}
              onValueChange={(val) => onFilterChange("status", val === "all" ? undefined : val)}
            >
              <SelectTrigger className="h-10 rounded-xl bg-slate-900/40 border-slate-700/50 text-slate-300 focus:ring-blue-500/50">
                <div className="flex items-center gap-2 text-slate-300">
                  <Filter className="w-3.5 h-3.5 text-slate-400/80 shrink-0" />
                  <SelectValue placeholder="Status: All" />
                </div>
              </SelectTrigger>
              <SelectContent className="rounded-xl bg-slate-800 border-slate-700 text-slate-300">
                <SelectItem value="all" className="focus:bg-slate-700 focus:text-white">Status: All Requests</SelectItem>
                <SelectItem value="pending" className="focus:bg-slate-700 focus:text-white">Pending</SelectItem>
                <SelectItem value="approved" className="focus:bg-slate-700 focus:text-white">Approved</SelectItem>
                <SelectItem value="rejected" className="focus:bg-slate-700 focus:text-white">Rejected</SelectItem>
              </SelectContent>
            </Select>
          </div>

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

        {/* Action Button Wrapper */}
        <div className="flex items-center shrink-0">
          <Button
            variant="outline"
            onClick={onReset}
            className="h-10 px-4 rounded-xl border-slate-700 bg-slate-900/20 text-slate-300 hover:text-white hover:bg-slate-700 hover:border-slate-600 gap-2 w-full lg:w-auto transition-all"
          >
            <RefreshCw className="w-3.5 h-3.5 text-slate-400" />
            Reset Filters
          </Button>
        </div>

      </div>
    </div>
  );
}
