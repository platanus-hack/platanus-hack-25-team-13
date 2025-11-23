"use client";

import type { ClinicalCase, ChatMessage, RequestedExam } from "@/types/case";
import ChatBox from "./ChatBox";
import ChatInput from "./ChatInput";

interface ConsultaProps {
  clinicalCase: ClinicalCase;
  messages: ChatMessage[];
  loading: boolean;
  input: string;
  onInputChange: (value: string) => void;
  onSend?: () => void;
  loadingInput: boolean;
  requestedExams: RequestedExam[];
  disabled?: boolean;
}

export default function Consulta({
  clinicalCase,
  messages,
  loading,
  input,
  onInputChange,
  onSend,
  loadingInput,
  disabled = false,
}: ConsultaProps) {
  const isDev = process.env.NEXT_PUBLIC_DEV === "true";

  return (
    <div className="w-full h-full bg-[#ffffff] rounded-lg shadow-lg border-[0.5px] border-[#1098f7] flex flex-col">
      <div className="p-4 pb-3 border-b-[0.5px] border-[#1098f7] flex-shrink-0 flex items-center justify-between">
        <h2 className="text-xl font-bold text-[#00072d]">Consulta Médica</h2>
        {isDev && (
          <button
            onClick={() => {
              if (
                typeof window !== "undefined" &&
                (window as any).__DEV_NEXT_STEP
              ) {
                (window as any).__DEV_NEXT_STEP();
              }
            }}
            className="text-xs bg-yellow-500 hover:bg-yellow-600 text-white font-medium py-1 px-3 rounded transition-colors"
          >
            DEV: Siguiente
          </button>
        )}
      </div>

      <div className="flex-1 min-h-0 flex flex-col p-4">
        {/* Chat */}
        <div className="flex-1 min-h-0 overflow-hidden border rounded-lg mb-4 flex flex-col">
          <ChatBox
            clinicalCase={clinicalCase}
            messages={messages}
            loading={loading}
          />
        </div>

        {/* Input del chat */}
        {!disabled && (
          <div className="flex-shrink-0">
            <ChatInput
              input={input}
              onInputChange={onInputChange}
              onSend={onSend}
              loading={loadingInput}
              disabled={disabled}
            />
          </div>
        )}
      </div>
    </div>
  );
}