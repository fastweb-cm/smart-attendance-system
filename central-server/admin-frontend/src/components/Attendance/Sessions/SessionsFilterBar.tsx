"use client";

import React from 'react';
import { Search, Layers, RefreshCw, Building2, Check } from 'lucide-react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { AttendanceSessionFilterBarProps } from '@/types';
import { useTerminalsLookup, useEventsLookup } from '@/hooks/useLookups';

export function SessionsFilterBar({ filters, onFilterChange, onReset }: AttendanceSessionFilterBarProps) {
  const { data: terminals = [] } = useTerminalsLookup();
  const { data: events = [] } = useEventsLookup();

  const selectedTerminalIds = filters.terminal_ids ?? [];

  const toggleTerminal = (id: number) => {
    const next = selectedTerminalIds.includes(id)
      ? selectedTerminalIds.filter((t) => t !== id)
      : [...selectedTerminalIds, id];
    onFilterChange("terminal_ids", next.length ? next : undefined);
  };

  return (
    <div className="bg-slate-800/95 backdrop-blur-sm border border-slate-700/60 rounded-2xl p-4 shadow-sm w-full">
      <div className="flex flex-col xl:flex-row xl:items-center gap-4 justify-between w-full">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-7 gap-2 flex-1 w-full">

          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400/80" />
            <Input
              placeholder="Search user or ID..."
              value={filters.search ?? ""}
              onChange={(e) => onFilterChange("search", e.target.value)}
              className="pl-9 h-10 rounded-xl bg-slate-900/40 border-slate-700/50 text-slate-200 placeholder:text-slate-500"
            />
          </div>

          <Select value={filters.context || "all"} onValueChange={(v) => onFilterChange("context", v)}>
            <SelectTrigger className="h-10 rounded-xl bg-slate-900/40 border-slate-700/50 text-slate-300">
              <div className="flex items-center gap-2">
                <Layers className="w-3.5 h-3.5 text-slate-400/80" />
                <SelectValue placeholder="Context" />
              </div>
            </SelectTrigger>
            <SelectContent className="bg-slate-800 border-slate-700 text-slate-300">
              <SelectItem value="all">All Contexts</SelectItem>
              <SelectItem value="daily">Daily</SelectItem>
              <SelectItem value="event">Event</SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={filters.event_id?.toString() ?? ""}
            onValueChange={(v) => onFilterChange("event_id", v ? Number(v) : undefined)}
            disabled={filters.context !== "event"}
          >
            <SelectTrigger className="h-10 rounded-xl bg-slate-900/40 border-slate-700/50 text-slate-300 disabled:opacity-40">
              <SelectValue placeholder="Select event" />
            </SelectTrigger>
            <SelectContent className="bg-slate-800 border-slate-700 text-slate-300">
              {events.map((e) => (
                <SelectItem key={e.id} value={e.id.toString()}>{e.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Terminal multi-select */}
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className="h-10 rounded-xl bg-slate-900/40 border-slate-700/50 text-slate-300 justify-start font-normal gap-2 hover:bg-slate-900/60 hover:text-slate-200"
              >
                <Building2 className="w-3.5 h-3.5 text-slate-400/80 shrink-0" />
                <span className="truncate">
                  {selectedTerminalIds.length === 0
                    ? "All Terminals"
                    : `${selectedTerminalIds.length} terminal${selectedTerminalIds.length > 1 ? "s" : ""}`}
                </span>
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-56 p-1.5 bg-slate-800 border-slate-700" align="start">
              {terminals.map((t) => {
                const checked = selectedTerminalIds.includes(t.id);
                return (
                  <button
                    key={t.id}
                    onClick={() => toggleTerminal(t.id)}
                    className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-sm text-slate-300 hover:bg-slate-700/60 transition"
                  >
                    <Checkbox checked={checked} className="pointer-events-none" />
                    <span className="truncate">{t.name}</span>
                    {checked && <Check className="w-3.5 h-3.5 text-primary ml-auto shrink-0" />}
                  </button>
                );
              })}
              {selectedTerminalIds.length > 0 && (
                <button
                  onClick={() => onFilterChange("terminal_ids", undefined)}
                  className="w-full text-left px-2 py-1.5 mt-1 rounded-lg text-xs text-slate-400 hover:text-slate-200 border-t border-slate-700/60 pt-2"
                >
                  Clear selection
                </button>
              )}
            </PopoverContent>
          </Popover>

          <Select value={filters.status ?? "any"} onValueChange={(v) => onFilterChange("status", v === "any" ? undefined : v)}>
            <SelectTrigger className="h-10 rounded-xl bg-slate-900/40 border-slate-700/50 text-slate-300">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent className="bg-slate-800 border-slate-700 text-slate-300">
              <SelectItem value="any">Any Status</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="missed checkout">Missed Checkout</SelectItem>
            </SelectContent>
          </Select>

          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[10px] font-bold uppercase tracking-wider text-slate-400/70 pointer-events-none">From</span>
            <Input
              type="date"
              value={filters.from_date ?? ""}
              onChange={(e) => onFilterChange("from_date", e.target.value)}
              className="pl-14 h-10 rounded-xl bg-slate-900/40 border-slate-700/50 text-slate-300"
            />
          </div>

          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[10px] font-bold uppercase tracking-wider text-slate-400/70 pointer-events-none">To</span>
            <Input
              type="date"
              value={filters.to_date ?? ""}
              onChange={(e) => onFilterChange("to_date", e.target.value)}
              className="pl-10 h-10 rounded-xl bg-slate-900/40 border-slate-700/50 text-slate-300"
            />
          </div>
        </div>

        <Button variant="outline" onClick={onReset} className="h-10 px-4 rounded-xl border-slate-700 bg-slate-900/20 text-slate-300 gap-2 shrink-0">
          <RefreshCw className="w-3.5 h-3.5" /> Reset
        </Button>
      </div>
    </div>
  );
}
