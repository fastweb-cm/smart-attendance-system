"use client";

import { useForm, FormProvider } from "react-hook-form";
import InputField from "@/components/ui/InputField";
import { Button } from "../ui/button";
import { terminalActivationSchema, TerminalActivationData } from "@/schemas/terminalActivation.schema";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { activateTerminal } from "@/app/activate/actions";
import { toast } from "react-toastify";
import { useRouter } from "next/navigation";

export default function TerminalActivationForm() {
  const router = useRouter();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const methods = useForm<TerminalActivationData>({
    resolver: zodResolver(terminalActivationSchema)
  });

  const onSubmit = async (data: TerminalActivationData) => {
    setIsSubmitting(true);
    try {
      const result = await activateTerminal(data.activationCode);
      if(result.success === false){
        toast.error(result.message);
      }else{
        //redirect to operational ui
        router.push("/terminal");
      }
    } catch (error) {
      console.error(error)
      toast.error("An unexpected error occurred, please contact admin.")
    } finally{
      setIsSubmitting(false)
    }
  };

  return (
    <FormProvider {...methods}>
      <form onSubmit={methods.handleSubmit(onSubmit)}>
        <InputField
          name="activationCode"
          label="Activation Code"
          required
          inputProps={{ placeholder: "xxxx-xxxx"}}
        />

        <Button type="submit" variant={"primary"} className="mt-2" disabled={isSubmitting}>
          {isSubmitting ? "Activating..." : "Activate"}
        </Button>
      </form>
    </FormProvider>
  );
}
