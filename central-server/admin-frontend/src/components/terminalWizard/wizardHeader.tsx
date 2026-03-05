import { WizardStep } from '@/types'

export default function WizardHeader({ currentStep }: { currentStep: WizardStep }) {
  return (
    <div className="flex items-center space-x-4 my-4">
        {
            [1,2].map(step => (
                <div key={step} className="flex items-center space-x-2">
                    <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center ${currentStep === step ? "border-primary bg-primary text-white":"border-secondary/40 text-muted/10"}`}>
                        {step}
                    </div>
                    <span className={currentStep === step ? "text-primary font-medium" : "text-gray/10"}>
                        {step === 1 ? "Terminal Setup" : "Access Policy"}
                    </span>
                </div>
                
            ))
        }
    </div>
  )
}
