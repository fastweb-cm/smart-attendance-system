"use client";
import { useForm, FormProvider } from "react-hook-form";
import { TerminalCreateFormValues } from "@/schema/terminal.schema";
import { zodResolver } from "@hookform/resolvers/zod";
import { TerminalCreateSchema } from "@/schema/terminal.schema"; 
import WizardHeader from "./wizardHeader";
import { Step1Terminal } from "./Step1Terminal";
import { Step2Access } from "./Step2Terminal"; 
import { useState } from "react";

export const TerminalWizard: React.FC = () => {
  const [step, setStep] = useState<1 | 2>(1);
  const methods = useForm<TerminalCreateFormValues>({
    resolver: zodResolver(TerminalCreateSchema),
    defaultValues: {
      terminalDetails: {
        name: "",
        activation_code: "",
        branch_id: 1,
        slug: "",
        status: "pending",
      },
      authCapabilities: [],
      authPolicies: [],
    },
    mode: "onChange",
  });

  const onSubmit = (data: TerminalCreateFormValues) => {
    console.log("Final payload:", data);
    // TODO: call createTerminalMutation.mutate(data)
  };

  return (
    <FormProvider {...methods}>
      <form onSubmit={methods.handleSubmit(onSubmit)} className="rounded-md bg-white shadow-md p-4 mt-4">
        <h2 className="text-primary text-xl">Create Terminal</h2>
        <WizardHeader currentStep={step} />
        {step === 1 && <Step1Terminal onNext={() => setStep(2)} />}
        {step === 2 && <Step2Access onBack={() => setStep(1)} />}
      </form>
    </FormProvider>
  );
};
