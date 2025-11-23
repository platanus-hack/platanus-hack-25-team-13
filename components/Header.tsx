"use client";

import { useRouter, usePathname } from "next/navigation";
import { FaHeartbeat, FaHome, FaCog, FaUser, FaStethoscope, FaSignInAlt, FaSignOutAlt } from "react-icons/fa";
import { useAuth } from "@/hooks/useAuth";

export default function Header() {
  const router = useRouter();
  const pathname = usePathname();
  const { user, loading, logout } = useAuth();

  const navItems = [
    { path: "/", label: "Inicio", icon: FaHome },
    { path: "/configuracion", label: "Configuración", icon: FaCog },
  ];

  const handleLogout = async () => {
    await logout();
    router.push("/");
  };

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

            {/* Auth Section */}
            {!loading && (
              <>
                {user ? (
                  <>
                    <button
                      onClick={() => router.push("/perfil")}
                      className={`
                        flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm
                        transition-all duration-200
                        ${
                          pathname === "/perfil"
                            ? "bg-white text-[#1098f7] shadow-md"
                            : "text-white hover:bg-white/20 hover:shadow-sm"
                        }
                      `}
                    >
                      <FaUser className="w-4 h-4" />
                      <span>{user.email?.split("@")[0] || "Perfil"}</span>
                    </button>
                    <button
                      onClick={handleLogout}
                      className="flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm text-white hover:bg-white/20 hover:shadow-sm transition-all duration-200"
                    >
                      <FaSignOutAlt className="w-4 h-4" />
                      <span>Salir</span>
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => router.push("/login")}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm bg-white text-[#1098f7] hover:bg-blue-50 shadow-md hover:shadow-lg transition-all duration-200"
                  >
                    <FaSignInAlt className="w-4 h-4" />
                    <span>Iniciar sesión</span>
                  </button>
                )}
              </>
            )}
          </nav>

          {/* Mobile Auth Button */}
          <div className="md:hidden">
            {!loading && (
              <>
                {user ? (
                  <button
                    onClick={() => router.push("/perfil")}
                    className="text-white hover:opacity-80 transition-opacity"
                  >
                    <FaUser className="w-5 h-5" />
                  </button>
                ) : (
                  <button
                    onClick={() => router.push("/login")}
                    className="text-white hover:opacity-80 transition-opacity"
                  >
                    <FaSignInAlt className="w-5 h-5" />
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}

