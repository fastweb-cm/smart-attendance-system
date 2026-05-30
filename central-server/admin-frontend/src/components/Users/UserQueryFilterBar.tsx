"use client";

import React, { useEffect, useState } from 'react';
import { Search, RefreshCw, UserCheck, Layers, ShieldCheck } from 'lucide-react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ListusersFilters } from '@/services/users/queries';

interface UserQueryFilterBarProps {
  filters: ListusersFilters;
  onFilterChange: (key: keyof ListusersFilters, value: string | number | undefined) => void;
  onReset: () => void;
}

export function UserQueryFilterBar({
  filters,
  onFilterChange,
  onReset
}: UserQueryFilterBarProps) {
  const searchTerm = filters.search ?? "";

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      onFilterChange("search", searchTerm || undefined);
      onFilterChange("page", 1);
    }, 400);

    return () => clearTimeout(delayDebounceFn);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchTerm]);

  return (
    <div className="bg-slate-800/95 backdrop-blur-sm border border-slate-700/60 rounded-2xl p-4 shadow-sm w-full mb-6">
      <div className="flex flex-col xl:flex-row xl:items-center gap-4 justify-between w-full">
        
        {/* Expanded 4-Column Parameter Control Track Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 flex-1 w-full">
          
          {/* 1. Global Identity Text Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400/80" />
            <Input
              type="text"
              placeholder="Search across identity parameters..."
              value={searchTerm}
              onChange={(e) => onFilterChange("search", e.target.value)}
              className="pl-9 h-10 rounded-xl bg-slate-900/40 border-slate-700/50 text-slate-200 placeholder:text-slate-500 focus-visible:ring-blue-500/50 focus-visible:border-blue-500 font-mono text-xs"
            />
          </div>

          {/* 2. Base Classification Type Switcher */}
          <div className="w-full">
            <Select
              value={filters.user_type || "all"}
              onValueChange={(val) => onFilterChange("user_type", val === "all" ? undefined : val)}
            >
              <SelectTrigger className="h-10 rounded-xl bg-slate-900/40 border-slate-700/50 text-slate-300 focus:ring-blue-500/50 font-mono text-xs">
                <div className="flex items-center gap-2 text-slate-300">
                  <Layers className="w-3.5 h-3.5 text-slate-400/80 shrink-0" />
                  <SelectValue placeholder="Classification: All Types" />
                </div>
              </SelectTrigger>
              <SelectContent className="rounded-xl bg-slate-800 border-slate-700 text-slate-300 font-mono text-xs">
                <SelectItem value="all" className="focus:bg-slate-700 focus:text-white">All Types</SelectItem>
                <SelectItem value="student" className="focus:bg-slate-700 focus:text-white">Type: Student</SelectItem>
                <SelectItem value="staff" className="focus:bg-slate-700 focus:text-white">Type: Employee</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* 3. Granular System Role Dynamic Filter */}
          { filters.user_type === "staff" && (
            <div className="w-full">
              <Select
                value={filters.role || "all"}
                onValueChange={(val) => onFilterChange("role", val === "all" ? undefined : val)}
              >
                <SelectTrigger className="h-10 rounded-xl bg-slate-900/40 border-slate-700/50 text-slate-300 focus:ring-blue-500/50 font-mono text-xs">
                <div className="flex items-center gap-2 text-slate-300">
                  <ShieldCheck className="w-3.5 h-3.5 text-slate-400/80 shrink-0" />
                  <SelectValue placeholder="System Role: All Positions" />
                </div>
              </SelectTrigger>
              <SelectContent className="rounded-xl bg-slate-800 border-slate-700 text-slate-300 font-mono text-xs">
                <SelectItem value="all" className="focus:bg-slate-700 focus:text-white">Role: All Postings</SelectItem>
                <SelectItem value="Admin" className="focus:bg-slate-700 focus:text-white">Admin</SelectItem>
                <SelectItem value="HR" className="focus:bg-slate-700 focus:text-white">Human Resources</SelectItem>
                <SelectItem value="Instructor" className="focus:bg-slate-700 focus:text-white">Instructor / Teacher</SelectItem>
                <SelectItem value="Developer" className="focus:bg-slate-700 focus:text-white">Operations Engineer</SelectItem>
              </SelectContent>
            </Select>
          </div> )}

          {/* 4. Functional Lifecycle Status Switcher */}
          <div className="w-full">
            <Select
              value={filters.status || "all"}
              onValueChange={(val) => onFilterChange("status", val === "all" ? undefined : val)}
            >
              <SelectTrigger className="h-10 rounded-xl bg-slate-900/40 border-slate-700/50 text-slate-300 focus:ring-blue-500/50 font-mono text-xs">
                <div className="flex items-center gap-2 text-slate-300">
                  <UserCheck className="w-3.5 h-3.5 text-slate-400/80 shrink-0" />
                  <SelectValue placeholder="Lifecycle: All Statuses" />
                </div>
              </SelectTrigger>
              <SelectContent className="rounded-xl bg-slate-800 border-slate-700 text-slate-300 font-mono text-xs">
                <SelectItem value="all" className="focus:bg-slate-700 focus:text-white">Status: All Statuses</SelectItem>
                <SelectItem value="active" className="focus:bg-slate-700 focus:text-white">Status: Active</SelectItem>
                <SelectItem value="inactive" className="focus:bg-slate-700 focus:text-white">Status: Inactive</SelectItem>
                <SelectItem value="dismissed" className="focus:bg-slate-700 focus:text-white">Status: Suspended</SelectItem>
              </SelectContent>
            </Select>
          </div>

        </div>

        <div className="flex items-center shrink-0">
          <Button
            variant="outline"
            onClick={() => {
              onFilterChange("search", "");
              onReset();
            }}
            className="h-10 px-4 rounded-xl border-slate-700 bg-slate-900/20 text-slate-300 hover:text-white hover:bg-slate-700 hover:border-slate-600 gap-2 w-full xl:w-auto transition-all font-mono text-xs"
          >
            <RefreshCw className="w-3.5 h-3.5 text-slate-400" />
            Reset Parameters
          </Button>
        </div>

      </div>
    </div>
  );
}
