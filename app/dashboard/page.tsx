"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { FaStethoscope, FaClock, FaCheckCircle, FaTimesCircle, FaUser, FaArrowRight, FaMicrophone } from "react-icons/fa";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Dot } from "recharts";
import LoadingScreen from "../../components/utils/LoadingScreen";
import ProtectedRoute from "../../components/auth/ProtectedRoute";
import { useAuth } from "@/hooks/useAuth";
import { useAnamnesis, Anamnesis } from "@/hooks/useAnamnesis";
import { useUserStats } from "@/hooks/useUserStats";
import { useProfile } from "@/hooks/useProfile";
import { supabase } from "@/lib/supabase";

export default function Home() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  // Only pass userId when user is loaded to avoid unnecessary calls
  const userId = authLoading ? undefined : user?.id;
  const { profile, loading: profileLoading } = useProfile(userId);
  const { getUserAnamnesis } = useAnamnesis();
  const [isLoading, setIsLoading] = useState(false);
  const [showConfig, setShowConfig] = useState(false);
  const [especialidad, setEspecialidad] = useState<"aps" | "urgencia" | "hospitalizacion" | "otro">("aps");
  const [nivelDificultad, setNivelDificultad] = useState<"facil" | "medio" | "dificil">("medio");
  const [generatingCase, setGeneratingCase] = useState(false);
  const [anamnesis, setAnamnesis] = useState<Anamnesis[]>([]);
  const [loadingAnamnesis, setLoadingAnamnesis] = useState(true);
  const isDev = process.env.NEXT_PUBLIC_DEV === "true";

  const stats = useUserStats(anamnesis);

  // Cargar anamnesis del usuario
  useEffect(() => {
    if (user?.id) {
      const loadAnamnesis = async () => {
        setLoadingAnamnesis(true);
        try {
          const data = await getUserAnamnesis(user.id);
          setAnamnesis(data);
        } catch (error) {
          console.error("Error loading anamnesis:", error);
        } finally {
          setLoadingAnamnesis(false);
        }
      };
      loadAnamnesis();
    } else {
      setAnamnesis([]);
      setLoadingAnamnesis(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  const handleStartSimulation = () => {
    setShowConfig(true);
  };

  const handleGenerateCase = async () => {
    setIsLoading(true);
    setGeneratingCase(true);
    try {
      // Get auth token for authenticated requests
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      const headers: HeadersInit = { "Content-Type": "application/json" };
      
      if (sessionError) {
        console.error("Error getting session:", sessionError);
      }
      
      if (session?.access_token) {
        headers["Authorization"] = `Bearer ${session.access_token}`;
        console.log("Sending request with auth token, user_id:", user?.id);
      } else {
        console.warn("No session token available, user_id:", user?.id);
      }

      const res = await fetch("/api/generar-caso", {
        method: "POST",
        headers,
        body: JSON.stringify({
          especialidad,
          nivel_dificultad: nivelDificultad,
          user_id: user?.id, // Include user_id as fallback
        }),
      });
      if (!res.ok) throw new Error("Error en la API");

      const data = await res.json();
      if (data?.success && data?.data) {
        // Guardar el caso en sessionStorage y navegar a anamnesis
        sessionStorage.setItem("generatedCase", JSON.stringify({
          ...data.data,
          startTime: new Date().toISOString(), // Guardar tiempo de inicio
        }));
        // If publicId is returned, log it for sharing
        if (data.data.publicId) {
          console.log("Caso guardado con public_id:", data.data.publicId);
        }
        if (data.data.anamnesisId) {
          console.log("Caso guardado con anamnesisId:", data.data.anamnesisId);
        }
        router.push("/anamnesis");
      } else {
        throw new Error("No se pudo generar el caso");
      }
    } catch (e) {
      console.error(e);
      alert("Error generando caso");
      setIsLoading(false);
      setGeneratingCase(false);
    }
  };

  const handleDevCase = () => {
    // Create mock case data
    const mockCase = {
      simulationId: "dev-case-" + Date.now(),
      initialMessage: "Hola, me siento mal. Tengo dolor de cabeza y mareos.",
      patientInfo: {
        edad: 65,
        sexo: "masculino",
        ocupacion: "Jubilado",
        contexto_ingreso: "Paciente llega al servicio de urgencias con dolor de cabeza y mareos.",
      },
      "simulation-debug": {
        clinicalCase: {
          id: "dev-1",
          especialidad: "urgencia",
          nivel_dificultad: "medio",
          motivo_consulta: "Paciente de 65 años que acude a consulta por dolor de cabeza de inicio súbito hace 2 horas, acompañado de mareos y visión borrosa. Refiere antecedente de hipertensión arterial en tratamiento.",
          sintomas: {
            descripcion_general: "Dolor de cabeza intenso, mareos, visión borrosa",
            detalle: ["Dolor de cabeza", "Mareos", "Visión borrosa"],
          },
          antecedentes: {
            personales: ["Hipertensión arterial desde hace 5 años"],
            familiares: ["Padre con hipertensión"],
            farmacos: ["Losartán 50mg diario"],
            alergias: [],
          },
          examen_fisico: {
            signos_vitales: {
              temperatura: 36.5,
              frecuencia_cardiaca: 90,
              presion_arterial: "180/110",
              frecuencia_respiratoria: 20,
              saturacion_o2: 98,
            },
            hallazgos_relevantes: [],
          },
          examenes: {},
          diagnostico_principal: "Crisis hipertensiva",
          diagnosticos_diferenciales: ["Accidente cerebrovascular", "Migraña"],
          info_oculta: [],
          info_prohibida: [],
        },
      },
    };

    sessionStorage.setItem("generatedCase", JSON.stringify(mockCase));
    router.push("/anamnesis");
  };

  // Convertir anamnesis a formato de historial
  const historialSimulaciones = anamnesis.map((a) => {
    // Usar calificacion de la BD si existe, sino calcular desde feedback_data
    const promedio = a.calificacion ?? (a.feedback_data?.puntajes
      ? Object.values(a.feedback_data.puntajes).reduce((acc: number, val: number) => acc + val, 0) /
        Object.values(a.feedback_data.puntajes).length
      : 0);
    const nota = Math.round(promedio * 10) / 10;
    const resultado = a.feedback_data?.diagnostico?.correcto ? "correcto" : "incorrecto";
    const fecha = a.created_at
      ? new Date(a.created_at).toLocaleDateString("es-ES", {
          day: "numeric",
          month: "short",
          year: "numeric",
        })
      : "Fecha no disponible";

    // Calcular duración en formato legible
    let duracion = "N/A";
    if (a.tiempo_demora) {
      const minutos = Math.floor(a.tiempo_demora / 60);
      const segundos = a.tiempo_demora % 60;
      if (minutos > 0) {
        duracion = `${minutos}m ${segundos}s`;
      } else {
        duracion = `${segundos}s`;
      }
    }

    // Usar diagnostico_final como título si existe, sino usar title o default
    const caso = a.diagnostico_final || a.title || `Caso Clínico #${a.id}`;

    return {
      id: a.id,
      fecha,
      caso,
      duracion,
      resultado,
      puntuacion: promedio,
      nota,
      anamnesis: a,
    };
  });

  // Redirect to login only if user is not authenticated
  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        router.push("/login");
      }
    }
  }, [user, authLoading, router]);

  // Show loading while checking auth
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#ffffff] via-[#f0f8ff] to-[#e6f3ff]">
        <p className="text-gray-700">Cargando...</p>
      </div>
    );
  }

  // Don't render content if not authenticated (redirect will happen in useEffect)
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#ffffff] via-[#f0f8ff] to-[#e6f3ff]">
        <p className="text-gray-700">Redirigiendo...</p>
      </div>
    );
  }

  return (
    <ProtectedRoute>
      {isLoading && <LoadingScreen />}
      <div className="h-[85vh] font-sans overflow-hidden flex flex-col">
      <main className="flex-1 overflow-hidden min-h-0">
        <div className="h-full max-w-7xl mx-auto px-2 py-1.5 flex flex-col">
          {/* Saludo de Bienvenida */}
          <div className="mb-1.5 flex-shrink-0">
            <h1 className="text-xl font-bold text-[#001c55]">
              ¡Bienvenido de vuelta! 👋
          </h1>
          </div>

          {/* Grid 2x2 */}
          <div className="flex-1 grid grid-cols-2 grid-rows-2 gap-1.5 min-h-0">
            {/* Fila 1 - Columna 1: Botón Iniciar Simulación o Configuración */}
            {!showConfig ? (
              <button
                onClick={handleStartSimulation}
                className="bg-gradient-to-br from-[#1098f7] to-[#0d7fd6] rounded-lg shadow-md hover:shadow-lg hover:scale-[1.02] hover:from-[#0e85e0] hover:to-[#0c7cc5] transition-all duration-300 flex flex-col items-center justify-center gap-2 p-3 group min-h-0 active:scale-[0.98]"
              >
                <FaStethoscope className="w-12 h-12 text-white drop-shadow-lg group-hover:scale-105 transition-transform duration-300" />
                <div className="text-center">
                  <h2 className="text-lg font-bold text-white group-hover:scale-[1.02] transition-transform duration-300">
                    Iniciar Simulación
                  </h2>
                </div>
              </button>
            ) : (
              <div className="bg-white rounded-lg shadow-md border-[0.5px] border-[#1098f7] border-opacity-20 flex flex-col p-3 min-h-0 overflow-hidden">
                <div className="mb-3 flex-shrink-0">
                  <h3 className="text-base font-bold text-[#001c55] mb-2">
                    Configuración del Caso
                  </h3>
                </div>
                <div className="flex-1 flex flex-col gap-2 min-h-0 overflow-y-auto">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Nivel de Atención
                    </label>
                    <select
                      value={especialidad}
                      onChange={(e) => setEspecialidad(e.target.value as typeof especialidad)}
                      className="w-full border border-gray-300 rounded-lg px-2 py-1.5 text-sm text-black focus:outline-none focus:border-[#1098f7] focus:ring-1 focus:ring-[#1098f7]"
                    >
                      <option value="aps">🏥 APS (CESFAM) - con RAG 🤖</option>
                      <option value="urgencia">🚨 Urgencia (Servicio de Urgencias)</option>
                      <option value="hospitalizacion">🏨 Hospitalización (Medicina Interna)</option>
                      <option value="otro">🔧 Otro (Pediatría / Especialidades)</option>
                    </select>
                    {especialidad === "aps" && (
                      <p className="text-[10px] text-green-600 mt-0.5">
                        ✨ Usando RAG con guías clínicas chilenas
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Nivel de Dificultad
                    </label>
                    <select
                      value={nivelDificultad}
                      onChange={(e) => setNivelDificultad(e.target.value as typeof nivelDificultad)}
                      className="w-full border border-gray-300 rounded-lg px-2 py-1.5 text-sm text-black focus:outline-none focus:border-[#1098f7] focus:ring-1 focus:ring-[#1098f7]"
                    >
                      <option value="facil">Fácil</option>
                      <option value="medio">Medio</option>
                      <option value="dificil">Difícil</option>
                    </select>
                  </div>

                  <button
                    onClick={handleGenerateCase}
                    disabled={generatingCase}
                    className="mt-2 bg-[#1098f7] text-white px-4 py-2 rounded-lg disabled:opacity-50 hover:bg-[#0d7fd6] transition-colors text-sm font-medium flex items-center justify-center gap-2"
                  >
                    {generatingCase ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        Generando caso...
                      </>
                    ) : (
                      <>
                        <FaStethoscope className="w-3 h-3" />
                        Comenzar a generar el caso clínico
                      </>
                    )}
                  </button>

                  <button
                    onClick={() => router.push("/voice-agent")}
                    className="mt-2 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 hover:scale-[1.02] active:scale-[0.98] transition-all text-sm font-medium flex items-center justify-center gap-2 shadow-md hover:shadow-lg"
                  >
                    <FaMicrophone className="w-3 h-3" />
                    Prueba la versión con voz
                  </button>

                  {isDev && (
                    <button
                      onClick={handleDevCase}
                      className="mt-2 bg-yellow-500 text-white px-4 py-2 rounded-lg hover:bg-yellow-600 transition-colors text-sm font-medium flex items-center justify-center gap-2"
                    >
                      Dev: Caso Dev
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Fila 1 - Columna 2: Perfil de Usuario */}
            <div className="bg-white rounded-lg shadow-md border-[0.5px] border-[#1098f7] border-opacity-20 flex flex-col overflow-hidden min-h-0">
              <div className="p-2 border-b-[0.5px] border-[#1098f7] border-opacity-20 flex-shrink-0">
                <h3 className="text-base font-bold text-[#001c55]">
                  Perfil de Usuario
                </h3>
              </div>
              <div className="flex-1 flex flex-col gap-1.5 p-2 min-h-0 overflow-hidden">
                {profileLoading || loadingAnamnesis ? (
                  <div className="flex items-center justify-center flex-1">
                    <p className="text-sm text-[#001c55] text-opacity-60">Cargando...</p>
                  </div>
                ) : (
                  <>
                    <div className="flex-shrink-0 space-y-1">
                      <h4 className="text-lg font-bold text-[#001c55] mb-1">
                        {profile?.first_name && profile?.last_name
                          ? `${profile.first_name} ${profile.last_name}`
                          : profile?.first_name || user?.email?.split("@")[0] || "Usuario"}
                      </h4>
                      {profile?.favorite_category_id && (profile as any)?.favorite_category?.name && (
                        <div className="text-xs text-[#001c55] text-opacity-70">
                          <span className="font-medium">Categoría favorita:</span> {(profile as any).favorite_category.name}
                        </div>
                      )}
                      {!profile?.first_name && !profile?.last_name && (
                        <div className="text-xs text-[#001c55] text-opacity-60 italic">
                          Completa tu perfil para ver más información
                        </div>
                      )}
                    </div>
                    <div className="grid grid-cols-2 gap-1.5 flex-shrink-0">
                      <div className="p-1 bg-[#f0f8ff] rounded">
                        <div className="text-xs text-[#001c55] text-opacity-60 mb-0.5">
                          Promedio
                        </div>
                        <div className="text-base font-bold text-[#1098f7]">
                          {stats.promedioNota > 0 ? stats.promedioNota.toFixed(1) : "N/A"}
                        </div>
                      </div>
                      <div className="p-1 bg-[#f0f8ff] rounded">
                        <div className="text-xs text-[#001c55] text-opacity-60 mb-0.5">
                          Correctos
                        </div>
                        <div className="text-base font-bold text-[#1098f7]">
                          {stats.correctos}
                        </div>
                      </div>
                    </div>
                    {stats.categoriaFavorita && (
                      <div className="p-1 bg-[#f0f8ff] rounded flex-shrink-0">
                        <div className="text-xs text-[#001c55] text-opacity-60 mb-0.5">
                          Categoría favorita
                        </div>
                        <div className="text-sm font-bold text-[#1098f7]">
                          {stats.categoriaFavorita}
                        </div>
                      </div>
                    )}
                    <div className="p-1 bg-[#f0f8ff] rounded flex-shrink-0">
                      <div className="text-xs text-[#001c55] text-opacity-70 mb-0.5">
                        Última simulación
                      </div>
                      {stats.ultimaSimulacion ? (
                        <>
                          <div className="text-xs font-semibold text-[#001c55] mb-0.5">
                            {stats.ultimaSimulacion}
                          </div>
                          <div className="flex items-center gap-1">
                            {stats.ultimaSimulacionResultado === "correcto" ? (
                              <>
                                <FaCheckCircle className="w-3 h-3 text-green-500" />
                                <span className="text-xs font-bold text-green-600">Correcto</span>
                              </>
                            ) : stats.ultimaSimulacionResultado === "incorrecto" ? (
                              <>
                                <FaTimesCircle className="w-3 h-3 text-red-500" />
                                <span className="text-xs font-bold text-red-600">Incorrecto</span>
                              </>
                            ) : (
                              <span className="text-xs text-[#001c55] text-opacity-60">Sin resultado</span>
                            )}
                          </div>
                        </>
                      ) : (
                        <div className="text-sm font-bold text-[#1098f7] mt-0.5">
                          N/A
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Fila 2 - Columna 1: Gráfico de Desempeño */}
            <div className="bg-white rounded-lg shadow-md border-[0.5px] border-[#1098f7] border-opacity-20 flex flex-col overflow-hidden min-h-0">
              <div className="p-2 border-b-[0.5px] border-[#1098f7] border-opacity-20 flex-shrink-0">
                <h3 className="text-base font-bold text-[#001c55]">
                  Desempeño Semanal
                </h3>
              </div>
              <div className="flex-1 flex flex-col justify-between p-2 min-h-0">
                {/* Gráfico de líneas con recharts */}
                <div className="flex-1 mb-2 min-h-0 relative">
                  {stats.totalSimulaciones === 0 ? (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <p className="text-sm text-[#001c55] text-opacity-50">
                        No hay datos aún
                      </p>
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={stats.datosDesempeno}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                        <XAxis
                          dataKey="dia"
                          tick={{ fontSize: 11, fill: "#001c55" }}
                          stroke="#1098f7"
                        />
                        <YAxis
                          domain={[1, 7]}
                          tick={{ fontSize: 11, fill: "#001c55" }}
                          stroke="#1098f7"
                          label={{ value: 'Nota', angle: -90, position: 'insideLeft', style: { fontSize: 10, fill: '#001c55' } }}
                        />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "#fff",
                            border: "1px solid #1098f7",
                            borderRadius: "8px",
                            fontSize: "12px"
                          }}
                          formatter={(value: number) => {
                            if (value === 0) return ['Sin datos', 'Nota'];
                            return [value.toFixed(1), 'Nota'];
                          }}
                          labelFormatter={(label) => `${label}`}
                        />
                        <Line
                          type="monotone"
                          dataKey="valor"
                          stroke="#1098f7"
                          strokeWidth={2}
                          dot={(props: any) => {
                            const { cx, cy, payload } = props;
                            // No mostrar punto si el valor es 0
                            if (payload.valor === 0) return null;
                            return (
                              <circle
                                cx={cx}
                                cy={cy}
                                r={4}
                                fill="#1098f7"
                                stroke="#fff"
                                strokeWidth={2}
                              />
                            );
                          }}
                          activeDot={{ r: 6 }}
                          connectNulls={false}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  )}
                </div>

                {/* Estadísticas resumidas */}
                <div className="grid grid-cols-3 gap-2 pt-2 border-t-[0.5px] border-[#1098f7] border-opacity-20 flex-shrink-0">
                  <div className="text-center">
                    <div className="text-lg font-bold text-[#1098f7]">
                      {stats.totalSimulaciones}
                    </div>
                    <div className="text-xs text-[#001c55] text-opacity-60">
                      Simulaciones
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-bold text-[#1098f7]">
                      {stats.promedioNota > 0 ? stats.promedioNota.toFixed(1) : "N/A"}
                    </div>
                    <div className="text-xs text-[#001c55] text-opacity-60">
                      Promedio
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-bold text-[#1098f7]">
                      {stats.correctos}
                    </div>
                    <div className="text-xs text-[#001c55] text-opacity-60">
                      Correctos
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Fila 2 - Columna 2: Últimos Casos Clínicos */}
            <div className="bg-white rounded-lg shadow-md border-[0.5px] border-[#1098f7] border-opacity-20 flex flex-col overflow-hidden min-h-0">
              <div className="p-2 border-b-[0.5px] border-[#1098f7] border-opacity-20 flex-shrink-0">
                <h3 className="text-xl font-bold text-[#001c55]">
                  Últimos Casos Clínicos
                </h3>
              </div>
              <div className="flex-1 overflow-y-auto p-1.5 space-y-1.5 min-h-0">
                {loadingAnamnesis ? (
                  <div className="flex items-center justify-center py-8">
                    <p className="text-sm text-[#001c55] text-opacity-60">Cargando simulaciones...</p>
                  </div>
                ) : historialSimulaciones.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-8 text-center">
                    <FaStethoscope className="w-12 h-12 text-[#1098f7] opacity-30 mb-2" />
                    <p className="text-sm text-[#001c55] text-opacity-60">
                      No tienes simulaciones aún
                    </p>
                    <p className="text-xs text-[#001c55] text-opacity-50 mt-1">
                      Comienza una nueva simulación para ver tu historial aquí
                    </p>
                  </div>
                ) : (
                  historialSimulaciones.map((simulacion) => (
                    <div
                      key={simulacion.id}
                      className="p-1.5 bg-[#f0f8ff] rounded border-[0.5px] border-[#1098f7] border-opacity-20 hover:border-opacity-40 transition-all"
                    >
                      <div className="flex items-start justify-between gap-1.5 mb-1">
                        <div className="flex items-center gap-1.5 flex-1 min-w-0">
                          {simulacion.resultado === "correcto" ? (
                            <FaCheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                          ) : (
                            <FaTimesCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
                          )}
                          <span className="font-semibold text-[#001c55] text-sm truncate">
                            {simulacion.caso}
                          </span>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <div className="text-lg font-bold text-[#1098f7]">
                            {simulacion.nota > 0 ? simulacion.nota.toFixed(1) : "N/A"}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 text-xs text-[#001c55] text-opacity-60">
                          <span className="flex items-center gap-0.5">
                            <FaClock className="w-2 h-2" />
                            {simulacion.duracion}
                          </span>
                          <span>{simulacion.fecha}</span>
                        </div>
                        <button
                          onClick={() => {
                            // Guardar anamnesis en sessionStorage para cargar en la página de anamnesis
                            if (simulacion.anamnesis) {
                              sessionStorage.setItem(
                                "generatedCase",
                                JSON.stringify({
                                  anamnesisId: simulacion.anamnesis.id,
                                  ...simulacion.anamnesis,
                                })
                              );
                            }
                            router.push(`/anamnesis?id=${simulacion.id}`);
                          }}
                          className="flex items-center gap-1 text-[#1098f7] hover:text-[#0d7fd6] text-[10px] font-medium hover:underline transition-all duration-200"
                        >
                          Revisar
                          <FaArrowRight className="w-2.5 h-2.5" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
    </ProtectedRoute>
  );
}
