"use client";

import { useFormContext, Controller } from "react-hook-form";
import { TerminalCreateFormValues } from "@/schema/terminal.schema";
import { Select,SelectContent,SelectItem,SelectTrigger,SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";

interface Step2Props {
  onBack: () => void;
}

export const Step2Access: React.FC<Step2Props> = ({ onBack }) => {
  const { control, watch, setValue } =
    useFormContext<TerminalCreateFormValues>();

  // Correct field names
  const authTypes = watch("authCapabilities") || [];
  const policies = watch("authPolicies") || [];

  // Build auth options from selected capabilities
  const authOptions = authTypes.map((a) => ({
    id: a.auth_type_id,
    label:
      a.auth_type_id === 1
        ? "Face"
        : a.auth_type_id === 2
        ? "Card"
        : "Fingerprint",
  }));

  const groups = [
    {
      id: 1,
      label: "Group A",
      subgroups: [
        { id: 101, label: "Subgroup A1" },
        { id: 102, label: "Subgroup A2" },
      ],
    },
    {
      id: 2,
      label: "Group B",
      subgroups: [{ id: 201, label: "Subgroup B1" }],
    },
  ];

  const toggleGroup = (groupId: number, subgroupId: number) => {
    const exists = policies.find(
      (p) => p.group_id === groupId && p.subgroup_id === subgroupId
    );

    if (exists) {
      setValue(
        "authPolicies",
        policies.filter(
          (p) =>
            !(p.group_id === groupId && p.subgroup_id === subgroupId)
        )
      );
    } else {
      setValue("authPolicies", [
        ...policies,
        {
          group_id: groupId,
          subgroup_id: subgroupId,
          auth_type_id: authOptions[0]?.id ?? 1,
        },
      ]);
    }
  };

  const setAuthType = (
    groupId: number,
    subgroupId: number,
    authTypeId: number
  ) => {
    setValue(
      "authPolicies",
      policies.map((p) =>
        p.group_id === groupId && p.subgroup_id === subgroupId
          ? { ...p, auth_type_id: authTypeId }
          : p
      )
    );
  };

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-medium mb-4">
        Access Policy
      </h3>

      {groups.map((group) => (
        <div
          key={group.id}
          className="border p-4 rounded-md space-y-2"
        >
          <p className="font-semibold">{group.label}</p>

          {group.subgroups.map((sg) => {
            const policyIndex = policies.findIndex(
              (p) =>
                p.group_id === group.id &&
                p.subgroup_id === sg.id
            );

            const policy =
              policyIndex !== -1 ? policies[policyIndex] : null;

            return (
              <div
                key={sg.id}
                className="flex items-center gap-4"
              >
                <Checkbox
                  checked={!!policy}
                  onCheckedChange={() =>
                    toggleGroup(group.id, sg.id)
                  }
                />

                <span>{sg.label}</span>

                {policy && (
                  <Controller
                    name={`authPolicies.${policyIndex}.auth_type_id`}
                    control={control}
                    render={({ field }) => (
                      <Select
                        // value={field.value}
                        value={String(1)}
                        onValueChange={(val) =>
                          //convert the string back to number before setting the value
                          field.onChange(Number(val))
                        }
                      >
                        {/** the trigger is the button the user clicks */}
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select Auth Type" />
                        </SelectTrigger>

                        {/** the content is the dropdown box */}
                        <SelectContent>
                          {authOptions.map((a) => (
                            <SelectItem key={a.id} value={String(a.id)}>
                              {a.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                )}
              </div>
            );
          })}
        </div>
      ))}

      <div className="flex justify-between mt-4">
        <button
          type="button"
          className="btn btn-secondary"
          onClick={onBack}
        >
          Back
        </button>

        <button
          type="submit"
          className="btn btn-primary"
        >
          Submit
        </button>
      </div>
    </div>
  );
};
