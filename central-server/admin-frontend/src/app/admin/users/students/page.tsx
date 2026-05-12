import UsersForm from '@/components/forms/UsersForm'
import StudentsList from '@/components/StudentsList'
import { Button } from '@/components/ui/button'
import React from 'react'

export default function Students() {
  return (
    <div className="relative space-y-4 my-4">
      <UsersForm userType='student' />
      <StudentsList />
      <Button variant="destructive" className='absolute top-72 right-0.5 shadow-md' type='button'>PULL USERS</Button>
    </div>
  )
}
