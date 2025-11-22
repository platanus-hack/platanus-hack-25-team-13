"use client";

import { useState } from "react";
import type { ClinicalCase, ChatMessage } from "@/types/case";
import ChatBox from "./ChatBox";
import ChatInput from "./ChatInput";

interface ConsultaProps {
  clinicalCase: ClinicalCase;
  messages: ChatMessage[];
  loading: boolean;
  input: string;
  onInputChange: (value: string) => void;
  onSend: () => void;
  loadingInput: boolean;
  onExamImageGenerated?: (imageUrl: string) => void;
}

export default function Consulta({ clinicalCase, messages, loading, input, onInputChange, onSend, loadingInput, onExamImageGenerated }: ConsultaProps) {
  const isDev = process.env.NEXT_PUBLIC_DEV === "true";
  const [generatingExam, setGeneratingExam] = useState(false);

  const handleGenerateExam = async () => {
    setGeneratingExam(true);
    try {
      const response = await fetch("/api/generar-examen", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          tipoExamen: "radiografia",
        }),
      });

      const data = await response.json();
      if (data.success && data.data.imageUrl) {
        onExamImageGenerated?.(data.data.imageUrl);
      }
    } catch (error) {
      console.error("Error generando imagen de examen:", error);
    } finally {
      setGeneratingExam(false);
    }
  };

  return (
    <div className="w-full h-full bg-[#ffffff] rounded-lg shadow-lg border-[0.5px] border-[#1098f7] flex flex-col">
      <div className="p-4 pb-3 border-b-[0.5px] border-[#1098f7] flex-shrink-0 flex items-center justify-between">
        <h2 className="text-xl font-bold text-[#00072d]">
          Consulta
        </h2>
        {isDev && (
          <div className="flex gap-2">
            <button
              onClick={handleGenerateExam}
              disabled={generatingExam}
              className="text-xs bg-green-500 hover:bg-green-600 disabled:bg-gray-400 text-white font-medium py-1 px-3 rounded transition-colors"
            >
              {generatingExam ? "Generando..." : "DEV: Generar Examen"}
            </button>
            <button
              onClick={() => {
                if (typeof window !== 'undefined' && (window as any).__DEV_NEXT_STEP) {
                  (window as any).__DEV_NEXT_STEP();
                }
              }}
              className="text-xs bg-yellow-500 hover:bg-yellow-600 text-white font-medium py-1 px-3 rounded transition-colors"
            >
              DEV: Siguiente
            </button>
          </div>
        )}
      </div>
      
      <div className="flex-1 min-h-0 flex flex-col p-4">
        <div className="flex-1 min-h-0 overflow-hidden border rounded-lg mb-4">
          <ChatBox clinicalCase={clinicalCase} messages={messages} loading={loading} />
        </div>
        
        <div className="flex-shrink-0">
          <ChatInput input={input} onInputChange={onInputChange} onSend={onSend} loading={loadingInput} />
        </div>
      </div>
    </div>
  );
}

