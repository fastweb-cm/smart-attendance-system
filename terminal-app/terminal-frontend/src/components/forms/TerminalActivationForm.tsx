"use client";

import { useForm, FormProvider } from "react-hook-form";
import InputField from "@/components/ui/InputField";
import { Button } from "../ui/button";
import { terminalActivationSchema, TerminalActivationData } from "@/schemas/terminalActivation.schema";
import { zodResolver } from "@hookform/resolvers/zod";

export default function TerminalActivationForm() {
  const methods = useForm<TerminalActivationData>({
    resolver: zodResolver(terminalActivationSchema)
  });

  const onSubmit = (data: TerminalActivationData) => {
    console.log(data);
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

        <Button type="submit" variant={"primary"} className="mt-2">Activate</Button>
      </form>
    </FormProvider>
  );
}
