"use client";

import React, { useEffect } from "react";
import { useFormContext } from "react-hook-form";
import { GroupCreateFormValues } from "@/schema/group.schema";
import InputField from "../../ui/InputField";
import { useBranchesLookup, useGroupTypesLookup } from "@/hooks/useLookups";
import { Button } from "../../ui/button";
import { ChevronRight } from "lucide-react";

interface Step1Props {
  onNext: () => void;
}

export const Step1Group: React.FC<Step1Props> = ({ onNext }) => {
  const { trigger, getValues, setValue, formState: { errors } } = useFormContext<GroupCreateFormValues>();

  const { data: branches, isLoading: isLoadingBranches } = useBranchesLookup();
  const { data: groupTypes, isLoading: isLoadingGroupTypes } = useGroupTypesLookup();

  const branchOptions =
    (branches as Array<{ id: number; name: string }>)
      ?.filter((b) => b?.id !== undefined && b?.name !== undefined)
      .map((b) => ({
        label: b.name,
        value: b.id,
      })) || [];

  const groupTypeOptions =
    (groupTypes as Array<{ id: number; name: string; abbr?: string }>)
      ?.filter((gt) => gt?.id !== undefined && gt?.name !== undefined)
      .map((gt) => ({
        label: gt.abbr ? `${gt.name} (${gt.abbr})` : gt.name,
        value: gt.id,
      })) || [];

  // FIX: Force React Hook Form to re-assign current values into select fields once options are available
  useEffect(() => {
    if (!isLoadingBranches && branchOptions.length > 0) {
      const currentBranch = getValues("groupDetails.branch_id");
      if (currentBranch) {
        setValue("groupDetails.branch_id", currentBranch, { shouldValidate: true });
      }
    }
  }, [isLoadingBranches, branchOptions.length, getValues, setValue]);

  useEffect(() => {
    if (!isLoadingGroupTypes && groupTypeOptions.length > 0) {
      const currentGroupType = getValues("groupDetails.grouptype_id");
      if (currentGroupType) {
        setValue("groupDetails.grouptype_id", currentGroupType, { shouldValidate: true });
      }
    }
  }, [isLoadingGroupTypes, groupTypeOptions.length, getValues, setValue]);

  const handleNext = async () => {
    const valid = await trigger([
      "groupDetails.name",
      "groupDetails.branch_id",
      "groupDetails.grouptype_id",
      "groupDetails.expected_weekly_hours",
      "groupDetails.absence_threshold",
    ]);

    if (valid) {
      onNext();
    } else {
      console.log("Step 1 validation errors:", errors);
    }
  };

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-gray-900">Group Metadata</h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <InputField
          label="Group Name"
          name="groupDetails.name"
          inputProps={{ placeholder: "e.g. Morning Shift Alpha" }}
          required
        />

        <InputField
          label="Branch"
          name="groupDetails.branch_id"
          type="select"
          valueType="number"
          options={branchOptions}
          disabled={isLoadingBranches}
          required
        />

        <InputField
          label="Group Type"
          name="groupDetails.grouptype_id"
          type="select"
          valueType="number"
          options={groupTypeOptions}
          disabled={isLoadingGroupTypes}
          required
        />

        <InputField
          label="Expected Weekly Hours"
          name="groupDetails.expected_weekly_hours"
          type="number"
          valueType="number"
          required
        />

        <InputField
          label="Absence Threshold (Days)"
          name="groupDetails.absence_threshold"
          type="number"
          valueType="number"
          required
        />
      </div>

      <div className="flex justify-end pt-4 border-t">
        <Button
          type="button"
          variant="outline"
          className="flex items-center gap-2"
          onClick={handleNext}
        >
          Next <ChevronRight size={18} />
        </Button>
      </div>
    </div>
  );
};
