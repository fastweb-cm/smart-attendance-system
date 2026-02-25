import UsersForm from '@/components/forms/UsersForm'
import React from 'react'

export default function Students() {
  return (
    <div className="space-y-4 my-4">
      <UsersForm userType='student' />
    </div>
  )
}
