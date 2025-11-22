"use client";

import { useRouter } from "next/navigation";
import { FaHeartbeat, FaHome, FaBell, FaCog, FaUser, FaStethoscope } from "react-icons/fa";

export default function Header() {
  const router = useRouter();

  return (
    <header className="w-full bg-gradient-to-r from-[#1098f7] via-[#0d7fd6] to-[#1098f7] shadow-lg">
      <div className="max-w-7xl mx-auto px-6 py-4">
        <button
          onClick={() => router.push("/")}
          className="flex items-center gap-3 hover:opacity-80 transition-opacity cursor-pointer"
        >
          <div className="flex items-center justify-center w-10 h-10 bg-white rounded-lg shadow-md">
            <FaHeartbeat className="w-6 h-6 text-[#1098f7] drop-shadow-sm" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold">Simcito</h1>
              <FaStethoscope className="w-4 h-4" />
            </div>
            <p className="text-xs text-white text-opacity-90">
              Tu centro de simulación virtual
            </p>
          </div>
        </button>
      </div>
    </header>
  );
}

