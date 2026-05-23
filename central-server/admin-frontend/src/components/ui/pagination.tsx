import { PaginationMetaProps } from '@/types'
import { ChevronLeft, ChevronRight } from 'lucide-react';
import React from 'react'

export default function Pagination({
    total_records,
    current_page,
    total_pages,
    limit,
    onPageChange
}: PaginationMetaProps) {
  // calculate item metric bounds safely
  const startRecordIndex = total_records === 0 ? 0 : (current_page - 1) * limit + 1;
  const endRecordIndex = Math.min(current_page * limit, total_records);
  
  return (
    <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-600 select-none">
            {/* Left bound text display details */}
            <div>
                Showing <span className="font-bold text-slate-900">{startRecordIndex}</span> to{" "}
                <span className="font-bold text-slate-900">{endRecordIndex}</span> of{" "}
                <span className="font-bold text-slate-900">{total_records}</span> records
            </div>

            {/* Right bound action trigger triggers */}
            <div className="flex items-center gap-4">
                <span className="text-[11px] font-mono tracking-wide text-slate-500">
                    Page <span className="text-slate-900 font-bold">{current_page}</span> of {total_pages || 1}
                </span>
                
                <div className="flex items-center gap-1.5">
                    <button
                        onClick={() => onPageChange(current_page - 1)}
                        disabled={current_page <= 1}
                        className="p-2 rounded-lg bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-blue-600 hover:border-blue-200 disabled:opacity-40 disabled:hover:bg-white disabled:hover:text-slate-600 disabled:hover:border-slate-200 disabled:cursor-not-allowed transition shadow-sm"
                        title="Previous Page"
                    >
                        <ChevronLeft className="w-4 h-4" />
                    </button>

                    <button
                        onClick={() => onPageChange(current_page + 1)}
                        disabled={current_page >= total_pages}
                        className="p-2 rounded-lg bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-blue-600 hover:border-blue-200 disabled:opacity-40 disabled:hover:bg-white disabled:hover:text-slate-600 disabled:hover:border-slate-200 disabled:cursor-not-allowed transition shadow-sm"
                        title="Next Page"
                    >
                        <ChevronRight className="w-4 h-4" />
                    </button>
                </div>
            </div>
        </div>
  )
}
