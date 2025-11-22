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
    <div className="w-full py-1">
      <div className="flex items-center justify-between relative">
        {/* Background line completa */}
        <div className="absolute top-3 left-0 right-0 h-0.5 bg-gray-200"></div>
        
        {steps.map((step, index) => {
          const isActive = index === currentStep;
          const isCompleted = index < currentStep;
          
          return (
            <div key={index} className="flex flex-col items-center relative flex-1">
              {/* Circle */}
              <div className="relative z-10">
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center border-2 transition-all ${
                    isCompleted
                      ? "bg-[#1098f7] border-[#1098f7] text-white"
                      : isActive
                      ? "bg-[#1098f7] border-[#1098f7] text-white"
                      : "bg-white border-gray-300 text-gray-400"
                  }`}
                >
                  {isCompleted ? (
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    <span className={`text-[10px] font-semibold ${isActive ? "text-white" : "text-gray-400"}`}>
                      {index + 1}
                    </span>
                  )}
                </div>
              </div>
              
              {/* Progress line hacia el siguiente */}
              {index < steps.length - 1 && (
                <div className="absolute top-3 left-1/2 w-1/2 h-0.5 z-0">
                  <div
                    className={`h-full transition-all duration-500 ${
                      isCompleted ? "bg-[#1098f7]" : "bg-transparent"
                    }`}
                  ></div>
                </div>
              )}
              
              {/* Title */}
              <div className="mt-1 text-center">
                <span
                  className={`text-[10px] font-medium whitespace-nowrap ${
                    isActive
                      ? "text-[#1098f7] font-semibold"
                      : isCompleted
                      ? "text-gray-700"
                      : "text-gray-400"
                  }`}
                >
                  {step.title}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

