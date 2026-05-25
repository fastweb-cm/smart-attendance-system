"use client";

import React, { useState } from 'react';
import { FormProvider, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2, ArrowLeft, CheckCircle2, XCircle, Calendar, User, FileText } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { Button } from '../ui/button';
import { PermissionReviewSchema, PermissionReviewValues } from '@/schema/permission-review.schema'; 
import { useReviewPermission } from '@/hooks/usePermissions'; 
import { PermissionRowType } from '@/types';
import { cn } from '@/lib/utils';

interface PermissionReviewFormProps {
  permissionData: PermissionRowType;
  onCancel: () => void;      
}

export default function PermissionReviewForm({
  permissionData,
  onCancel
}: PermissionReviewFormProps) {
  const { user } = useAuth();
  const reviewPermissionMutation = useReviewPermission();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const defaultFormValues: PermissionReviewValues = {
    id: permissionData.id ?? 0,
    status: "approved",
    review_notes: "",
    reviewed_by: user?.id ?? 0,
  };

  const methods = useForm<PermissionReviewValues>({
    resolver: zodResolver(PermissionReviewSchema),
    defaultValues: defaultFormValues,
  });

  const currentStatus = methods.watch("status");

  // Calculate inclusive calendar day range span
  const totalDays = React.useMemo(() => {
    if (!permissionData.start_date || !permissionData.end_date) return 0;
    const start = new Date(permissionData.start_date);
    const end = new Date(permissionData.end_date);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
  }, [permissionData]);

  const onSubmit = async (data: PermissionReviewValues) => {
    // FIX: Map local form values to the exact naming convention expected by your API contract
    const apiPayload = {
      permission_id: Number(data.id),
      approver_id: Number(data.reviewed_by),
      status: data.status,
      remark: data.review_notes || null // Map empty string inputs to clean null values
    };

    console.log("Submitting API-mapped review verdict:", apiPayload);
    try {
      setIsSubmitting(true);
      await reviewPermissionMutation.mutateAsync({
        body: apiPayload,
      });
      if (onCancel) onCancel();
    } catch (error) {
      console.error('An error occurred while processing the decision pipeline:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden">
      
      {/* Header Context Bar */}
      <div className="p-6 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/20 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-sm font-extrabold text-slate-900 dark:text-slate-100 tracking-wider uppercase">
            Evaluate Leave Permission Request
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-normal">
            Reviewing justification arguments and executing a systemic approval/rejection verdict token.
          </p>
        </div>

        <button 
          type="button"
          onClick={onCancel}
          className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 transition cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Return to Ledger
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 divide-y lg:divide-y-0 lg:divide-x divide-slate-100 dark:divide-slate-800">
        
        {/* Left Side Panel: Read-only summary of what was requested */}
        <div className="p-6 bg-slate-50/30 dark:bg-slate-900/40 space-y-5 lg:col-span-1">
          <h4 className="text-xs font-bold text-slate-400 tracking-wide uppercase">Request Specifics</h4>
          
          <div className="space-y-4">
            <div className="flex gap-3 items-start">
              <User className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
              <div>
                <span className="block text-[10px] uppercase font-bold tracking-wider text-slate-400">Employee Name</span>
                <span className="text-sm font-semibold text-slate-800 dark:text-slate-200">{permissionData.employee_name || `Staff #${permissionData.user_id}`}</span>
              </div>
            </div>

            <div className="flex gap-3 items-start">
              <Calendar className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
              <div>
                <span className="block text-[10px] uppercase font-bold tracking-wider text-slate-400">Duration Metrics</span>
                <span className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                  {permissionData.start_date} to {permissionData.end_date}
                </span>
                <span className="inline-block mt-1 px-2 py-0.5 bg-slate-100 dark:bg-slate-800 rounded text-[11px] font-bold text-slate-600 dark:text-slate-400">
                  Total Span: {totalDays} {totalDays === 1 ? "Day" : "Days"}
                </span>
              </div>
            </div>

            <div className="flex gap-3 items-start">
              <FileText className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
              <div>
                <span className="block text-[10px] uppercase font-bold tracking-wider text-slate-400">Stated Reason</span>
                <p className="text-xs text-slate-600 dark:text-slate-400 bg-white dark:bg-slate-950 p-2.5 rounded-lg border border-slate-100 dark:border-slate-900 mt-1 italic leading-relaxed">
                  `{permissionData.reason}`
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side Panel: Form to process the decision */}
        <div className="p-6 lg:col-span-2">
          <FormProvider {...methods}>
            <form onSubmit={methods.handleSubmit(onSubmit)} className="space-y-6">
              
              {/* Radio Grid Action Blocks */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Select Status Verdict <span className="text-rose-500">*</span>
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  
                  {/* Approve Card Button */}
                  <button
                    type="button"
                    onClick={() => methods.setValue("status", "approved")}
                    className={cn(
                      "flex items-center gap-3 p-4 rounded-xl border text-left transition relative cursor-pointer outline-none",
                      currentStatus === "approved" 
                        ? "border-emerald-500 bg-emerald-50/20 dark:bg-emerald-950/10 ring-2 ring-emerald-500/20" 
                        : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300"
                    )}
                  >
                    <CheckCircle2 className={cn("w-5 h-5 shrink-0", currentStatus === "approved" ? "text-emerald-500" : "text-slate-400")} />
                    <div>
                      <span className="block text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wide">Approve Leave</span>
                      <span className="text-[11px] text-slate-500 mt-0.5 block">Flags request as active and recalculates calendar presence.</span>
                    </div>
                  </button>

                  {/* Reject Card Button */}
                  <button
                    type="button"
                    onClick={() => methods.setValue("status", "rejected")}
                    className={cn(
                      "flex items-center gap-3 p-4 rounded-xl border text-left transition relative cursor-pointer outline-none",
                      currentStatus === "rejected" 
                        ? "border-rose-500 bg-rose-50/20 dark:bg-rose-950/10 ring-2 ring-rose-500/20" 
                        : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300"
                    )}
                  >
                    <XCircle className={cn("w-5 h-5 shrink-0", currentStatus === "rejected" ? "text-rose-500" : "text-slate-400")} />
                    <div>
                      <span className="block text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wide">Reject Request</span>
                      <span className="text-[11px] text-slate-500 mt-0.5 block">Denies authorized absence blockages and logs feedback notes.</span>
                    </div>
                  </button>
                </div>
              </div>

              {/* Administrative Explanatory Notes */}
              <div className="flex flex-col space-y-2">
                <label htmlFor="review_notes" className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Decision Justification Notes / Remarks <span className="text-slate-400 font-normal">(Optional)</span>
                </label>
                <textarea
                  id="review_notes"
                  rows={4}
                  placeholder="State your reasons for approval limits or list specific details concerning the denial guidelines..."
                  {...methods.register("review_notes")}
                  className={cn(
                    "w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/50 focus-visible:border-blue-500 resize-y min-h-[100px]",
                    methods.formState.errors.review_notes && "border-rose-500 focus-visible:ring-rose-500/50"
                  )}
                />
                {methods.formState.errors.review_notes && (
                  <p className="text-xs text-rose-500 font-medium mt-1">{methods.formState.errors.review_notes.message}</p>
                )}
              </div>

              {/* Submission Button Strip Layout */}
              <div className="flex justify-end items-center gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                <Button variant="outline" type="button" onClick={onCancel}>
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={isSubmitting}
                  className={cn(
                    "px-6",
                    currentStatus === "approved" ? "bg-emerald-600 hover:bg-emerald-700 text-white" : "bg-rose-600 hover:bg-rose-700 text-white"
                  )}
                >
                  {isSubmitting ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : currentStatus === "approved" ? (
                    'Finalize Approval'
                  ) : (
                    'Record Rejection'
                  )}
                </Button>
              </div>

            </form>
          </FormProvider>
        </div>

      </div>
    </div>
  );
}
