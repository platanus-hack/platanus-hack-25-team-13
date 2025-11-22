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
    <div className="w-full bg-white rounded-xl shadow-md border border-gray-200 p-4">
      <div className="flex items-center justify-between w-full">
        {steps.map((step, index) => {
          const isActive = index === currentStep;
          const isCompleted = index < currentStep;
          const isPending = index > currentStep;
          
          return (
            <div key={index} className="flex items-center flex-1 relative">
              <div className="flex flex-col items-center flex-1 z-10">
                <div className="flex items-center w-full">
                  {/* Circle */}
                  <div className="relative">
                    <div
                      className={`flex items-center justify-center w-12 h-12 rounded-full border-2 transition-all duration-300 ${
                        isCompleted
                          ? "bg-gradient-to-br from-[#1098f7] to-[#0d7fd6] border-[#1098f7] text-white shadow-lg shadow-blue-200 scale-105"
                          : isActive
                          ? "bg-gradient-to-br from-[#1098f7] to-[#0d7fd6] border-[#1098f7] text-white shadow-lg shadow-blue-300 scale-110 ring-4 ring-blue-100"
                          : "bg-white border-gray-300 text-gray-400 shadow-sm"
                      }`}
                    >
                      {isCompleted ? (
                        <svg
                          className="w-6 h-6"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={3}
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                      ) : (
                        <span className={`font-bold text-sm ${isActive ? "text-white" : "text-gray-400"}`}>
                          {index + 1}
                        </span>
                      )}
                    </div>
                    {isActive && (
                      <div className="absolute inset-0 rounded-full bg-blue-400 animate-ping opacity-20"></div>
                    )}
                  </div>
                  
                  {/* Line */}
                  {index < steps.length - 1 && (
                    <div className="flex-1 mx-3 relative">
                      <div className="h-1 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ease-out ${
                            isCompleted
                              ? "bg-gradient-to-r from-[#1098f7] to-[#0d7fd6] w-full"
                              : isActive
                              ? "bg-gradient-to-r from-[#1098f7] to-[#0d7fd6] w-1/2"
                              : "bg-gray-200 w-0"
                          }`}
                        />
                      </div>
                    </div>
                  )}
                </div>
                
                {/* Title */}
                <div className="mt-3 text-center max-w-[120px]">
                  <span
                    className={`text-xs font-semibold transition-all duration-300 ${
                      isActive
                        ? "text-[#1098f7] font-bold"
                        : isCompleted
                        ? "text-gray-700"
                        : "text-gray-400"
                    }`}
                  >
                    {step.title}
                  </span>
                  {isActive && (
                    <div className="mt-1 h-1 w-8 bg-[#1098f7] rounded-full mx-auto"></div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

