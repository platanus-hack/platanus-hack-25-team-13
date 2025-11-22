"use client";

import { useState, useRef, useEffect } from "react";
import { FaUser } from "react-icons/fa";
import type { ClinicalCase, ChatMessage } from "@/types/case";

interface ChatBoxProps {
  clinicalCase: ClinicalCase;
  messages: ChatMessage[];
  loading: boolean;
  onMessagesChange?: (messages: ChatMessage[]) => void;
}

export default function ChatBox({ clinicalCase, messages, loading, onMessagesChange }: ChatBoxProps) {
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

  const hasMessages = messages.length > 1 || (messages.length === 1 && messages[0].role === "user");

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-4 relative">
      {!hasMessages && (
        <div className="absolute inset-0 flex items-center justify-center">
          <FaUser className="w-32 h-32 text-[#1098f7] opacity-30" />
        </div>
      )}
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
  );
}


