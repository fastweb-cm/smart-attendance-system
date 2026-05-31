"use client";

import React, { useEffect } from 'react';
import { FormProvider, useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { employeeCreateForm, createEmployeeFormValues } from '@/schema/user.schema';
import InputField from '../ui/InputField';
import { Button } from '../ui/button';
import { toast } from 'react-toastify';
import { GraduationCap, Users, Key, Database, RefreshCw } from 'lucide-react';
import { Lookup, LookupClass } from '@/types';
import { useCreateUser, useUpdateEmployee } from '@/hooks/useUsers'; 
import { useClasses, useEmployeeRoles } from '@/hooks/useLookups';
import { UserResponse } from '@/client';

interface employeeFormProps {
    initialData?: UserResponse | undefined;
    fallbackUserType?: "student" | "staff"; 
}

export default function EmployeeForm({
    initialData,
    fallbackUserType = "student"
}: employeeFormProps) {
    const editMode = !!initialData?.id;
    const employeeId = initialData?.id;
    
    // Resolve userType instantly from initial data or creation prop context
    const userType = initialData?.user_type === "staff" || fallbackUserType === "staff" ? "staff" : "student";

    const createEmployeeMut = useCreateUser();
    const updateEmployeeMut = useUpdateEmployee();

    // Server list lookup lookups
    const { data: classes } = useClasses();
    const { data: roles } = useEmployeeRoles();

    const classOptions = classes?.map((c: LookupClass) => ({ label: c.class_name, value: c.id })) || [];
    const roleOptions = roles?.map((r: Lookup) => ({ label: r.name, value: r.id })) || [];

    // Clean initial form state definition
    const defaultValues: createEmployeeFormValues = {
        user_type: userType,
        fname: initialData?.fname ?? "",
        lname: initialData?.lname ?? "",
        gender: (initialData?.gender === "female" ? "female" : "male"),
        email: initialData?.email ?? "",
        username: initialData?.username ?? "",
        password: "", // Always default passwords empty for compliance
        regno: initialData?.regno ?? "",
        status: initialData?.status === "inactive" || initialData?.status === "dismissed" ? initialData.status : "active",
        biometric_enrollment_status: initialData?.biometric_enrollment_status === "completed" ? "completed" : "pending",
        ...(userType === "student" 
            ? { class_id: initialData?.class_id ?? 0 } 
            : { role_id: initialData?.role_id ?? 0 }
        )
    } as createEmployeeFormValues;

    const methods = useForm<createEmployeeFormValues>({
        resolver: zodResolver(employeeCreateForm),
        defaultValues
    });

    // Reset the form state explicitly whenever initialData updates or changes
    useEffect(() => {
        methods.reset(defaultValues);
    }, [initialData, methods]);

    const currentType = useWatch({ control: methods.control, name: "user_type" });

    // Handle type updates if dynamic creation parameters shift fields
    useEffect(() => {
        if (editMode) return;

        const commonFields = {
            id: employeeId,
            fname: methods.getValues("fname"),
            lname: methods.getValues("lname"),
            gender: methods.getValues("gender"),
            status: methods.getValues("status"),
            biometric_enrollment_status: methods.getValues("biometric_enrollment_status"),
        };

        if (currentType === "student") {
            methods.reset({
                ...commonFields,
                user_type: "student",
                class_id: 0,
                email: "",
            });
        } else if (currentType === "staff") {
            methods.reset({
                ...commonFields,
                user_type: "staff",
                role_id: 0,
                email: "",
            });
        }
    }, [currentType, editMode]);

    const onSubmit = async (data: createEmployeeFormValues) => {
        // Sanitize strings cleanly for PHP database operations
        const payload = {
            ...data,
            email: data.email && data.email.trim() !== "" ? data.email.trim() : null,
            username: data.username && data.username.trim() !== "" ? data.username.trim() : undefined,
            password: data.password && data.password.trim() !== "" ? data.password : undefined,
        };
        
        try {
            if (editMode) {
                await updateEmployeeMut.mutateAsync({ path: { id: employeeId! }, body: payload });

            } else {
                await createEmployeeMut.mutateAsync({ body: payload });
                methods.reset();
            }
        } catch (error) {
            toast.error(
                error instanceof Error ? error.message : 'An unexpected error occurred'
            );
        }
    }

    const isPendingSave = createEmployeeMut.isPending || updateEmployeeMut.isPending;

    return (
        <FormProvider {...methods}>
            <div className="rounded-2xl bg-white border border-slate-200 shadow-sm p-6 mt-6 animate-in fade-in duration-200">
                
                {/* 1. Dynamic Human-Friendly Header Row */}
                <div className="border-b border-slate-100 pb-4 mb-6 flex items-center justify-between">
                    <div>
                        <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
                            {userType === "student" ? (
                                <GraduationCap className={`w-5 h-5 ${editMode ? "text-amber-500" : "text-blue-600"}`} />
                            ) : (
                                <Users className={`w-5 h-5 ${editMode ? "text-amber-500" : "text-emerald-600"}`} />
                            )}
                            {editMode ? `Edit ${userType === "student" ? "Student" : "Employee"} Profile` : `Onboard New ${userType === "student" ? "Student" : "Staff Member"}`}
                        </h2>
                        <p className="text-xs text-slate-500 mt-0.5">
                            {editMode 
                                ? `Modify account details for: ${initialData?.name ?? ''}` 
                                : `Fill in the details below to create a new ${userType} profile in the system.`
                            }
                        </p>
                    </div>
                </div>

                <form onSubmit={methods.handleSubmit(onSubmit)} className='space-y-6'>
                    
                    {/* 2. Personal Core Information Section */}
                    <div>
                        <h3 className="text-xs font-semibold tracking-wider text-slate-400 uppercase mb-3 flex items-center gap-1.5">
                            <Database className="w-3.5 h-3.5" /> Personal Details
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            <InputField name='fname' label='First Name' required />
                            <InputField name='lname' label='Last Name' required />
                            <InputField name='email' label={userType === "staff" ? 'Email Address' : 'Email Address (Optional)'} required={userType === "staff"} />
                        </div>
                    </div>

                    {/* 3. Operational Institutional Assignments (Classes / Roles) */}
                    <div className="pt-2">
                        <h3 className="text-xs font-semibold tracking-wider text-slate-400 uppercase mb-3 flex items-center gap-1.5">
                            {userType === "student" ? <GraduationCap className="w-3.5 h-3.5" /> : <Users className="w-3.5 h-3.5" />} 
                            Institutional Assignment
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {userType === 'student' ? (
                                <>
                                    <div title='Auto-Generated & Readonly' className="pointer-events-none opacity-85">
                                    <InputField 
                                        name='regno' 
                                        label='Student Matricule / ID' 
                                        inputProps={{ readOnly: true, placeholder: editMode ? undefined : 'Auto-generated on save' }}
                                    />
                                    </div>
                                    <InputField 
                                        name='class_id' 
                                        type='select' 
                                        required 
                                        label='Assigned Class' 
                                        options={classOptions} 
                                        valueType="number"
                                    />
                                </>
                            ) : (
                                <>
                                    <div title='Auto-Generated & Readonly' className="pointer-events-none opacity-85">
                                    <InputField 
                                        name='regno' 
                                        label='Staff ID Code' 
                                        inputProps={{ readOnly: true, placeholder: editMode ? undefined : 'Auto-generated on save' }}
                                    />
                                    </div>
                                    <InputField 
                                        name='role_id' 
                                        type='select' 
                                        required 
                                        label='Staff Role / Designation' 
                                        options={roleOptions} 
                                        valueType="number"
                                    />
                                </>
                            )}
                        </div>
                    </div>

                    {/* 4. Credentials Security Group */}
                    <div className="pt-2">
                        <h3 className="text-xs font-semibold tracking-wider text-slate-400 uppercase mb-3 flex items-center gap-1.5">
                            <Key className="w-3.5 h-3.5" /> System Login Credentials
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            <InputField name='username' label='Username' />
                            <InputField 
                                name='password' 
                                type='password' 
                                label={editMode ? 'Change Password (Leave blank to keep current)' : 'Account Password'} 
                            />
                        </div>
                    </div>

                    {/* 5. System Statuses & Gender Radio Arrays */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-slate-100">
                        <InputField 
                            required 
                            name='gender' 
                            type='radio' 
                            label='Gender' 
                            options={[
                                { label: "Male", value: "male" }, 
                                { label: "Female", value: "female" }
                            ]} 
                        />

                        {editMode && (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 animate-in slide-in-from-top-2 duration-150">
                                <InputField 
                                    name='status' 
                                    type='select' 
                                    label='Account Status' 
                                    options={[
                                        { label: "Active", value: "active" },
                                        { label: "Inactive", value: "inactive" },
                                        { label: "Dismissed", value: "dismissed" }
                                    ]}
                                />
                                <div className="pointer-events-none opacity-85">
                                    <InputField 
                                        name='biometric_enrollment_status' 
                                        type='select' 
                                        label='Biometric Status' 
                                        options={[
                                            { label: "Pending Setup", value: "pending" },
                                            { label: "Enrolled / Verified", value: "completed" }
                                        ]}
                                    />
                                </div>
                            </div>
                        )}
                    </div>

                    {/* 6. Action Execution Controls Buttons */}
                    <div className="flex justify-end pt-4 border-t border-slate-100">
                        <Button 
                            className={`h-11 px-6 font-semibold tracking-wide text-xs shadow-sm transition-all rounded-xl cursor-pointer ${
                                editMode 
                                    ? 'bg-amber-500 hover:bg-amber-600 text-white' 
                                    : userType === 'staff' 
                                        ? 'bg-emerald-600 hover:bg-emerald-700 text-white' 
                                        : 'bg-blue-600 hover:bg-blue-700 text-white'
                            }`} 
                            type="submit" 
                            disabled={isPendingSave}
                        >
                            {isPendingSave ? (
                                <span className="flex items-center gap-2">
                                    <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Saving records...
                                </span>
                            ) : editMode ? (
                                "Save Changes"
                            ) : (
                                `Register ${userType === 'staff' ? 'Staff Member' : 'Student'}`
                            )}
                        </Button>
                    </div>

                </form>
            </div>
        </FormProvider>
    )
}
