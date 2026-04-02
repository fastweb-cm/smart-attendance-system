"use client";

import { useForm, FormProvider } from "react-hook-form";
import InputField from "@/components/ui/InputField";
import { Button } from "../ui/button";
import { terminalActivationSchema, TerminalActivationData } from "@/schemas/terminalActivation.schema";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { toast } from "react-toastify";
import { useRouter } from "next/navigation";
import { useActivateTerminal } from "@/hooks/useTerminal";

export default function TerminalActivationForm() {
  const router = useRouter();
  const activate = useActivateTerminal();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const methods = useForm<TerminalActivationData>({
    resolver: zodResolver(terminalActivationSchema)
  });

  const onSubmit = async (data: TerminalActivationData) => {
    setIsSubmitting(true);
    try {
      const result = await activate.mutateAsync({body: data});
      if(result.success === false){
        toast.error("Activation failed");
      }else{
        // trigger local bootstrap
        toast.info("Bootstrapping terminal... please wait.")

        const bootstrapResponse = await fetch('/api/bootstrap', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(result.data)
        })

        const bootstrapResult = await bootstrapResponse.json();

        if (bootstrapResult.success){
          toast.success("Terminal is ready")
          //redirect to operational ui
          router.push("/terminal");
        }else{
          toast.error("Bootstrap failed:" + bootstrapResult.message);
        }

      }
      // eslint-disable-next-line
    } catch (error: any) {
      console.error(error)
      toast.error(error.response?.data?.message || "An unexpected error occurred, please contact admin.")
    } finally{
      setIsSubmitting(false)
    }
  };

  return (
    <FormProvider {...methods}>
      <form onSubmit={methods.handleSubmit(onSubmit)}>
        <InputField
          name="code"
          label="Activation Code"
          required
          inputProps={{ placeholder: "xxxxxxxx"}}
        />

        <Button type="submit" variant={"primary"} className="mt-2" disabled={isSubmitting}>
          {isSubmitting ? "Activating..." : "Activate"}
        </Button>
      </form>
    </FormProvider>
  );
}
