"use client";

import React, { useState, useMemo } from 'react'; // Added useMemo
import { FormProvider, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2, ArrowLeft, Check, ChevronsUpDown } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import InputField from '../ui/InputField';
import { Button } from '../ui/button';
import { PermissionFormSchema, PermissionFormValues } from '@/schema/permission.schema'; 
import { useUpsertPermission } from '@/hooks/usePermissions';
import { PermissionRowType, Lookup } from '@/types';
import { usePermissionTypes, useUsers } from '@/hooks/useLookups';
import { cn } from '@/lib/utils';

import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface PermissionFormProps {
  initialData?: PermissionRowType | null;
  onCancel?: () => void;      
}

export default function PermissionForm({
  initialData,
  onCancel
}: PermissionFormProps) {
  const { user } = useAuth();
  const upsertPermissionMutation = useUpsertPermission();
  
  const { data: users } = useUsers();
  const { data: permissionTypes } = usePermissionTypes();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [openUserSelect, setOpenUserSelect] = useState(false);

  // FIX 1: Memoize user options array translation to eliminate re-calculation overhead
  const userOptions = useMemo(() => {
    return users?.map((u: Lookup) => ({
      label: u.name,
      value: u.id.toString()
    })) || [];
  }, [users]);  

  // Memoize permission options array translation too for extra insurance
  const permissionOptions = useMemo(() => {
    return permissionTypes?.map((type) => ({
      label: type.name,
      value: type.id.toString(),
    })) || [];
  }, [permissionTypes]);

  const defaultFormValues: PermissionFormValues = {
    id: undefined,
    user_id: 0, 
    permission_type_id: 0,
    start_date: new Date().toISOString().split('T')[0],
    end_date: new Date().toISOString().split('T')[0],
    reason: "",
    initiatedby: user?.id ?? 0,
  };

  const methods = useForm<PermissionFormValues>({
    resolver: zodResolver(PermissionFormSchema),
    defaultValues: defaultFormValues,
  });

  const currentSelectedUserId = methods.watch("user_id");

  React.useEffect(() => {
    if (initialData) {
      methods.reset({
        id: initialData.id ?? undefined,
        user_id: initialData.user_id ?? 0,
        permission_type_id: initialData.permission_type_id || 0,
        start_date: initialData.start_date,
        end_date: initialData.end_date,
        reason: initialData.reason || "",
        initiatedby: initialData.initiatedby || user?.id || 0,
      });
    } else {
      methods.reset(defaultFormValues);
    }
  }, [initialData, methods]);

  const onSubmit = async (data: PermissionFormValues) => {
    const payload = {
      ...data,
      user_id: Number(data.user_id), 
      permission_type_id: Number(data.permission_type_id),
      ...(initialData?.id && { id: initialData.id }),
    };

    try {
      setIsSubmitting(true);
      await upsertPermissionMutation.mutateAsync({
        body: payload,
      });
      if (!initialData) methods.reset(defaultFormValues); 
      if (onCancel) onCancel();
    } catch (error) {
      console.error('An error occurred while running your flat-form submission pipeline:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden">
      
      <div className="p-6 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/20 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-sm font-extrabold text-slate-900 dark:text-slate-100 tracking-wider uppercase">
            {initialData ? "Modify Leave Permission Record" : "File New Leave Permission Request"}
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-normal">
            {initialData 
              ? `Adjusting active time parameters and administrative options for ${initialData.employee_name || 'Staff'}` 
              : "Register structured leaves, time blockages, out-of-station schedules, and justification payloads."
            }
          </p>
        </div>

        {onCancel && (
          <button 
            type="button"
            onClick={onCancel}
            className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 transition cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Return to Ledger
          </button>
        )}
      </div>

      <FormProvider {...methods}>
        <form onSubmit={methods.handleSubmit(onSubmit)} className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            
            {/* Searchable Combobox User Field Selection */}
            <div className="flex flex-col space-y-2">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Target Staff Member <span className="text-rose-500">*</span>
              </label>
              <Popover open={openUserSelect} onOpenChange={setOpenUserSelect}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={openUserSelect}
                    className={cn(
                      "w-full justify-between font-normal border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300",
                      methods.formState.errors.user_id && "border-rose-500 focus-visible:ring-rose-500/50"
                    )}
                  >
                    {currentSelectedUserId && currentSelectedUserId !== 0
                      ? userOptions.find((option) => option.value === currentSelectedUserId.toString())?.label
                      : "Search and select employee..."}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
                  <Command>
                    <CommandInput placeholder="Type worker name to filter list..." />
                    <CommandList>
                      <CommandEmpty>No matching staff profiles found.</CommandEmpty>
                      {/* FIX 2: Added max-height restriction and overflow styling to optimize long data structures */}
                      <CommandGroup className="max-h-[240px] overflow-y-auto">
                        {userOptions.map((option) => (
                          <CommandItem
                            key={option.value}
                            value={option.label}
                            onSelect={() => {
                              methods.setValue("user_id", Number(option.value), { shouldValidate: true });
                              setOpenUserSelect(false);
                            }}
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                currentSelectedUserId?.toString() === option.value ? "opacity-100" : "opacity-0"
                              )}
                            />
                            {option.label}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
              {methods.formState.errors.user_id && (
                <p className="text-xs text-rose-500 font-medium mt-1">
                  {methods.formState.errors.user_id.message}
                </p>
              )}
            </div>

            <InputField 
              name="permission_type_id" 
              type="select"  
              options={permissionOptions} 
              label="Requested Leave Context Category" 
              valueType={"number"}
              required 
            />

            <InputField name="start_date" label="Effective Start Date" type="date" required />
            <InputField name="end_date" label="Effective Term End Date" type="date" required />

            <div className="md:col-span-2 flex flex-col space-y-2">
              <label htmlFor="reason" className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Detailed Statement of Reason / Justification <span className="text-rose-500">*</span>
              </label>
  
              <textarea
                id="reason"
                rows={4}
                placeholder="State the absolute grounds for this absence period or attach specific field instructions..."
                {...methods.register("reason")}
                className={cn(
                  "w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/50 focus-visible:border-blue-500 disabled:cursor-not-allowed disabled:opacity-50 resize-y min-h-[100px]",
                  methods.formState.errors.reason && "border-rose-500 focus-visible:ring-rose-500/50 focus-visible:border-rose-500"
                )}
              />

              {methods.formState.errors.reason && (
                <p className="text-xs text-rose-500 font-medium mt-1">
                  {methods.formState.errors.reason.message}
                </p>
              )}
            </div>

          </div>

          <div className="flex justify-end items-center gap-3 pt-5 border-t border-slate-100 dark:border-slate-800">
            {onCancel && (
              <Button variant="outline" type="button" onClick={onCancel}>
                Cancel
              </Button>
            )}
            <Button type="submit" className="px-6" disabled={isSubmitting}>
              {isSubmitting ? (
                <Loader2 size={16} className="animate-spin" />
              ) : initialData ? (
                'Save Changes'
              ) : (
                'Submit Registry Request'
              )}
            </Button>
          </div>
        </form>
      </FormProvider>
    </div>
  );
}
