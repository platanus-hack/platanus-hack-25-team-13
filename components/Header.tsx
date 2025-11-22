"use client";

import { useRouter, usePathname } from "next/navigation";
import { FaHeartbeat, FaHome, FaCog, FaUser, FaStethoscope } from "react-icons/fa";

export default function Header() {
  const router = useRouter();
  const pathname = usePathname();

  const navItems = [
    { path: "/", label: "Inicio", icon: FaHome },
    { path: "/configuracion", label: "Configuración", icon: FaCog },
    { path: "/perfil", label: "Perfil", icon: FaUser },
  ];

  return (
    <header className="w-full bg-gradient-to-r from-[#1098f7] via-[#0d7fd6] to-[#1098f7] shadow-lg sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-6 py-3">
        <div className="flex items-center justify-between">
          {/* Logo and Brand */}
          <button
            onClick={() => router.push("/")}
            className="flex items-center gap-3 hover:opacity-90 transition-opacity cursor-pointer group"
          >
            <div className="flex items-center justify-center w-12 h-12 bg-white rounded-xl shadow-md group-hover:shadow-lg group-hover:scale-105 transition-all duration-200">
              <FaHeartbeat className="w-7 h-7 text-[#1098f7] drop-shadow-sm" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold text-white drop-shadow-sm">Simcito</h1>
                <FaStethoscope className="w-5 h-5 text-white opacity-90" />
              </div>
              <p className="text-xs text-white text-opacity-90 font-medium">
                Tu centro de simulación virtual
              </p>
            </div>
          </button>

          {/* Navigation */}
          <nav className="hidden md:flex items-center gap-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.path;
              return (
                <button
                  key={item.path}
                  onClick={() => router.push(item.path)}
                  className={`
                    flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm
                    transition-all duration-200
                    ${
                      isActive
                        ? "bg-white text-[#1098f7] shadow-md"
                        : "text-white hover:bg-white/20 hover:shadow-sm"
                    }
                  `}
                >
                  <Icon className={`w-4 h-4 ${isActive ? "text-[#1098f7]" : ""}`} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>
      </div>
    </header>
  );
}

