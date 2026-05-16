"use client";
import { useForm, FormProvider } from "react-hook-form";
import { TerminalCreateFormValues } from "@/schema/terminal.schema";
import { zodResolver } from "@hookform/resolvers/zod";
import { TerminalCreateSchema } from "@/schema/terminal.schema"; 
import WizardHeader from "./wizardHeader";
import { Step1Terminal } from "./Step1Terminal";
import { Step2Access } from "./Step2Terminal"; 
import { useState, useEffect } from "react";
import { GroupWithSubgroupsLookup, Lookup, LookupBranch } from "@/types";
import { getAuthTypes, getbranches, getGroupsWithSubgroups } from "@/lib/actions/lookups";

export const TerminalWizard: React.FC = () => {
  const [step, setStep] = useState<1 | 2>(1);
  const [branches, setBranches] = useState<LookupBranch[]>([]);
  const [authTypes, setAuthTypes] = useState<Lookup[]>([]);
  const [authPolicies, setAuthPolicies] = useState<GroupWithSubgroupsLookup[]>([]);
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

  // fetch branches
  useEffect(() => {
    const fetchBranches = async () => {
      const data = await getbranches();
      setBranches(data);
    };

    const fetchAuthTypes = async () => {
      const data = await getAuthTypes();
      setAuthTypes(data);
    }

    const fetchAuthPolicies = async () => {
      const data = await getGroupsWithSubgroups();
      setAuthPolicies(data);
    }

    fetchBranches();
    fetchAuthTypes();
    fetchAuthPolicies();
  }, []);


  const onSubmit = (data: TerminalCreateFormValues) => {
    console.log("Final payload:", data);
    // TODO: call createTerminalMutation.mutate(data)
  };


  return (
    <FormProvider {...methods}>
      <form onSubmit={methods.handleSubmit(onSubmit)} className="rounded-md bg-white shadow-md p-4 mt-4">
        <h2 className="text-primary text-xl">Create Terminal</h2>
        <WizardHeader currentStep={step} />
        {step === 1 && <Step1Terminal onNext={() => setStep(2)} initialBranches={branches} initialAuthTypes={authTypes} />}
        {step === 2 && <Step2Access onBack={() => setStep(1)} initialAuthTypes={authTypes} initialAuthPolicies={authPolicies} />}
      </form>
    </FormProvider>
  );
};
