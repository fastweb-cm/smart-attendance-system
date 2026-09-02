"use client";

import React, { useState, useEffect } from "react";
import { useForm, FormProvider, SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { GroupCreateSchema, GroupCreateFormValues } from "@/schema/group.schema";
import { useCreateGroup, useUpdateGroup } from "@/hooks/useGroups";
import WizardHeader from "./WizardHeader";
import { Step1Group } from "./Step1Group";
import { Step2Members } from "./Step2Members";
import { Step3Supervisors } from "./Step3Supervisors";
import { GroupCreate } from "@/client";
import { useRouter } from "next/navigation";

interface GroupWizardProps {
  initialData?: GroupCreateFormValues;
  onSuccess?: () => void;
}

export const GroupWizard: React.FC<GroupWizardProps> = ({
  initialData,
  onSuccess,
}) => {
  const router = useRouter();
  const isEditingMode = !!initialData?.groupDetails?.id;
  const editingGroupId = initialData?.groupDetails?.id;

  const [step, setStep] = useState<1 | 2 | 3>(1);

  const createGroupMutation = useCreateGroup();
  const updateGroupMutation = useUpdateGroup();

  const isSubmitting =
    createGroupMutation.isPending || updateGroupMutation.isPending;

  const methods = useForm<GroupCreateFormValues>({
    // eslint-disable-next-line
    resolver: zodResolver(GroupCreateSchema) as any,
    defaultValues: {
      groupDetails: {
        name: "",
        branch_id: 1,
        grouptype_id: 1,
        expected_weekly_hours: 40,
        absence_threshold: 3,
      },
      member_ids: [],
      supervisor_ids: [],
    },
    mode: "onChange",
  });

  useEffect(() => {
    if (isEditingMode && initialData) {
      methods.reset(initialData);
    }
  }, [initialData, isEditingMode, methods]);

  const onSubmit: SubmitHandler<GroupCreateFormValues> = async (values) => {
    // Strongly typed request payload matching GroupCreate OpenAPI contract
    const body: GroupCreate = {
      name: values.groupDetails.name,
      branch_id: values.groupDetails.branch_id,
      grouptype_id: values.groupDetails.grouptype_id,
      expected_weekly_hours: values.groupDetails.expected_weekly_hours,
      absence_threshold: values.groupDetails.absence_threshold,
      member_ids: values.member_ids,
      supervisor_ids: values.supervisor_ids,
    };

    if (isEditingMode && editingGroupId) {
      await updateGroupMutation.mutateAsync({
        path: { id: editingGroupId },
        body
      });
    } else {
      await createGroupMutation.mutateAsync({
        body
      });
    }

    if (onSuccess) {
      onSuccess();
    }

    router.push("/admin/groups");
  };

  return (
    <FormProvider {...methods}>
      <form
        onSubmit={methods.handleSubmit(onSubmit)}
        className="rounded-md bg-white shadow-md p-6 mt-4"
      >
        <div className="flex items-center justify-between">
          <h2 className="text-primary text-xl font-bold">
            {isEditingMode ? "Edit Group" : "Create Group"}
          </h2>
          {isSubmitting && (
            <span className="text-xs text-blue-600 font-medium animate-pulse">
              Saving group...
            </span>
          )}
        </div>

        <WizardHeader currentStep={step} />

        {step === 1 && <Step1Group onNext={() => setStep(2)} />}
        {step === 2 && (
          <Step2Members onNext={() => setStep(3)} onBack={() => setStep(1)} />
        )}
        {step === 3 && (
          <Step3Supervisors
            onBack={() => setStep(2)}
            isSubmitting={isSubmitting}
          />
        )}
      </form>
    </FormProvider>
  );
};
