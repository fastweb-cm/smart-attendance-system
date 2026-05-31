"use client";

import { useFormContext, useFieldArray } from "react-hook-form";
import { TerminalCreateFormValues } from "@/schema/terminal.schema";
import InputField from "../ui/InputField";
import { Lookup, LookupBranch } from "@/types";
import { useBranches } from "@/hooks/useLookups";
import { Button } from "../ui/button";
import { ChevronRight, ShieldCheck } from "lucide-react";

interface Step1Props {
  onNext: () => void;
  initialBranches: LookupBranch[];
  initialAuthTypes: Lookup[];
}

export const Step1Terminal: React.FC<Step1Props> = ({ onNext, initialBranches, initialAuthTypes }) => {
  const { control, watch, trigger, setValue } = useFormContext<TerminalCreateFormValues>();
  
  // Use useFieldArray directly to control the array fields cleanly
  const { fields, append, remove } = useFieldArray({
    control,
    name: "authCapabilities",
  });

  const { data: branches } = useBranches(); // fetch imidiately with no initial data
  
  const branchOptions = branches?.map((b: LookupBranch) => ({
    label: b.name,
    value: b.id
  })) || [];

  const statuses = [
    { label: "Pending", value: "pending" },
    { label: "Active", value: "active" },
    { label: "Revoked", value: "revoked" }
  ]

  const handleNext = async () => {
    const valid = await trigger([
      "terminalDetails.name",
      "terminalDetails.activation_code",
      "terminalDetails.branch_id",
      "authCapabilities",
    ]);

    if (valid) onNext();
  };

  // Determine if we are in edit mode based on the presence of a terminal ID
  const isEditMode = !!watch("terminalDetails.id");

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold">Terminal Profile</h3>

      {/* Profile Details Inputs */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <InputField label="Terminal Name" name="terminalDetails.name" required/>

        { !isEditMode &&
          <>
            <InputField 
              label="Activation Code" 
              name="terminalDetails.activation_code" 
              required 
              inputProps={{ placeholder: "Auto-Generated", readOnly: true }}
            />
          </>
        }

        <InputField 
          label="Branch" 
          name="terminalDetails.branch_id"
          type="select"
          valueType="number"
          options={branchOptions}
          required
        />

        {isEditMode && (
          <>
            <InputField
            label="Status"
            name="terminalDetails.status"
            type="select"
            valueType="string"
            options={statuses}
            required
            />
          </>
        )}
      </div>

      {/* Authentication Capabilities Sequence Selector */}
      <div className="space-y-3">
        <div>
          <p className="text-sm font-medium text-gray-700">
            Authentication Modes & Sequence <span className="text-red-500">*</span>
          </p>
          <span className="text-xs text-gray-400">
            Checking items sets up their execution sequence order (Step 1, Step 2, etc.)
          </span>
        </div>

        <div className="flex flex-col gap-3 max-w-md">
          {initialAuthTypes.map((opt) => {
            // Find if this auth type is already active in the fields array
            const currentIdx = fields.findIndex((f) => f.auth_type_id === opt.id);
            const isChecked = currentIdx !== -1;

            return (
              <label 
                key={opt.id} 
                className={`flex items-center justify-between p-3 border rounded-lg cursor-pointer transition-all ${
                  isChecked ? "border-blue-500 bg-blue-50/50" : "border-gray-200 hover:bg-gray-50"
                }`}
              >
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    className="h-4 w-4 rounded text-blue-600 focus:ring-blue-500"
                    checked={isChecked}
                    onChange={() => {
                      if (!isChecked) {
                        // Append with next step index automatically
                        append({ auth_type_id: opt.id, auth_step: fields.length + 1 });
                      } else {
                        // Remove the item
                        remove(currentIdx);
                        
                        // Re-calculate all subsequent auth_step values to avoid breaks
                        const currentFields = (control._getFieldArray("authCapabilities") || []) as Array<{ auth_type_id: number; auth_step: number }>;
                        const updatedFields = currentFields
                          .filter((f) => f.auth_type_id !== opt.id)
                          .map((f, idx) => ({
                            ...f,
                            auth_step: idx + 1 // continuous sequence reassignment
                          }));
                        
                        setValue("authCapabilities", updatedFields);
                      }
                    }}
                  />
                  <span className="text-sm font-medium text-gray-900">{opt.name}</span>
                </div>

                {/* Show Step UI badge to user cleanly */}
                {isChecked && (
                  <span className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-blue-100 text-blue-800">
                    <ShieldCheck size={14} /> Step {currentIdx + 1}
                  </span>
                )}
              </label>
            );
          })}
        </div>
      </div>

      <Button
        type="button"
        variant={"outline"}
        className="flex items-center gap-2"
        onClick={handleNext}
      >
        Next <ChevronRight size={18} />
      </Button>
    </div>
  );
};
