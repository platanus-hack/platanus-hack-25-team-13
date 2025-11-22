"use client";

import { useRouter } from "next/navigation";
import { FaHeartbeat, FaHome, FaBell, FaCog, FaUser } from "react-icons/fa";

export default function Header() {
  const router = useRouter();

  return (
    <header className="bg-gradient-to-r from-[#1098f7] to-[#0d7fd6] text-white shadow-md flex-shrink-0">
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
        <button
          onClick={() => router.push("/")}
          className="flex items-center gap-3 hover:opacity-80 transition-opacity duration-200 bg-transparent border-none cursor-pointer text-left"
        >
          <div className="w-10 h-10 bg-white rounded flex items-center justify-center">
            <FaHeartbeat className="w-6 h-6 text-[#1098f7]" />
          </div>
          <div>
            <h1 className="text-xl font-bold">Simcito</h1>
            <p className="text-xs text-white text-opacity-90">
              Tu centro de simulación virtual
            </p>
          </div>
        </button>
        <nav className="flex items-center gap-2">
          <button
            onClick={() => router.push("/")}
            className="p-2 rounded-lg hover:bg-white hover:bg-opacity-20 transition-colors duration-200"
            title="Inicio"
          >
            <FaHome className="w-5 h-5" />
          </button>
          <button
            className="p-2 rounded-lg hover:bg-white hover:bg-opacity-20 transition-colors duration-200"
            title="Notificaciones"
          >
            <FaBell className="w-5 h-5" />
          </button>
          <button
            className="p-2 rounded-lg hover:bg-white hover:bg-opacity-20 transition-colors duration-200"
            title="Configuración"
          >
            <FaCog className="w-5 h-5" />
          </button>
          <button
            className="p-2 rounded-lg hover:bg-white hover:bg-opacity-20 transition-colors duration-200"
            title="Perfil"
          >
            <FaUser className="w-5 h-5" />
          </button>
        </nav>
      </div>
    </header>
  );
}

