"use client";

import { FaHeartbeat } from "react-icons/fa";

export default function LoadingScreen() {
  return (
    <div className="fixed inset-0 bg-white flex items-center justify-center z-50">
      <div className="flex flex-col items-center gap-8">
        {/* Animated pulse circles */}
        <div className="relative">
          <div className="absolute inset-0 rounded-full bg-[#1098f7] opacity-10 animate-ping"></div>
          <div className="absolute inset-0 rounded-full bg-[#1098f7] opacity-20 animate-pulse"></div>
          <div className="relative w-24 h-24 rounded-full bg-gradient-to-br from-[#1098f7] to-[#0d7fd6] flex items-center justify-center shadow-xl border-4 border-[#1098f7] border-opacity-20">
            <FaHeartbeat className="w-12 h-12 text-white animate-pulse" />
          </div>
        </div>

        {/* Loading text with animation */}
        <div className="flex flex-col items-center gap-2">
          <h2 className="text-2xl font-bold text-[#001c55] tracking-wide">
            Generando caso clínico
          </h2>
          <div className="flex gap-1">
            <div className="w-2 h-2 rounded-full bg-[#1098f7] animate-bounce [animation-delay:-0.3s]"></div>
            <div className="w-2 h-2 rounded-full bg-[#1098f7] animate-bounce [animation-delay:-0.15s]"></div>
            <div className="w-2 h-2 rounded-full bg-[#1098f7] animate-bounce"></div>
          </div>
        </div>
      </div>
    </div>
  );
}

