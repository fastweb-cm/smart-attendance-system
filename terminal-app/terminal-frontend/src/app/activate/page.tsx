
import TerminalActivationForm from '@/components/forms/TerminalActivationForm'
import React from 'react'

export default function Activation() {
  return (
    <div className="w-full max-w-lg bg-white shadow-lg rounded-lg p-8">
        <div className="text-center mb-8">
            <h2 className="text-2xl font-semibold text-primary tracking-tight">
                Terminal Activation
            </h2>
            <p className="text-muted mt-2 text-sm">
                Enter the activation code to enable this terminal.
            </p>
        </div>

        <TerminalActivationForm />
    </div>
  )
}
