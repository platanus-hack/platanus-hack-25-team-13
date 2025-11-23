"use client";

import { useRouter, usePathname } from "next/navigation";
import { FaStethoscope } from "react-icons/fa";
import { useAuth } from "@/hooks/useAuth";

export default function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  const { user } = useAuth();

  const handleLogoClick = () => {
    if (user) {
      router.push("/");
    } else {
      router.push("/landing");
    }
  };

  return (
    <nav className="bg-[#1098f7] px-8 py-4 fixed w-full top-0 z-50 shadow-md">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Logo */}
        <button
          onClick={handleLogoClick}
          className="flex items-center gap-3 hover:opacity-90 transition-opacity"
        >
          <div className="bg-white p-2 rounded-lg">
            <FaStethoscope className="w-6 h-6 text-[#1098f7]" />
          </div>
          <span className="text-2xl font-bold text-white">MediSim</span>
        </button>

        {/* Navigation Links */}
        <div className="flex items-center gap-6">
          <button
            onClick={() => router.push("/landing#features")}
            className="text-white hover:text-[#001c55] font-medium transition-colors"
          >
            Características
          </button>
          <button
            onClick={() => router.push("/landing#about")}
            className="text-white hover:text-[#001c55] font-medium transition-colors"
          >
            Acerca de
          </button>
          <button
            onClick={() => router.push("/login")}
            className="bg-white hover:bg-gray-100 text-[#1098f7] px-6 py-2 rounded-lg font-semibold transition-colors duration-300"
          >
            Iniciar Sesión
          </button>
        </div>
      </div>
    </nav>
  );
}
