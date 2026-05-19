
import { CURRENT_DATE_STRING } from '@/lib/utils';
import { ExceptionFormSchema, ExceptionFormValues } from '@/schema/exception.schema';
import { AttendanceException, Lookup } from '@/types'
import { zodResolver } from '@hookform/resolvers/zod';
import React, { useState } from 'react'
import { FormProvider, useForm } from 'react-hook-form';
import InputField from '../ui/InputField';
import { Button } from '../ui/button';
import { Loader2, X } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useUpsertException } from '@/hooks/useExceptions';

export default function ExceptionForm({
    isOpen,
    onClose,
    initialData,
}: {
    isOpen: boolean,
    onClose: () => void,
    initialData?: AttendanceException,
}) {
  const { user } = useAuth();
  const upsertExceptionMutation = useUpsertException();

  const [formData, setFormData] = useState<AttendanceException>({
    id: initialData?.id || null,
    title: initialData?.title || '',
    description: initialData?.description || '',
    created_by: initialData?.created_by || user?.id,
    start_date: initialData?.start_date || new Date().toISOString().split('T')[0],
    end_date: initialData?.end_date || new Date().toISOString().split('T')[0],
    exception_type: initialData?.exception_type || 'public_holiday'
  })

  const [isSubmitting, setIsSubmitting] = useState(false);



  // derive retroactive warning from start_date instead of updating state inside an effect
  const isPastWarning = formData.start_date ? formData.start_date < CURRENT_DATE_STRING : false;

  const methods = useForm<ExceptionFormValues>({
    resolver: zodResolver(ExceptionFormSchema),
    defaultValues: formData
  })

  const exceptionOptions = [
    { label: 'Public Holiday', value: 'public_holiday' },
    { label: 'Company Event', value: 'company_event' },
    { label: 'System Maintenance', value: 'system_maintenance' },
    { label: 'Emergency Closure', value: 'emergency_closure' },
    { label: 'Term Closure', value: 'term_closure' },
    { label: 'Other', value: 'other' },
  ]


  const onSubmit =async  (data: ExceptionFormValues) => {
    try {
      setIsSubmitting(true);
      await upsertExceptionMutation.mutateAsync({
        body: data
      })
    } catch (error) {
      console.error('Error submitting form:', error);
    }finally {
      setIsSubmitting(false);
      methods.reset();
      onClose();
    }
    
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end overflow-hidden">
        {/* Drawer backdrop animation overlay */}
      <div 
        className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm transition-opacity duration-300" 
        onClick={onClose}
      />

      {/* Drawer dynamic drawer canvas content */}
      <div className="relative w-full max-w-lg bg-white border-l border-slate-800 shadow-2xl flex flex-col h-full transform transition-transform duration-300 translate-x-0">
        <div className="flex items-center justify-between p-6 border-b border-slate-800">
          <div>
            <h3 className="text-lg font-semibold text-text">
              {initialData ? "Edit Exception" : "Add Exception Rule"}
            </h3>
            <p className="text-xs text-text/20 mt-1">
              {initialData ? "Modify this active corporate system override" : "Declare a new smart holiday or maintenance exclusion window"}
            </p>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-md cursor-pointer hover:bg-red-600 text-slate-400 hover:text-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
    <FormProvider {...methods} >
        <div className='mx-6 my-2'>
            <form onSubmit={methods.handleSubmit(onSubmit)} className='space-y-6'>
                <div className="grid grid-cols-1 gap-4 mb-8">
                    <InputField name='title' label='Exception Title' required/>
                    <InputField name='description' label='Description' />
                    <div className="flex items-center justify-between gap-2">
                      <InputField name='start_date' label='Start Date' type='date' required />
                      <InputField name='end_date' label='End Date' type='date' required />
                    </div>
                    <InputField name='exception_type' type='select'  options={exceptionOptions} label='Exception Type' required />
                </div>

                <div className="flex justify-end">
                  <Button variant='outline' onClick={onClose} className='mr-2'>
                    Cancel
                  </Button>
                  <Button type='submit' className='' disabled={isSubmitting}>
                    {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : initialData ? 'Update Exception' : 'Create Exception'}
                  </Button>
                </div>
            </form>
        </div>
    </FormProvider>
    </div>
    </div>
  )
}
