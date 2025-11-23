"use client";

import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { FaUser, FaEnvelope, FaCalendarAlt, FaArrowLeft } from "react-icons/fa";
import ProtectedRoute from "@/components/auth/ProtectedRoute";

export default function PerfilPage() {
  const { user, loading: authLoading } = useAuth();
  // Only pass userId when user is loaded to avoid unnecessary calls
  const userId = authLoading ? undefined : user?.id;
  const { profile, loading: profileLoading } = useProfile(userId);
  const router = useRouter();

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gradient-to-br from-[#ffffff] via-[#f0f8ff] to-[#e6f3ff]">
        <div className="max-w-4xl mx-auto px-6 py-8">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-[#1098f7] hover:text-[#0d7fd6] mb-6 transition-colors"
          >
            <FaArrowLeft className="w-4 h-4" />
            <span>Volver</span>
          </button>

          <div className="bg-white rounded-xl shadow-lg p-8">
            <h1 className="text-3xl font-bold text-gray-800 mb-8">Mi Perfil</h1>

            {authLoading || profileLoading ? (
              <div className="flex items-center justify-center py-12">
                <p className="text-gray-500">Cargando...</p>
              </div>
            ) : (
              <div className="space-y-6">
                {/* User Info Card */}
                <div className="bg-gradient-to-r from-[#1098f7] to-[#0d7fd6] rounded-lg p-6 text-white">
                  <div className="flex items-center gap-4">
                    <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center">
                      <FaUser className="w-10 h-10" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold">
                        {profile?.first_name && profile?.last_name
                          ? `${profile.first_name} ${profile.last_name}`
                          : profile?.first_name || user?.email?.split("@")[0] || "Usuario"}
                      </h2>
                      <p className="text-white/80 text-sm mt-1">
                        {user?.email || "No disponible"}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Details */}
                <div className="grid md:grid-cols-2 gap-6">
                  {profile?.first_name && (
                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="flex items-center gap-3 mb-2">
                        <FaUser className="w-5 h-5 text-[#1098f7]" />
                        <h3 className="font-semibold text-gray-700">Nombre</h3>
                      </div>
                      <p className="text-gray-600">
                        {profile.first_name} {profile.last_name || ""}
                      </p>
                    </div>
                  )}

                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center gap-3 mb-2">
                      <FaEnvelope className="w-5 h-5 text-[#1098f7]" />
                      <h3 className="font-semibold text-gray-700">Email</h3>
                    </div>
                    <p className="text-gray-600">{user?.email || "No disponible"}</p>
                  </div>

                  {(profile as any)?.favorite_category && (
                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="flex items-center gap-3 mb-2">
                        <FaUser className="w-5 h-5 text-[#1098f7]" />
                        <h3 className="font-semibold text-gray-700">Categoría Favorita</h3>
                      </div>
                      <p className="text-gray-600">
                        {(profile as any).favorite_category?.name || "No seleccionada"}
                      </p>
                    </div>
                  )}

                  {profile?.created_at && (
                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="flex items-center gap-3 mb-2">
                        <FaCalendarAlt className="w-5 h-5 text-[#1098f7]" />
                        <h3 className="font-semibold text-gray-700">Miembro desde</h3>
                      </div>
                      <p className="text-gray-600">
                        {new Date(profile.created_at).toLocaleDateString("es-ES", {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        })}
                      </p>
                    </div>
                  )}
                </div>

                {/* Stats or Additional Info */}
                <div className="mt-8 pt-6 border-t border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-700 mb-4">Información de la cuenta</h3>
                  <div className="bg-blue-50 rounded-lg p-4">
                    <p className="text-sm text-gray-600">
                      Esta es tu página de perfil. Aquí podrás ver y gestionar tu información personal
                      y tus simulaciones guardadas.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}

