"use client";

import React, { useState } from "react";
import { useFormContext } from "react-hook-form";
import { GroupCreateFormValues } from "@/schema/group.schema";
import { Button } from "../../ui/button";
import { ArrowLeft, CheckCircle2, Loader2, Search } from "lucide-react";
import { useUsersLookup } from "@/hooks/useLookups";

interface Step3Props {
  onBack: () => void;
  isSubmitting?: boolean;
}

export const Step3Supervisors: React.FC<Step3Props> = ({
  onBack,
  isSubmitting: isSubmittingProp,
}) => {
  const {
    watch,
    setValue,
    formState: { isSubmitting: isFormSubmitting },
  } = useFormContext<GroupCreateFormValues>();

  const isSubmitting = isSubmittingProp ?? isFormSubmitting;
  const isEditingMode = !!watch("groupDetails.id");
  const selectedSupervisors = watch("supervisor_ids") || [];

  const [search, setSearch] = useState("");

  const { data: staffList, isLoading } = useUsersLookup({
    search: search || undefined,
    user_type: "staff",
    limit: 50,
  });

  const handleToggleSupervisor = (userId: number) => {
    const set = new Set(selectedSupervisors);
    if (set.has(userId)) set.delete(userId);
    else set.add(userId);
    setValue("supervisor_ids", Array.from(set));
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900">
          Assign Supervisors & Finalize
        </h3>
        <p className="text-xs text-gray-500">
          Select staff members responsible for overseeing attendance for this group.
        </p>
      </div>

      <div className="relative max-w-md">
        <Search size={16} className="absolute left-2.5 top-2.5 text-gray-400" />
        <input
          type="text"
          placeholder="Filter staff by name..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-8 pr-3 py-1.5 text-sm rounded-md border border-gray-300 focus:outline-none"
        />
      </div>

      <div className="max-h-56 overflow-y-auto border border-gray-200 rounded-lg p-2 space-y-1">
        {isLoading ? (
          <p className="p-3 text-xs text-center text-gray-500">
            Loading staff members...
          </p>
        ) : staffList?.length === 0 ? (
          <p className="p-3 text-xs text-center text-gray-500">
            No staff members found.
          </p>
        ) : (
          staffList?.map((staff) => {
            if (staff.id === undefined) return null; // Safe guard for optional OpenAPI ID

            const staffId = staff.id;
            const isChecked = selectedSupervisors.includes(staffId);

            return (
              <label
                key={staffId}
                className={`flex items-center justify-between p-2.5 rounded-md cursor-pointer border ${
                  isChecked
                    ? "border-emerald-500 bg-emerald-50/50 text-emerald-900"
                    : "border-gray-100 hover:bg-gray-50"
                }`}
              >
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => handleToggleSupervisor(staffId)}
                  />
                  <span className="text-sm font-medium">
                    {staff.fname} {staff.lname}
                  </span>
                </div>
              </label>
            );
          })
        )}
      </div>

      <div className="flex justify-between items-center pt-4 border-t">
        <Button
          type="button"
          variant="outline"
          className="flex items-center gap-2"
          onClick={onBack}
          disabled={isSubmitting}
        >
          <ArrowLeft size={16} /> Back
        </Button>

        <Button
          type="submit"
          className="bg-primary hover:bg-primary/90 text-white flex items-center gap-2 px-5"
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <Loader2 size={16} className="animate-spin" />
          ) : (
            <CheckCircle2 size={16} />
          )}
          {isEditingMode ? "Update Group" : "Create Group"}
        </Button>
      </div>
    </div>
  );
};
