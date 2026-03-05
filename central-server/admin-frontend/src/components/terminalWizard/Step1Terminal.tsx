"use client";

import { useFormContext, Controller } from "react-hook-form";
import { TerminalCreateFormValues } from "@/schema/terminal.schema";
import InputField from "../ui/InputField";
import { readonly } from "zod";

interface Step1Props {
  onNext: () => void;
}

export const Step1Terminal: React.FC<Step1Props> = ({ onNext }) => {
  const { control, watch, setValue, trigger } =
    useFormContext<TerminalCreateFormValues>();

  const authCapabilities = watch("authCapabilities") || [];

  const handleNext = async () => {
    const valid = await trigger([
      "terminalDetails.name",
      "terminalDetails.activation_code",
      "terminalDetails.branch_id",
      "authCapabilities",
    ]);

    if (valid) onNext();
  };

  const authOptions = [
    { id: 1, label: "Face" },
    { id: 2, label: "Card" },
    { id: 3, label: "Fingerprint" },
  ];

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold">Terminal Profile</h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
        <InputField label="Terminal Name" name="terminalDetails.name" required/>

        <InputField label="Activation Code" name="terminalDetails.activation_code" required inputProps={{placeholder: "Auto-Generated", readOnly: true}}/>

        <InputField label="Branch ID" name="terminalDetails.branch_id"
                type="select"
         valueType="number"
        options={[{label: "Gate", value: 1}]}
        required
      />
      </div>

      <div className="space-y-2">
        <p className="text-sm font-medium">Authentication Setup</p>

        <Controller
          name="authCapabilities"
          control={control}
          render={({ field }) => (
            <div className="flex flex-col gap-2">
              {authOptions.map((opt) => {
                const checked = field.value?.some(
                  (v) => v.auth_type_id === opt.id
                );

                return (
                  <label key={opt.id} className="flex gap-2 items-center">
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={(e) => {
                        if (e.target.checked) {
                          field.onChange([
                            ...(field.value || []),
                            { auth_type_id: opt.id, auth_step: 0 },
                          ]);
                        } else {
                          field.onChange(
                            field.value.filter(
                              (v) => v.auth_type_id !== opt.id
                            )
                          );
                        }
                      }}
                    />
                    {opt.label}
                  </label>
                );
              })}
            </div>
          )}
        />
      </div>

      <button
        type="button"
        className="btn btn-primary"
        onClick={handleNext}
      >
        Next
      </button>
    </div>
  );
};
