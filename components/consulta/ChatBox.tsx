"use client";

import { useState, useRef, useEffect } from "react";
import type { ClinicalCase, ChatMessage } from "@/types/case";

interface ChatBoxProps {
  clinicalCase: ClinicalCase;
  onMessagesChange?: (messages: ChatMessage[]) => void;
}


export default function ChatBox({ clinicalCase, onMessagesChange }: ChatBoxProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    onMessagesChange?.(messages);
  }, [messages, onMessagesChange]);

  useEffect(() => {
    async function initConversation() {
      setLoading(true);
      try {
        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            messages: [], 
            clinicalCase,
          }),
        });
        const data = await res.json();
        const firstMessage: ChatMessage = {
          role: "assistant",
          content: data.message,
          timestamp: new Date(),
        };
        setMessages([firstMessage]);
      } finally {
        setLoading(false);
      }
    }

    initConversation();
  }, [clinicalCase]);

  async function handleSend() {
    if (!input.trim() || loading) return;

    const userMessage: ChatMessage = {
      role: "user",
      content: input,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [...messages, userMessage],
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
    <div className="flex flex-col h-full border rounded-lg">
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg, idx) => (
          <div
            key={idx}
            className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[70%] rounded-lg p-3 ${
                msg.role === "user"
                  ? "bg-[#1098f7] text-white"
                  : "bg-gray-200 text-gray-800"
              }`}
            >
              <p className="text-sm">{msg.content}</p>
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-gray-200 rounded-lg p-3">
              <p className="text-sm text-gray-500">Escribiendo...</p>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="border-t-[0.5px] border-[#1098f7] p-4">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            placeholder="Escribe tu pregunta al paciente..."
            className="flex-1 border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-[#1098f7] focus:ring-1 focus:ring-[#1098f7]"
            disabled={loading}
          />
          <button
            onClick={handleSend}
            disabled={loading || !input.trim()}
            className="bg-[#1098f7] text-white px-6 py-2 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#0d7fd6] transition-colors font-medium"
          >
            Enviar
          </button>
        </div>
      </div>
    </div>
  );
}

