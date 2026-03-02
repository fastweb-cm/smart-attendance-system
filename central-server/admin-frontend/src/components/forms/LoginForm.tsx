"use client"

import { LoginFormValues, loginSchema } from "@/schema/auth.schema"
import { FormProvider, useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Eye, EyeOff } from "lucide-react"
import { Button } from "../ui/button"
import Link from "next/link"
import { InputGroup, RHFInputField } from "../ui/forminput"
import { usePasswordToggle } from "@/hooks/use-password-toggle"
import Image from "next/image"
import { useAuth } from "@/context/AuthContext"

export default function LoginForm() {
  const { login } = useAuth();

  const methods = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
  })

  const onSubmit = (data: LoginFormValues) => {
    const { username, password } = data;
    login(username, password);//auth the user
  }

  const password = usePasswordToggle();

  return (
    <FormProvider {...methods}>
      <div className="relative w-full sm:max-w-sm md:max-w-md rounded-sm bg-white py-10 px-8 shadow-lg">

        <div className="absolute -top-7 left-1/2 -translate-x-1/2">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white shadow-2xl">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg">
                    <Image src="/logo.jpg" alt="Logo" width={32} height={32} />
                </div>
            </div>
        </div>

        <div className="mb-6 space-y-2">
          <h2 className="text-xl font-bold">Login</h2>
          <p className="text-sm text-gray-500">
            Login to your account
          </p>
        </div>

        <form onSubmit={methods.handleSubmit(onSubmit)} className="space-y-4">
          <RHFInputField name="username" label="Username"/>

          <InputGroup name="password" type={password.type} label="Password" 
          rightElement={
            <button
              type="button"
              onClick={password.toggle}
              className="text-muted-foreground hover:text-foreground"
            >
              {password.visible ? (
                <EyeOff className="h-5 w-5" />
              ) : (
                <Eye className="h-5 w-5" />
              )}
            </button>
          }/>

          <div className="flex justify-end">
            <Link href="/forgot-password" className="text-sm text-blue-600 hover:underline">
              Forgot password?
            </Link>
          </div>

          <Button type="submit" className="w-full rounded-none bg-primary hover:bg-primary/80 cursor-pointer">
            Login
          </Button>
        </form>
      </div>
    </FormProvider>
  )
}
