"use client";

import { useState, useRef, useEffect } from "react";
import type { ChatMessage, FeedbackResult } from "@/types/case";

interface ChatBoxProps {
  simulationId: string;
  initialMessage: string;
  onMessagesChange?: (messages: ChatMessage[]) => void;
  onFeedbackReceived?: (feedback: FeedbackResult) => void;
}

export default function ChatBox({ 
  simulationId,
  initialMessage,
  onMessagesChange,
  onFeedbackReceived 
}: ChatBoxProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: "assistant",
      content: initialMessage,
      timestamp: new Date(),
    },
  ]);
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

  // Reset messages when simulationId changes
  useEffect(() => {
    setMessages([
      {
        role: "assistant",
        content: initialMessage,
        timestamp: new Date(),
      },
    ]);
  }, [simulationId, initialMessage]);

  async function handleSend() {
    if (!input.trim() || loading) return;

    const userMessage: ChatMessage = {
      role: "user",
      content: input,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    const currentInput = input;
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/engine", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          simulationId,
          message: currentInput,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Error en el engine");
      }

      const data = await res.json();
      
      if (data.success && data.data) {
        // If there's a response (patient interaction), add it to messages
        if (data.data.response) {
          const assistantMessage: ChatMessage = {
            role: "assistant",
            content: data.data.response,
            timestamp: new Date(data.data.timestamp),
          };
          setMessages((prev) => [...prev, assistantMessage]);
        }

        // If there's feedback (diagnosis submitted), notify parent
        if (data.data.feedback) {
          onFeedbackReceived?.(data.data.feedback);
        }
      }
    } catch (err) {
      console.error(err);
      alert(err instanceof Error ? err.message : "Error enviando mensaje");
      // Remove the user message on error
      setMessages((prev) => prev.slice(0, -1));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col h-[600px] border rounded-lg">
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg, idx) => (
          <div
            key={idx}
            className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[70%] rounded-lg p-3 ${
                msg.role === "user"
                  ? "bg-blue-500 text-white"
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

      <div className="border-t p-4">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            placeholder="Escribe tu pregunta al paciente..."
            className="flex-1 border rounded px-3 py-2"
            disabled={loading}
          />
          <button
            onClick={handleSend}
            disabled={loading || !input.trim()}
            className="bg-blue-500 text-white px-4 py-2 rounded disabled:opacity-50"
          >
            Enviar
          </button>
        </div>
      </div>
    </div>
  );
}