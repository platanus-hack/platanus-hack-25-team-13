"use client";

import type { ClinicalCase } from "@/types/case";
import ChatBox from "./ChatBox";

interface ConsultaProps {
  clinicalCase: ClinicalCase;
}

export default function Consulta({ clinicalCase }: ConsultaProps) {
  return (
    <div className="w-full max-w-2xl mx-auto bg-[#ffffff] rounded-lg shadow-lg border-[0.5px] border-[#1098f7] p-4 flex flex-col h-[calc(100vh-200px)]">
      <h2 className="text-xl font-bold text-[#00072d] mb-4 pb-3 border-b-[0.5px] border-[#1098f7]">
        Consulta
      </h2>
      
      <div className="flex-1 min-h-0">
        <ChatBox clinicalCase={clinicalCase} />
      </div>
    </div>
  );
}

