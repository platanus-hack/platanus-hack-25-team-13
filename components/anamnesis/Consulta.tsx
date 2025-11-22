"use client";

import { useState } from "react";
import type { ClinicalCase, ChatMessage } from "@/types/case";
import ChatBox from "./ChatBox";
import ChatInput from "./ChatInput";

interface ConsultaProps {
  clinicalCase: ClinicalCase;
}

export default function Consulta({ clinicalCase }: ConsultaProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: "assistant",
      content: `Hola doctor/a, ${clinicalCase.motivo_consulta}`,
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSend() {
    if (!input.trim() || loading) return;

    const userMessage: ChatMessage = {
      role: "user",
      content: input,
      timestamp: new Date(),
    };

    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: newMessages,
          clinicalCase,
        }),
      });

      if (!res.ok) throw new Error("Error en chat");

      const data = await res.json();
      const assistantMessage: ChatMessage = {
        role: "assistant",
        content: data.message,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (err) {
      console.error(err);
      alert("Error enviando mensaje");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="w-full max-w-2xl mx-auto bg-[#ffffff] rounded-lg shadow-lg border-[0.5px] border-[#1098f7] flex flex-col h-[calc(100vh-280px)]">
      <div className="p-4 pb-3 border-b-[0.5px] border-[#1098f7]">
        <h2 className="text-xl font-bold text-[#00072d]">
          Consulta
        </h2>
      </div>
      
      <div className="flex-1 min-h-0 overflow-hidden">
        <ChatBox clinicalCase={clinicalCase} messages={messages} loading={loading} />
      </div>

      <ChatInput input={input} onInputChange={setInput} onSend={handleSend} loading={loading} />
    </div>
  );
}

