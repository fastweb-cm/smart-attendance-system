"use client";

import React, { useEffect } from 'react';
import { FormProvider, useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { employeeCreateForm, createEmployeeFormValues } from '@/schema/user.schema';
import InputField from '../ui/InputField';
import { Button } from '../ui/button';
import { toast } from 'react-toastify';
import { ShieldCheck, GraduationCap, Users, Key, Database, Fingerprint, RefreshCw } from 'lucide-react';
import { Lookup, LookupClass } from '@/types';
import { useCreateUser } from '@/hooks/useUsers'; // Assuming useUpdateUser is imported here
import { useClasses, useEmployee, useEmployeeRoles } from '@/hooks/useLookups';

interface employeeFormProps {
    employeeId?: number; // Optional for edit mode
    userType?: createEmployeeFormValues['user_type']; // 'student' or 'staff'
}

export default function EmployeeForm({
    employeeId,
    userType
}: employeeFormProps) {
    const editMode = !!employeeId;
    const createEmployeeMut = useCreateUser();
    const updateEmployeeMut = {}; // Fallback update mutation hook target

    // get the classes and roles from the server lookup action
    const { data: classes } = useClasses();
    const { data: roles } = useEmployeeRoles();
    const { data: employee, isLoading: employeeLoading } = useEmployee(employeeId);

    const classOptions = classes?.map((c: LookupClass) => ({ label: c.class_name, value: c.id })) || [];
    const roleOptions = roles?.map((r: Lookup) => ({ label: r.name, value: r.id })) || [];

    const defaultValues: createEmployeeFormValues =
    userType === "student"
        ? {
            user_type: "student",
            fname: "",
            lname: "",
            gender: "male",
            class_id: 0,
            username: "",
            password: "",
            email: null,
        }
        : {
            user_type: "staff",
            fname: "",
            lname: "",
            gender: "male",
            email: "",
            role_id: 0,
            username: "",
            password: "",
        };

    // initialize validation default dynamically based on user type
    const methods = useForm<createEmployeeFormValues>({
        resolver: zodResolver(employeeCreateForm),
        defaultValues
    })

    useEffect(() => {
        if (!employee) return;

        if (employee.user_type === "student") {
            methods.reset({
                id: employee.id,
                user_type: "student",
                fname: employee.fname,
                lname: employee.lname,
                gender: employee.gender ?? "male",
                email: employee.email ?? null,
                class_id: employee.class_id!,
                username: employee.username ?? "",
                status:
                employee.status === "active" ||
                employee.status === "inactive" ||
                employee.status === "dismissed"
                    ? employee.status
                    : "active",
                biometric_enrollment_status:
                    employee.biometric_enrollment_status ?? "pending",
                regno: employee.regno ?? "",
            });
        }

        if (employee.user_type === "staff") {
            methods.reset({
                id: employee.id,
                user_type: "staff",
                fname: employee.fname,
                lname: employee.lname,
                gender: employee.gender ?? "male",
                email: employee.email ?? undefined,
                role_id: employee.role_id!,
                username: employee.username ?? "",
                status:
                employee.status === "active" ||
                employee.status === "inactive" ||
                employee.status === "dismissed"
                    ? employee.status
                    : "active",
                biometric_enrollment_status:
                    employee.biometric_enrollment_status ?? "pending",
                regno: employee.regno ?? "",
            });
        }
    }, [employee, methods]);

    const currentType = useWatch({ control: methods.control, name: "user_type" });

    // Reactively patch and reset data when new edit mode employee data is loaded
    useEffect(() => {
        if (editMode) return

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
            });
        } else if (currentType === "staff") {
            methods.reset({
                ...commonFields,
                user_type: "staff",
            });
        }
    }, [currentType]);

    const onSubmit = async (data: createEmployeeFormValues) => {
        // Sanitize optional fields so empty UI states map cleanly to backend structures
        const payload = {
            ...data,
            email: data.email && data.email.trim() !== "" ? data.email : null,
            username: data.username && data.username.trim() !== "" ? data.username : undefined,
            password: data.password && data.password.trim() !== "" ? data.password : undefined,
        };
        
        try {
            if (editMode) {
                // await updateEmployeeMut.mutateAsync({ id: employeeId!, body: payload });
                // toast.success("Identity metadata configuration updated successfully.");
            } else {
                console.log("payload:", payload)
                await createEmployeeMut.mutateAsync({ body: payload });
                methods.reset(defaultValues);
            }
        } catch (error) {
            toast.error(
                error instanceof Error
                ? error.message
                : 'An unexpected error occurred'
            );
        }
    }

    if (editMode && employeeLoading) {
        return (
            <div className="h-48 w-full flex items-center justify-center font-mono text-xs text-slate-400 gap-2">
                <Database className="w-4 h-4 animate-spin text-indigo-500" />
                Querying multi-tenant cloud storage for ID record #{employeeId}...
            </div>
        );
    }

    return (
    <FormProvider {...methods}>
    <div className="rounded-2xl bg-white border border-slate-200 shadow-sm p-6 mt-6 animate-in fade-in duration-200">
        
        {/* 1. Header Layout - Clean & Human-Friendly */}
        <div className="border-b border-slate-100 pb-4 mb-6 flex items-center justify-between">
            <div>
                <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
                    {userType === "student" ? (
                        <GraduationCap className={`w-5 h-5 ${editMode ? "text-amber-500" : "text-blue-600"}`} />
                    ) : (
                        <Users className={`w-5 h-5 ${editMode ? "text-amber-500" : "text-emerald-600"}`} />
                    )}
                    {editMode ? `Edit ${userType === "student" ? "Student" : "Staff"} Profile` : `Onboard New ${userType === "student" ? "Student" : "Staff Member"}`}
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                    {editMode 
                        ? `Modify account details and tracking settings for ID: #${employeeId}` 
                        : `Fill in the details below to create a new ${userType} profile in the system.`
                    }
                </p>
            </div>
        </div>

        <form onSubmit={methods.handleSubmit(onSubmit)} className='space-y-6'>
            
            {/* 2. Primary Information Section */}
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

            {/* 3. Institutional Assignments (Classes / Roles) */}
            <div className="pt-2">
                <h3 className="text-xs font-semibold tracking-wider text-slate-400 uppercase mb-3 flex items-center gap-1.5">
                    {userType === "student" ? <GraduationCap className="w-3.5 h-3.5" /> : <Users className="w-3.5 h-3.5" />} 
                    Institutional Assignment
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {userType === 'student' ? (
                        <>
                            <InputField 
                                name='regno' 
                                label='Student Matricule / ID' 
                                inputProps={{ readOnly: true, placeholder: editMode ? undefined : 'Auto-generated on save' }}
                            />
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
                            <InputField 
                                name='regno' 
                                label='Staff ID Code' 
                                inputProps={{ readOnly: true, placeholder: editMode ? undefined : 'Auto-generated on save' }}
                            />
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
                        // required={!editMode} 
                    />
                </div>
            </div>

            {/* 5. System Statuses & Gender */}
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

            {/* 6. Form Submission Controls */}
            <div className="flex justify-end pt-4 border-t border-slate-100">
                <Button 
                    className={`h-11 px-6 font-semibold tracking-wide text-xs shadow-sm transition-all rounded-xl ${
                        editMode 
                            ? 'bg-amber-500 hover:bg-amber-600 text-white' 
                            : userType === 'staff' 
                                ? 'bg-emerald-600 hover:bg-emerald-700 text-white' 
                                : 'bg-blue-600 hover:bg-blue-700 text-white'
                    }`} 
                    type="submit" 
                    disabled={createEmployeeMut.isPending || (editMode && (updateEmployeeMut as any)?.isPending)}
                >
                    {createEmployeeMut.isPending || (editMode && (updateEmployeeMut as any)?.isPending) ? (
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
