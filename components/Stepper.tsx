"use client";

interface Step {
  title: string;
}

interface StepperProps {
  steps: Step[];
  currentStep: number;
}

export default function Stepper({ steps, currentStep }: StepperProps) {
  return (
    <div className="w-full max-w-2xl">
      <div className="flex items-start">
        {steps.map((step, index) => (
          <div key={index} className="flex items-start flex-1 relative">
            <div className="flex flex-col items-center w-full">
              <div
                className={`relative w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-semibold transition-all duration-300 z-10 ${
                  index < currentStep
                    ? "bg-[#1098f7] text-white"
                    : index === currentStep
                    ? "bg-[#1098f7] text-white ring-1 ring-[#1098f7] ring-offset-1"
                    : "bg-gray-200 text-gray-500"
                }`}
              >
                {index < currentStep ? (
                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                ) : (
                  index + 1
                )}
              </div>
              <span
                className={`text-[10px] mt-0.5 text-center font-medium transition-colors duration-300 ${
                  index <= currentStep
                    ? "text-[#1098f7]"
                    : "text-gray-400"
                }`}
              >
                {step.title}
              </span>
            </div>
            {index < steps.length - 1 && (
              <div
                className={`absolute left-1/2 top-3 h-0.5 w-full transition-colors duration-300 ${
                  index < currentStep
                    ? "bg-[#1098f7]"
                    : "bg-gray-200"
                }`}
                style={{ marginLeft: '0.75rem' }}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

