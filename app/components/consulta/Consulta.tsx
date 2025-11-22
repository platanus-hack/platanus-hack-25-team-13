"use client";

import { useState } from "react";
import { FaUserMd } from "react-icons/fa";

export default function Consulta() {
  const [input, setInput] = useState("");

  const handleSend = () => {
    if (!input.trim()) return;
    // Aquí irá la lógica para enviar el mensaje
    console.log("Mensaje:", input);
    setInput("");
  };

  return (
    <div className="w-full max-w-2xl mx-auto bg-[#ffffff] rounded-lg shadow-lg border-[0.5px] border-[#1098f7] p-4 flex flex-col h-[calc(100vh-210px)]">
      <h2 className="text-xl font-bold text-[#00072d] mb-4 pb-3 border-b-[0.5px] border-[#1098f7]">
        Consulta
      </h2>
      
      <div className="flex-1 flex items-center justify-center py-8">
        <FaUserMd className="w-32 h-32 text-[#1098f7] opacity-50" />
      </div>

      <div className="border-t-[0.5px] border-[#1098f7] pt-4 mt-4">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            placeholder="Escribe tu pregunta al paciente..."
            className="flex-1 border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-[#1098f7] focus:ring-1 focus:ring-[#1098f7]"
          />
          <button
            onClick={handleSend}
            disabled={!input.trim()}
            className="bg-[#1098f7] text-white px-6 py-2 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#0d7fd6] transition-colors font-medium"
          >
            Enviar
          </button>
        </div>
      </div>
    </div>
  );
}

