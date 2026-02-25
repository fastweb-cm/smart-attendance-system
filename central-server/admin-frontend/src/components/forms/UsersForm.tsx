"use client";

import { createUserFormValues, zUserCreate } from '@/schema/index.schema'
import { zodResolver } from '@hookform/resolvers/zod'
import { FormProvider, useForm } from 'react-hook-form'
import { z } from 'zod'
import InputField from '../ui/InputField'
import { Button } from '../ui/button';

export default function UsersForm({ userType }: { userType: z.infer<typeof zUserCreate>['user_type'] }) {
  const methods = useForm<createUserFormValues>({
    resolver: zodResolver(zUserCreate),
    defaultValues: {
      user_type: userType
    }
  })

  const onSubmit = (data: createUserFormValues) => {
    console.log("user:",data);
  }

  return (
    <FormProvider {...methods}>
      <div className="rounded-md bg-white shadow-md p-4 mt-4">
        <h2 className="text-primary leading-10">
          Create a new {userType}
        </h2>
        <form onSubmit={methods.handleSubmit(onSubmit)} className='space-y-4'>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
            <InputField name='fname' label='First Name' required />
            <InputField name='lname' label='Last Name' required />
            <InputField name='email' label='Email Adress' required />

            <Button className='mt-4 w-1/2 rounded-none' type="submit">
              create {userType}
            </Button>
          </div>
        </form>
      </div>
    </FormProvider>
  )
}
