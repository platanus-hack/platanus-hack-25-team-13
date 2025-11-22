"use client";

import { useState, useRef, useEffect } from "react";
import type { ClinicalCase, ChatMessage } from "@/types/case";

interface ChatBoxProps {
  clinicalCase: ClinicalCase;
  messages: ChatMessage[];
  loading: boolean;
  onMessagesChange?: (messages: ChatMessage[]) => void;
}

export default function ChatBox({ clinicalCase, messages, loading, onMessagesChange }: ChatBoxProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [showTyping, setShowTyping] = useState(false);
  const [displayedText, setDisplayedText] = useState<{ [key: number]: string }>({});
  const processedMessagesRef = useRef<Set<number>>(new Set());

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, displayedText]);

  useEffect(() => {
    onMessagesChange?.(messages);
  }, [messages, onMessagesChange]);

  useEffect(() => {
    if (messages.length === 0) {
      setShowTyping(true);
    } else {
      setShowTyping(false);
    }
  }, [messages.length]);

  useEffect(() => {
    const intervals: NodeJS.Timeout[] = [];
    
    messages.forEach((msg, idx) => {
      if (msg.role === "assistant" && !processedMessagesRef.current.has(idx) && msg.content) {
        processedMessagesRef.current.add(idx);
        const fullText = msg.content;
        let currentIndex = 0;
        setDisplayedText((prev) => ({ ...prev, [idx]: "" }));

        const typeInterval = setInterval(() => {
          if (currentIndex < fullText.length) {
            currentIndex++;
            setDisplayedText((prev) => ({
              ...prev,
              [idx]: fullText.substring(0, currentIndex),
            }));
          } else {
            clearInterval(typeInterval);
          }
        }, 20);
        
        intervals.push(typeInterval);
      }
    });
    
    return () => {
      intervals.forEach(interval => clearInterval(interval));
    };
  }, [messages]);

  const hasMessages = messages.length > 1 || (messages.length === 1 && messages[0].role === "user");

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-4 relative">
      {showTyping && messages.length === 0 && (
        <div className="flex justify-start">
          <div className="bg-gray-200 text-gray-800 max-w-[70%] rounded-lg p-3">
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 bg-gray-600 rounded-full animate-bounce" style={{ animationDelay: "0ms" }}></div>
              <div className="w-2 h-2 bg-gray-600 rounded-full animate-bounce" style={{ animationDelay: "150ms" }}></div>
              <div className="w-2 h-2 bg-gray-600 rounded-full animate-bounce" style={{ animationDelay: "300ms" }}></div>
            </div>
          </div>
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
            <p className="text-sm">
              {msg.role === "assistant" && displayedText[idx] !== undefined
                ? displayedText[idx] || msg.content
                : msg.content}
              {msg.role === "assistant" && displayedText[idx] && displayedText[idx].length < msg.content.length && (
                <span className="animate-pulse">|</span>
              )}
            </p>
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


