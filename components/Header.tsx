"use client";

import { FaHeartbeat, FaStethoscope } from "react-icons/fa";

export default function Header() {
  return (
    <header className="w-full bg-gradient-to-r from-[#1098f7] via-[#0d7fd6] to-[#1098f7] shadow-lg">
      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-10 h-10 bg-white rounded-lg shadow-md">
            <FaHeartbeat className="w-6 h-6 text-[#1098f7] drop-shadow-sm" />
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-white tracking-tight">
                Simcito
              </h1>
              <FaStethoscope className="w-4 h-4 text-white opacity-80" />
            </div>
            <p className="text-xs text-white text-opacity-90 font-medium">
              Tu centro de simulación virtual
            </p>
          </div>
        </div>
      </div>
    </header>
  );
}

