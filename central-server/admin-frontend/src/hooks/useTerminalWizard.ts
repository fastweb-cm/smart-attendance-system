import { TerminalCreateFormValues, TerminalCreateSchema } from "@/schema/terminal.schema";
import { useState } from "react";
import z from "zod";


export const useTerminalWizard = (defaultValues?: TerminalCreateFormValues) => {
    const [currentStep, setCurrentStep] = useState<1 | 2>(1);
    const [values, setValues] = useState<TerminalCreateFormValues>(
        defaultValues || {
            terminalDetails: {
                name: "",
                branch_id: 1,
                activation_code: "",
                slug: '',
                status: 'pending',
            },
            authCapabilities: [],
            authPolicies: []
        }
    );

    const nextStep = () => setCurrentStep(2);
    const prevStep = () => setCurrentStep(1);

    const updateValues = (updated: Partial<TerminalCreateFormValues>) => {
        setValues(prev => ({...prev, ...updated}))
    }

    const validateStep = (stepValues: Partial<TerminalCreateFormValues>) => {
        try{
            if(currentStep === 1) {
                const stepOneSchema = z.object({
                    terminalDetails: TerminalCreateSchema.shape.terminalDetails.pick({
                        name: true,
                        branch_id: true,
                    }),
                    authCapabilities: TerminalCreateSchema.shape.authCapabilities,
                });

                stepOneSchema.parse(stepValues);
            } else{
                const stepTwoSchema = z.object({
                    terminalPolicy: TerminalCreateSchema.shape.authPolicies
                })
                stepTwoSchema.parse(stepValues)
            }

            return true;
        }catch(err){
            return false;
        }
    };

    return { currentStep, nextStep, prevStep, values, updateValues, validateStep }
}
