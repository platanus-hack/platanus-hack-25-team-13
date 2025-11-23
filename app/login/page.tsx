"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { FaGoogle, FaEnvelope, FaLock, FaStethoscope, FaHeartbeat } from "react-icons/fa";

export default function LoginPage() {
  const { login, signup, loginWithGoogle, loading } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSignup, setIsSignup] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loadingAction, setLoadingAction] = useState(false);
  const [loadingGoogle, setLoadingGoogle] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoadingAction(true);

    try {
      const { error: authError } = isSignup
        ? await signup(email, password)
        : await login(email, password);

      if (authError) {
        setError(authError.message);
      } else {
        router.push("/");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ocurrió un error");
    } finally {
      setLoadingAction(false);
    }
  };

  const handleGoogleLogin = async () => {
    setError(null);
    setLoadingGoogle(true);
    try {
      const { error: authError } = await loginWithGoogle();
      if (authError) {
        setError(authError.message);
        setLoadingGoogle(false);
      }
      // Si no hay error, Supabase redirigirá automáticamente
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ocurrió un error");
      setLoadingGoogle(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-[#1098f7] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-700 text-base font-medium">Cargando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-white p-2">
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 w-full max-w-sm overflow-hidden">
        {/* Header con logo */}
        <div className="bg-gradient-to-r from-[#1098f7] to-[#0d7fd6] p-6 text-center">
          <div className="flex items-center justify-center gap-2 mb-3">
            <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center shadow-md">
              <FaHeartbeat className="w-7 h-7 text-[#1098f7]" />
            </div>
          </div>
          <h1 className="text-2xl font-bold text-white mb-1">
            {isSignup ? "Crear cuenta" : "Bienvenido"}
          </h1>
          <p className="text-white/90 text-xs">
            {isSignup
              ? "Comienza tu simulación médica"
              : "Inicia sesión en Simcito"}
          </p>
        </div>

        <div className="p-6">
          {/* Botón de Google */}
          <button
            onClick={handleGoogleLogin}
            disabled={loadingGoogle || loadingAction}
            className="w-full flex items-center justify-center gap-2 bg-white border-2 border-gray-300 text-gray-700 py-2.5 px-4 rounded-lg hover:bg-gray-50 hover:border-gray-400 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-medium shadow-sm mb-4 text-sm"
          >
            {loadingGoogle ? (
              <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <>
                <FaGoogle className="w-4 h-4 text-red-500" />
                <span>Continuar con Google</span>
              </>
            )}
          </button>

          {/* Divider */}
          <div className="relative mb-4">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300"></div>
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="px-3 bg-white text-gray-500 font-medium">
                O continúa con email
              </span>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="email"
                className="block text-xs font-semibold text-gray-700 mb-1.5"
              >
                Email
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FaEnvelope className="w-4 h-4 text-gray-400" />
                </div>
                <input
                  id="email"
                  type="email"
                  value={email}
                  placeholder="tu@email.com"
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-3 py-2.5 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1098f7] focus:border-[#1098f7] outline-none transition-all text-gray-800 font-medium text-sm"
                  required
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-xs font-semibold text-gray-700 mb-1.5"
              >
                Contraseña
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FaLock className="w-4 h-4 text-gray-400" />
                </div>
                <input
                  id="password"
                  type="password"
                  value={password}
                  placeholder="••••••••"
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-3 py-2.5 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1098f7] focus:border-[#1098f7] outline-none transition-all text-gray-800 font-medium text-sm"
                  required
                />
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border-2 border-red-200 text-red-700 px-3 py-2 rounded-lg text-xs font-medium">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loadingAction || loadingGoogle}
              className="w-full bg-gradient-to-r from-[#1098f7] to-[#0d7fd6] text-white py-2.5 px-4 rounded-lg hover:from-[#0d7fd6] hover:to-[#0b6bb5] disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-semibold text-sm shadow-md hover:shadow-lg"
            >
              {loadingAction ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Procesando...
                </span>
              ) : isSignup ? (
                "Crear cuenta"
              ) : (
                "Iniciar sesión"
              )}
            </button>
          </form>

          {/* Toggle signup/login */}
          <div className="mt-4 text-center">
            <button
              type="button"
              onClick={() => {
                setIsSignup(!isSignup);
                setError(null);
              }}
              className="text-[#1098f7] hover:text-[#0d7fd6] text-xs font-semibold transition-colors"
            >
              {isSignup ? (
                <>
                  ¿Ya tienes cuenta?{" "}
                  <span className="underline">Inicia sesión</span>
                </>
              ) : (
                <>
                  ¿No tienes cuenta?{" "}
                  <span className="underline">Regístrate aquí</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

