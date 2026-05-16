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
import { useCreateTerminal } from "@/hooks/useTerminals";
import { Check, Copy } from "lucide-react";
import { Button } from "../ui/button";

interface TerminalWizardProps {
  initialData?: TerminalCreateFormValues & { terminalDetails: { id?: number } };
}

export const TerminalWizard: React.FC<TerminalWizardProps> = ({ initialData }) => {
  const isEditingMode = !!initialData?.terminalDetails?.id; // Determine mode based on presence of terminal ID

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

  // Fetch contextual infrastructure options
  useEffect(() => {
    const fetchMetadata = async () => {
      try {
        const [branchesData, authTypesData, policiesData] = await Promise.all([
          getbranches(),
          getAuthTypes(),
          getGroupsWithSubgroups()
        ]);
        setBranches(branchesData);
        setAuthTypes(authTypesData);
        setAuthPolicies(policiesData);
      } catch (err) {
        console.error("Lookup data load failed", err);
      }
    };
    fetchMetadata();
  }, []);

  // pre-populate form in edit mode
  useEffect(() => {
    if (isEditingMode && initialData) {
      methods.reset(initialData);
    }
  }, [initialData, isEditingMode, methods]);

  // terminal creation mutation hook
  const createTerminal = useCreateTerminal();

  //clipboard/success state
  const [activationCode, setActivationCode] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);


  const onSubmit = async (data: TerminalCreateFormValues) => {
    try {
      let res;
      if (isEditingMode) {
        // For editing, you would call an updateTerminal mutation instead of createTerminal
      } else{
        res = await createTerminal.mutateAsync({ body: data });
      }
      // Handle server results variations cleanly
      if (res) {
        const code = res?.activation_code || res.activationCode;
        
        if (code) {
          setActivationCode(code);
        } else {
          // If editing or code isn't provided, wrap execution cleanly here
          methods.reset();
          setStep(1);
        }
      }

    } catch (error) {
      console.error("Error creating terminal:", error);
    }
  };

  const handleCopyToClipboard = async () => {
    if (!activationCode) return;
    try {
      await navigator.clipboard.writeText(activationCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy text safely", err);
    }
  };

  const handleDismissSuccess = () => {
    setActivationCode(null);
    methods.reset();
    setStep(1);
  };

  // Render a clean activation modal overlay panel once created successfully
  if (activationCode) {
    return (
      <div className="rounded-xl border border-emerald-100 bg-emerald-50/40 p-6 shadow-sm mt-4 text-center max-w-md mx-auto space-y-4">
        <div className="mx-auto w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center">
          <Check size={24} />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Terminal Operational!</h3>
          <p className="text-xs text-gray-500 mt-1">
            Copy the activation code snippet below to securely activate and link the device client.
          </p>
        </div>

        <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-lg p-2.5 shadow-inner">
          <code className="text-sm font-mono font-bold tracking-wider text-gray-800 flex-1 break-all select-all">
            {activationCode}
          </code>
          <Button 
            type="button" 
            variant="ghost" 
            size="icon" 
            onClick={handleCopyToClipboard}
            className="h-8 w-8 text-gray-500 hover:text-emerald-600"
          >
            {copied ? <Check size={16} className="text-emerald-600" /> : <Copy size={16} />}
          </Button>
        </div>

        <Button onClick={handleDismissSuccess} className="w-full bg-gray-900 hover:bg-gray-800 text-white text-xs">
          Dismiss & Return
        </Button>
      </div>
    );
  }


  return (
    <FormProvider {...methods}>
      <form onSubmit={methods.handleSubmit(onSubmit)} className="rounded-md bg-white shadow-md p-4 mt-4">
        <h2 className="text-primary text-xl">{isEditingMode ? "Edit Terminal" : "Create Terminal"}</h2>
        <WizardHeader currentStep={step} />
        {step === 1 && <Step1Terminal onNext={() => setStep(2)} initialBranches={branches} initialAuthTypes={authTypes} />}
        {step === 2 && <Step2Access onBack={() => setStep(1)} initialAuthTypes={authTypes} initialAuthPolicies={authPolicies} />}
      </form>
    </FormProvider>
  );
};
