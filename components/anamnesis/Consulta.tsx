"use client";

import type { ClinicalCase, ChatMessage } from "@/types/case";
import ChatAvatar from "./ChatAvatar";
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
}

export default function Consulta({ clinicalCase, messages, loading, input, onInputChange, onSend, loadingInput }: ConsultaProps) {
  return (
    <div className="w-full max-w-4xl mx-auto bg-[#ffffff] rounded-lg shadow-lg border-[0.5px] border-[#1098f7] flex flex-col h-[calc(100vh-450px)] mt-8">
      <div className="p-4 pb-3 border-b-[0.5px] border-[#1098f7] flex-shrink-0">
        <h2 className="text-xl font-bold text-[#00072d]">
          Consulta
        </h2>
      </div>
      
      <div className="flex-1 min-h-0 grid grid-cols-[200px_1fr] gap-4 p-4">
        <ChatAvatar />
        
        <div className="flex flex-col min-h-0">
          <div className="flex-1 min-h-0 overflow-hidden border rounded-lg mb-4">
            <ChatBox clinicalCase={clinicalCase} messages={messages} loading={loading} />
          </div>
          
          <div className="flex-shrink-0">
            <ChatInput input={input} onInputChange={onInputChange} onSend={onSend} loading={loadingInput} />
          </div>
        </div>
      </div>
    </div>
  );
}

