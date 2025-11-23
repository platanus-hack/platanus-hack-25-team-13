"use client";

interface Step {
  title: string;
}

interface StepperProps {
  steps: Step[];
  currentStep: number;
  onStepClick?: (stepIndex: number) => void;
  clickable?: boolean;
}

export default function Stepper({ steps, currentStep, onStepClick, clickable = false }: StepperProps) {
  return (
    <div className="w-full py-2">
      <div className="flex items-center justify-center relative">
        {/* Background line completa */}
        <div className="absolute top-3 h-1 bg-gray-200 rounded-full" style={{ left: 'calc(100% / 6)', right: 'calc(100% / 6)' }}></div>

        {/* Progress line - solo se muestra cuando hay progreso */}
        {currentStep > 0 && (
          <div
            className="absolute top-3 h-1 bg-[#1098f7] rounded-full transition-all duration-500"
            style={{
              left: 'calc(100% / 6)',
              width: `calc((100% - 100% / 3) * ${currentStep / (steps.length - 1)})`
            }}
          ></div>
        )}

        {steps.map((step, index) => {
          const isActive = index === currentStep;
          const isCompleted = index < currentStep;
          const canClick = clickable && onStepClick; // En modo revisión, cualquier paso es clickeable
          
          return (
            <div key={index} className="flex flex-col items-center relative" style={{ flex: 1 }}>
              {/* Circle */}
              <div className="relative z-10">
                <div
                  onClick={canClick ? () => onStepClick(index) : undefined}
                  className={`w-6 h-6 rounded-full flex items-center justify-center border-2 transition-all ${
                    isCompleted
                      ? "bg-[#1098f7] border-[#1098f7] text-white"
                      : isActive
                      ? "bg-[#1098f7] border-[#1098f7] text-white"
                      : "bg-white border-gray-300 text-gray-400"
                  } ${canClick ? "cursor-pointer hover:scale-110" : ""}`}
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

              {/* Title */}
              <div className="mt-1 text-center">
                <span
                  onClick={canClick ? () => onStepClick(index) : undefined}
                  className={`text-[10px] font-medium whitespace-nowrap ${
                    isActive
                      ? "text-[#1098f7] font-semibold"
                      : isCompleted
                      ? "text-gray-700"
                      : "text-gray-400"
                  } ${canClick ? "cursor-pointer hover:text-[#1098f7]" : ""}`}
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

