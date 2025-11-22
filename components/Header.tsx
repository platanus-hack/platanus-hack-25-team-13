"use client";

import { useRouter } from "next/navigation";
import { FaHeartbeat, FaStethoscope, FaBell, FaUser, FaCog, FaHome } from "react-icons/fa";

export default function Header() {
  const router = useRouter();

  return (
    <header className="w-full bg-gradient-to-r from-[#1098f7] via-[#0d7fd6] to-[#1098f7] shadow-lg">
      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="flex items-center justify-between gap-3">
          {/* Logo y título */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push("/")}
              className="flex items-center gap-3 hover:opacity-80 transition-opacity"
            >
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
            </button>
          </div>

          {/* Botones del header */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => router.push("/")}
              className="p-2 text-white hover:bg-white hover:bg-opacity-20 rounded-lg transition-colors"
              title="Inicio"
            >
              <FaHome className="w-5 h-5" />
            </button>
            <button
              onClick={() => {
                // Aquí puedes agregar la lógica de notificaciones
                console.log("Notificaciones");
              }}
              className="relative p-2 text-white hover:bg-white hover:bg-opacity-20 rounded-lg transition-colors"
              title="Notificaciones"
            >
              <FaBell className="w-5 h-5" />
              {/* Indicador de notificaciones */}
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
            </button>
            <button
              onClick={() => {
                // Aquí puedes agregar la lógica de configuración
                console.log("Configuración");
              }}
              className="p-2 text-white hover:bg-white hover:bg-opacity-20 rounded-lg transition-colors"
              title="Configuración"
            >
              <FaCog className="w-5 h-5" />
            </button>
            <button
              onClick={() => {
                // Aquí puedes agregar la lógica de perfil
                console.log("Perfil");
              }}
              className="p-2 text-white hover:bg-white hover:bg-opacity-20 rounded-lg transition-colors"
              title="Perfil"
            >
              <FaUser className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}

