"use client";

import { useFormContext, useFieldArray } from "react-hook-form";
import { TerminalCreateFormValues } from "@/schema/terminal.schema";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "../ui/button";
import { ArrowLeft, CheckCircle2 } from "lucide-react";
import { GroupWithSubgroupsLookup, Lookup } from "@/types";
import { useAuthPolicies } from "@/hooks/useLookups";

interface Step2Props {
  onBack: () => void;
  initialAuthTypes: Lookup[];
  initialAuthPolicies: GroupWithSubgroupsLookup[];
}

export const Step2Access: React.FC<Step2Props> = ({ onBack, initialAuthTypes, initialAuthPolicies }) => {
  const { control, watch } = useFormContext<TerminalCreateFormValues>();

  const { append, remove } = useFieldArray({
    control,
    name: "authPolicies",
  });

  // Watch properties using exact backend snake_case properties
  const chosenCapabilities = watch("authCapabilities") || [];
  const policies = watch("authPolicies") || [];

  // Map chosen capabilities back to dynamic lookup human labels
  const allowedAuthOptions = chosenCapabilities.map((cap: { auth_type_id: number }) => {
    const matchedLookup = initialAuthTypes.find((t) => t.id === cap.auth_type_id);
    return {
      id: cap.auth_type_id,
      label: matchedLookup ? matchedLookup.name : `Auth Type #${cap.auth_type_id}`,
    };
  });

  const { data: groups } = useAuthPolicies(initialAuthPolicies);

  // Helper to safely identify if a specific target assignment entry already exists
  const isPolicyChecked = (groupId: number, subgroupId: number | null, authTypeId: number) => {
    return policies.some(
      (p: { group_id?: number | null; subgroup_id?: number | null; auth_type_id?: number }) =>
        p.group_id === groupId && p.subgroup_id === subgroupId && p.auth_type_id === authTypeId
    );
  };

  // Toggle function that creates independent array objects for every capability chosen
  const handleTogglePolicy = (groupId: number, subgroupId: number | null, authTypeId: number) => {
    const policyIndex = policies.findIndex(
      (p: { group_id?: number | null; subgroup_id?: number | null; auth_type_id?: number }) => p.group_id === groupId && p.subgroup_id === subgroupId && p.auth_type_id === authTypeId
    );

    if (policyIndex !== -1) {
      remove(policyIndex);
    } else {
      append({
        group_id: groupId,
        subgroup_id: subgroupId, // Can be number or explicitly null
        auth_type_id: authTypeId,
      });
    }
  };

  // Shared UI row rendering block for clean presentation
  const renderRow = (groupId: number, subgroupId: number | null, title: string, isSubgroup = false) => {
    return (
      <div 
        className={`flex flex-col sm:flex-row sm:items-center justify-between p-3 border rounded-xl gap-3 transition-all ${
          isSubgroup ? "border-gray-100 bg-white" : "border-gray-200 bg-gray-50/50 font-medium"
        }`}
      >
        <span className={`text-sm ${isSubgroup ? "text-gray-600 pl-2" : "text-gray-900 font-semibold"}`}>
          {title} {!isSubgroup && <span className="text-xs text-gray-400 font-normal">(Entire Group)</span>}
        </span>

        {/* Dynamic selector nodes matching allowed capabilities from Step 1 */}
        <div className="flex flex-wrap items-center gap-3">
          {allowedAuthOptions.map((auth) => {
            const checked = isPolicyChecked(groupId, subgroupId, auth.id);
            const inputId = `policy-${groupId}-${subgroupId ?? "parent"}-${auth.id}`;

            return (
              <div 
                key={auth.id} 
                className={`flex items-center gap-2 px-3 py-1.5 border rounded-lg transition-all ${
                  checked 
                    ? "border-emerald-300 bg-emerald-50 text-emerald-900" 
                    : "border-gray-200 bg-white text-gray-500 hover:bg-gray-50"
                }`}
              >
                <Checkbox
                  id={inputId}
                  checked={checked}
                  onCheckedChange={() => handleTogglePolicy(groupId, subgroupId, auth.id)}
                />
                <label htmlFor={inputId} className="text-xs font-medium cursor-pointer select-none">
                  {auth.label}
                </label>
              </div>
            );
          })}
          {allowedAuthOptions.length === 0 && (
            <span className="text-xs text-amber-600 font-medium bg-amber-50 px-2 py-1 rounded">
              No modes chosen in Step 1
            </span>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900">Access Policies</h3>
        <p className="text-xs text-gray-500">
          Select which authentication modes apply at the broad group or specific subgroup levels.
        </p>
      </div>

      <div className="space-y-4">
        {groups.map((group) => (
          <div key={group.id} className="border border-gray-200 rounded-xl p-4 bg-gray-50/20 space-y-3">
            
            {/* 1. Parent Scope configuration row (Generates subgroup_id: null payload) */}
            {renderRow(group.id, null, group.label, false)}

            {/* 2. Individual Subgroup configuration rows nested inside */}
            {group.subgroups.length > 0 && (
              <div className="grid grid-cols-1 gap-2 pl-4 border-l-2 border-gray-100">
                {group.subgroups.map((sg) => 
                  renderRow(group.id, sg.id, sg.label, true)
                )}
              </div>
            )}

          </div>
        ))}
      </div>

      {/* Footer Navigation Controls */}
      <div className="flex justify-between items-center border-t pt-4 mt-6">
        <Button
          type="button"
          variant="outline"
          className="flex items-center gap-2"
          onClick={onBack}
        >
          <ArrowLeft size={16} /> Back
        </Button>

        <Button
          type="submit"
          
        >
          <CheckCircle2 size={16} /> Create Terminal
        </Button>
      </div>
    </div>
  );
};
