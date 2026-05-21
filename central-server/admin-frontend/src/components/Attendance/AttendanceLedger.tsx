"use client";

import React, { useEffect, useState } from 'react';
import { AttendanceFilterBar } from './AttendanceFilterBar';
import { AttendanceQueryParams } from '@/types';
import { useAttendanceLedger } from '@/hooks/useAttendance';
import AttendanceHeader from './AttendanceHeader';
import AttendanceTable from './AttendanceTable';

export default function AttendanceLedger() {

  // Synchronized state tracking bounds matching your exact backend payload keys
  const [filters, setFilters] = useState<AttendanceQueryParams & { search?: string }>({
    search: "",
    status: "all",
    context: "daily", // Explicitly starting with your preferred default context configuration
    start_date: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    end_date: new Date().toISOString().split('T')[0],
    page: 1,
    limit: 10
  });

  // Local state to manage smooth search debounce throttling
  const [debouncedSearch, setDebouncedSearch] = useState(filters.search);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(filters.search);
    }, 400); // 400ms delay window

    return () => clearTimeout(handler);
  }, [filters.search]);

  // Prepare optimized params payload object for your hook query request
  const queryParams: AttendanceQueryParams = {
    context: filters.context,
    // Safely normalize "all" dropdown options to undefined so your API doesn't treat "all" as a literal string status flag
    status: filters.status === 'all' ? undefined : filters.status,
    start_date: filters.start_date,
    end_date: filters.end_date,
    ...(debouncedSearch ? { search: debouncedSearch } : {}),
    page: filters.page,
    limit: filters.limit
  };

  // Consume the TanStack Query hook using current state values
  const { data, isLoading, isError, error, refetch } = useAttendanceLedger(queryParams);

  // Safely extract responses from the query result with fallback defaults to prevent runtime errors during loading states
  const metrics = data?.metrics || {};
  const calendarDates = data?.calendarDates || [];
  const users = data?.users || [];
  const exceptions = data?.exceptions || [];
  const attendanceSummary = data?.attendanceSummary || [];

  // 3. Type-safe configuration change link handler
  const handleFilterChange = (key: keyof AttendanceQueryParams | 'search', value: string) => {
    setFilters(prev => ({ 
      ...prev, 
      [key]: value 
    }));
  };

  // 4. Complete filter state reset anchor
  const handleResetFilters = () => {
    setFilters({
      search: "",
      status: "all",
      context: "daily",
      start_date: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      end_date: new Date().toISOString().split('T')[0],
      page: 1,
      limit: 10
    });
  };

  return (
    <div className="space-y-8 w-full">
      {/* Sticky Header Container */}
      <AttendanceHeader globalMetrics={metrics} />

      {/* Filter Bar */}
      <AttendanceFilterBar
        filters={filters}
        onFilterChange={handleFilterChange}
        onReset={handleResetFilters}
      />

      {/* Attendance Table */}
      <AttendanceTable calendarDates={calendarDates} users={users} exceptions={exceptions} attendanceSummary={attendanceSummary} context={filters.context || "daily"}/>
    </div>
  );
}
