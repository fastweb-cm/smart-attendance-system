"use client";

import { createUserFormValues, userCreateForm } from '@/schema/user.schema'
import { zodResolver } from '@hookform/resolvers/zod'
import { FormProvider, useForm } from 'react-hook-form'
import { z } from 'zod'
import InputField from '../ui/InputField'
import { Button } from '../ui/button';
import { useCreateUser } from '@/hooks/useUsers';
import { toast } from 'react-toastify';

export default function UsersForm({ userType }: { userType: z.infer<typeof userCreateForm>['user_type'] }) {

  const createUserMutation = useCreateUser();
  
  const methods = useForm<createUserFormValues>({
    resolver: zodResolver(userCreateForm),
    defaultValues: {
      user_type: userType
    }
  })


  const onSubmit = async (data: createUserFormValues) => {
    try {
      await createUserMutation.mutateAsync({ body: data })
      methods.reset();
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : 'An unexpected error occurred'
      );
    }
  }

  return (
    <FormProvider {...methods}>
      <div className="rounded-md bg-white shadow-md p-4 mt-4">
        <h2 className="text-primary leading-10">
          Create a new {userType}
        </h2>
        <form onSubmit={methods.handleSubmit(onSubmit)} className='space-y-4'>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <InputField name='fname' label='First Name' required />
            <InputField name='lname' label='Last Name' required />
            <InputField name='email' label='Email Adress' required />

            { userType === 'student' && <>
              <InputField name='regno' label='Reg No' required={true} />
              <InputField name='class_id' type='select' required label='Student Class' options={[{ label: "Form 1A", value: 1 }, { label: "Form 2A", value: 2 }]} valueType="number"/>
              </>
            }

            {
              userType === "staff" && <>
              </>
            }
            <InputField required name='gender' type='radio' label='Gender' options={[{label: "Male", value: "male"}, {label: "Female", value:"female"}]} />
            
          </div>
          <Button className='mt-4 rounded-none' type="submit" disabled={createUserMutation.isPending}>
            {
              createUserMutation.isPending
                ? `creating ${userType}...`
                : `create ${userType}`
            }
          </Button>
        </form>
      </div>
    </FormProvider>
  )
}
