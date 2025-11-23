"use client";

import { useRouter, usePathname } from "next/navigation";
import { FaStethoscope, FaHome, FaUser, FaSignOutAlt, FaSignInAlt } from "react-icons/fa";
import { useAuth } from "@/hooks/useAuth";

export default function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  const { user, loading, logout } = useAuth();

  const handleLogoClick = () => {
    router.push("/");
  };

  const handleLogout = async () => {
    await logout();
    router.push("/landing");
  };

  return (
    <nav className="bg-gradient-to-r from-[#1098f7] via-[#0d7fd6] to-[#1098f7] px-6 md:px-8 py-3 md:py-4 fixed w-full top-0 z-50 shadow-lg backdrop-blur-sm bg-opacity-95">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Logo */}
        <button
          onClick={handleLogoClick}
          className="flex items-center gap-3 hover:opacity-90 transition-all duration-200 group cursor-pointer"
        >
          <div className="bg-white p-2.5 rounded-xl shadow-md group-hover:shadow-lg group-hover:scale-105 transition-all duration-200">
            <FaStethoscope className="w-6 h-6 text-[#1098f7]" />
          </div>
          <div className="flex flex-col">
            <span className="text-2xl font-bold text-white drop-shadow-sm">MedSim</span>
            <span className="text-xs text-white/80 font-medium hidden sm:block">Simulación Médica</span>
          </div>
        </button>

        {/* Navigation Links */}
        <div className="flex items-center gap-3 md:gap-6">
          {!user ? (
            <>
              <button
                onClick={() => router.push("/landing#features")}
                className="hidden md:block text-white hover:text-[#001c55] font-medium transition-colors duration-200 hover:bg-white/10 px-3 py-2 rounded-lg cursor-pointer"
              >
                Características
              </button>
              <button
                onClick={() => router.push("/landing#about")}
                className="hidden md:block text-white hover:text-[#001c55] font-medium transition-colors duration-200 hover:bg-white/10 px-3 py-2 rounded-lg cursor-pointer"
              >
                Acerca de
              </button>
              <button
                onClick={() => router.push("/login")}
                className="bg-white hover:bg-gray-50 text-[#1098f7] px-4 md:px-6 py-2 rounded-lg font-semibold transition-all duration-200 shadow-md hover:shadow-lg flex items-center gap-2 cursor-pointer"
              >
                <FaSignInAlt className="w-4 h-4" />
                <span className="hidden sm:inline">Iniciar Sesión</span>
                <span className="sm:hidden">Entrar</span>
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => router.push("/dashboard")}
                className={`flex items-center gap-2 px-3 md:px-4 py-2 rounded-lg font-medium text-sm transition-all duration-200 cursor-pointer ${
                  pathname === "/dashboard"
                    ? "bg-white text-[#1098f7] shadow-md"
                    : "text-white hover:bg-white/20"
                }`}
              >
                <FaHome className="w-4 h-4" />
                <span className="hidden md:inline">Inicio</span>
              </button>
              <button
                onClick={() => router.push("/perfil")}
                className={`flex items-center gap-2 px-3 md:px-4 py-2 rounded-lg font-medium text-sm transition-all duration-200 cursor-pointer ${
                  pathname === "/perfil"
                    ? "bg-white text-[#1098f7] shadow-md"
                    : "text-white hover:bg-white/20"
                }`}
              >
                <FaUser className="w-4 h-4" />
                <span className="hidden md:inline">{user.email?.split("@")[0] || "Perfil"}</span>
                <span className="md:hidden">Perfil</span>
              </button>
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-3 md:px-4 py-2 rounded-lg font-medium text-sm text-white hover:bg-white/20 transition-all duration-200 cursor-pointer"
              >
                <FaSignOutAlt className="w-4 h-4" />
                <span className="hidden md:inline">Salir</span>
              </button>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
