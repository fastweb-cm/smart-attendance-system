interface GroupWizardHeaderProps {
  currentStep: 1 | 2 | 3;
}

export default function WizardHeader({ currentStep }: GroupWizardHeaderProps) {
  const steps = [
    { id: 1, label: "Group Profile" },
    { id: 2, label: "Assign Members" },
    { id: 3, label: "Assign Supervisors" },
  ];

  return (
    <div className="flex items-center space-x-4 my-4">
      {steps.map((s) => (
        <div key={s.id} className="flex items-center space-x-2">
          <div
            className={`w-8 h-8 rounded-full border-2 flex items-center justify-center text-sm font-semibold transition-colors ${
              currentStep === s.id
                ? "border-primary bg-primary text-white"
                : "border-gray-300 text-gray-400"
            }`}
          >
            {s.id}
          </div>
          <span
            className={`text-sm ${
              currentStep === s.id
                ? "text-primary font-medium"
                : "text-gray-400"
            }`}
          >
            {s.label}
          </span>
        </div>
      ))}
    </div>
  );
}
