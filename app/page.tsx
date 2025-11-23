"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { FaStethoscope, FaGraduationCap, FaChartLine, FaUserMd } from "react-icons/fa";

export default function LandingPage() {
  const router = useRouter();
  const [nivelAtencion, setNivelAtencion] = useState<"aps" | "urgencia" | "hospitalizacion" | "">("");
  const [dificultad, setDificultad] = useState<"facil" | "medio" | "dificil" | "">("");
  const [isLoading, setIsLoading] = useState(false);

  const handleComenzarSimulacion = async () => {
    if (!nivelAtencion) return;

    setIsLoading(true);
    try {
      const res = await fetch("/api/generar-caso", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          especialidad: nivelAtencion,
          nivel_dificultad: "medio", // Siempre enviar dificultad media
        }),
      });

      if (!res.ok) throw new Error("Error en la API");

      const data = await res.json();
      if (data?.success && data?.data) {
        // Guardar el caso en sessionStorage y navegar a anamnesis
        sessionStorage.setItem("generatedCase", JSON.stringify(data.data));
        router.push("/anamnesis");
      } else {
        throw new Error("No se pudo generar el caso");
      }
    } catch (e) {
      console.error(e);
      alert("Error generando caso. Por favor intenta de nuevo.");
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section - Full Screen */}
      <section className="min-h-screen bg-white pb-7 mb-[-2rem] px-8 flex items-center">
        <div className="max-w-6xl mx-auto w-full">
          {/* Hero Content */}
          <div className="text-center mb-16">
            <h1 className="text-6xl font-bold text-[#001c55] mb-6 leading-tight">
              Practica medicina con
              <span className="block text-[#1098f7]">
                pacientes virtuales
              </span>
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
              Perfecciona tus habilidades clínicas con simulaciones realistas basadas en guías clínicas chilenas
            </p>
          </div>

          {/* Selector de Especialidad - Centro de la pantalla */}
          <div className="max-w-xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-4xl font-bold text-[#001c55] mb-3">
                Comienza tu simulación
              </h2>
            </div>

            <div className="space-y-6">
              {/* Dropdown de Especialidad */}
              <div className="transform transition-all duration-500">
                <label className="block text-sm font-semibold text-[#001c55] mb-3">
                  Selecciona la especialidad
                </label>
                <select
                  value={nivelAtencion}
                  onChange={(e) => setNivelAtencion(e.target.value as typeof nivelAtencion)}
                  className="w-full px-4 py-4 text-lg border-2 border-gray-200 rounded-xl bg-white text-[#001c55] font-medium focus:outline-none focus:border-[#1098f7] transition-colors cursor-pointer hover:border-[#1098f7]"
                >
                  <option value="">Selecciona una opción...</option>
                  <option value="aps">🏥 APS (CESFAM)</option>
                  <option value="urgencia">🚨 Urgencia</option>
                  <option value="hospitalizacion">🏨 Hospitalización</option>
                </select>
                {nivelAtencion === "aps" && (
                  <p className="text-xs text-green-600 font-medium mt-2 animate-fade-in">
                    ✨ Casos generados con RAG usando guías clínicas chilenas
                  </p>
                )}
              </div>

              {/* Botón de Comenzar - Siempre visible */}
              <div className="pt-4 pb-12">
                <button
                  onClick={handleComenzarSimulacion}
                  disabled={!nivelAtencion || isLoading}
                  className={`w-full py-4 rounded-xl font-bold text-lg transition-all duration-200 flex items-center justify-center gap-3 ${
                    !nivelAtencion || isLoading
                      ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                      : "bg-[#1098f7] hover:bg-[#0d7fd6] hover:scale-[1.02] active:scale-[0.98] text-white cursor-pointer"
                  }`}
                >
                  {isLoading ? (
                    <>
                      <div className="w-6 h-6 border-3 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span className="text-white">Generando caso...</span>
                    </>
                  ) : (
                    <>
                      <FaStethoscope className="w-6 h-6" />
                      Comenzar Simulación
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          <style jsx>{`
            @keyframes slide-down {
              from {
                opacity: 0;
                transform: translateY(-20px);
              }
              to {
                opacity: 1;
                transform: translateY(0);
              }
            }

            @keyframes fade-in {
              from {
                opacity: 0;
              }
              to {
                opacity: 1;
              }
            }

            .animate-slide-down {
              animation: slide-down 0.5s ease-out;
            }

            .animate-fade-in {
              animation: fade-in 0.5s ease-out;
            }
          `}</style>
        </div>
      </section>

      {/* Features Section - MINSAL */}
      <section id="features" className="bg-gray-50 py-20 px-8">
        <div className="max-w-7xl mx-auto w-full">
          {/* Destacado Principal */}
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-16">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-full mb-6">
                <span className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Normativa Chilena</span>
              </div>
              <h3 className="text-4xl font-bold text-[#001c55] mb-4">
                Basado en Protocolos MINSAL
              </h3>
              <p className="text-gray-600 text-lg max-w-2xl mx-auto leading-relaxed">
                Nuestra IA está alimentada con las guías clínicas más actuales del Ministerio de Salud,
                entrenándote en la realidad del sistema de salud chileno.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="text-center group">
                <div className="bg-white rounded-2xl p-8 border border-gray-200 hover:border-[#1098f7] hover:shadow-lg transition-all duration-300">
                  <div className="text-5xl mb-4">🏥</div>
                  <h4 className="font-semibold text-[#001c55] mb-2 group-hover:text-[#1098f7] transition-colors">Derivaciones</h4>
                  <p className="text-sm text-gray-600">Según protocolos oficiales</p>
                </div>
              </div>

              <div className="text-center group">
                <div className="bg-white rounded-2xl p-8 border border-gray-200 hover:border-[#1098f7] hover:shadow-lg transition-all duration-300">
                  <div className="text-5xl mb-4">📋</div>
                  <h4 className="font-semibold text-[#001c55] mb-2 group-hover:text-[#1098f7] transition-colors">Programas APS</h4>
                  <p className="text-sm text-gray-600">PSCV, ERA, Salud Mental</p>
                </div>
              </div>

              <div className="text-center group">
                <div className="bg-white rounded-2xl p-8 border border-gray-200 hover:border-[#1098f7] hover:shadow-lg transition-all duration-300">
                  <div className="text-5xl mb-4">🎯</div>
                  <h4 className="font-semibold text-[#001c55] mb-2 group-hover:text-[#1098f7] transition-colors">Metas Clínicas</h4>
                  <p className="text-sm text-gray-600">Objetivos terapéuticos</p>
                </div>
              </div>

              <div className="text-center group">
                <div className="bg-white rounded-2xl p-8 border border-gray-200 hover:border-[#1098f7] hover:shadow-lg transition-all duration-300">
                  <div className="text-5xl mb-4">⚕️</div>
                  <h4 className="font-semibold text-[#001c55] mb-2 group-hover:text-[#1098f7] transition-colors">Manejo CESFAM</h4>
                  <p className="text-sm text-gray-600">Atención ambulatoria</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Comparison Section - Evolución */}
      <section className="min-h-screen bg-white px-8 pt-12 flex items-center">
        <div className="max-w-7xl mx-auto w-full">
          {/* Timeline / Evolución */}
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <h3 className="text-4xl font-bold text-[#001c55] mb-4">
                La educación médica necesita evolucionar
              </h3>
              <p className="text-gray-600 text-lg max-w-3xl mx-auto leading-relaxed">
                Las simulaciones físicas con actores son valiosas, pero costosas y limitadas.
                La tecnología debe complementarlas, no reemplazarlas, democratizando el acceso a la práctica clínica.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-16 pb-14">
              {/* Método Tradicional */}
              <div className="relative bg-white rounded-2xl p-8 border border-gray-200 shadow-md">
                <div className="text-center mb-8">
                  <h4 className="text-xl font-bold text-gray-700 mb-2">Simulaciones Tradicionales</h4>
                  <p className="text-sm text-gray-500">Necesarias pero limitadas</p>
                </div>
                <div className="space-y-8">
                  <div className="flex items-start gap-3">
                    <span className="text-red-500 text-xl flex-shrink-0 mt-1">✗</span>
                    <div>
                      <h5 className="font-semibold text-[#001c55] mb-2">Actores y espacios físicos</h5>
                      <p className="text-sm text-gray-600 leading-relaxed">
                        Costosas, requieren coordinación extensa y espacios especializados
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="text-red-500 text-xl flex-shrink-0 mt-1">✗</span>
                    <div>
                      <h5 className="font-semibold text-[#001c55] mb-2">Disponibilidad limitada</h5>
                      <p className="text-sm text-gray-600 leading-relaxed">
                        Dependen de horarios, tutores y recursos institucionales
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="text-red-500 text-xl flex-shrink-0 mt-1">✗</span>
                    <div>
                      <h5 className="font-semibold text-[#001c55] mb-2">Evaluación manual</h5>
                      <p className="text-sm text-gray-600 leading-relaxed">
                        Feedback subjetivo que llega días después
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="text-red-500 text-xl flex-shrink-0 mt-1">✗</span>
                    <div>
                      <h5 className="font-semibold text-[#001c55] mb-2">Pocas repeticiones</h5>
                      <p className="text-sm text-gray-600 leading-relaxed">
                        Limitadas oportunidades para practicar y perfeccionar
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Con MedSim */}
              <div className="relative bg-white rounded-2xl p-8 border border-gray-200 shadow-md">
                <div className="text-center mb-8">
                  <h4 className="text-xl font-bold text-[#001c55] mb-2">MedSim como Complemento</h4>
                  <p className="text-sm text-[#1098f7]">Práctica ilimitada, feedback instantáneo</p>
                </div>
                <div className="space-y-8">
                  <div className="flex items-start gap-3">
                    <span className="text-green-500 text-xl flex-shrink-0 mt-1">✓</span>
                    <div>
                      <h5 className="font-semibold text-[#001c55] mb-2">IA disponible 24/7</h5>
                      <p className="text-sm text-gray-600 leading-relaxed">
                        Practica en cualquier momento sin coordinación ni logística
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="text-green-500 text-xl flex-shrink-0 mt-1">✓</span>
                    <div>
                      <h5 className="font-semibold text-[#001c55] mb-2">Acceso democratizado</h5>
                      <p className="text-sm text-gray-600 leading-relaxed">
                        Todos los estudiantes, sin importar su institución o recursos
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="text-green-500 text-xl flex-shrink-0 mt-1">✓</span>
                    <div>
                      <h5 className="font-semibold text-[#001c55] mb-2">Feedback objetivo e inmediato</h5>
                      <p className="text-sm text-gray-600 leading-relaxed">
                        Evaluación instantánea basada en criterios OSCE estandarizados
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="text-green-500 text-xl flex-shrink-0 mt-1">✓</span>
                    <div>
                      <h5 className="font-semibold text-[#001c55] mb-2">Repeticiones ilimitadas</h5>
                      <p className="text-sm text-gray-600 leading-relaxed">
                        Practica hasta dominar, sin miedo a equivocarte
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="min-h-screen bg-gray-50 pb-6 px-8 flex items-center">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="text-5xl font-bold text-[#001c55] mb-6">
                Entrenamiento clínico del futuro
              </h2>
              <p className="text-lg text-gray-600 mb-6 leading-relaxed">
                MedSim utiliza inteligencia artificial avanzada para crear simulaciones clínicas realistas que te preparan para situaciones del mundo real.
              </p>
              <p className="text-lg text-gray-600 mb-8 leading-relaxed">
                Nuestros casos están basados en guías clínicas chilenas oficiales, asegurando que tu entrenamiento esté alineado con los estándares nacionales.
              </p>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <span className="text-[#1098f7] text-xl flex-shrink-0 mt-1">✓</span>
                  <div>
                    <h4 className="font-bold text-[#001c55] mb-1">Casos basados en evidencia</h4>
                    <p className="text-gray-600">Todos nuestros casos siguen guías clínicas y protocolos nacionales</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <span className="text-[#1098f7] text-xl flex-shrink-0 mt-1">✓</span>
                  <div>
                    <h4 className="font-bold text-[#001c55] mb-1">Feedback instantáneo</h4>
                    <p className="text-gray-600">Evaluación inmediata de tu desempeño clínico con retroalimentación detallada</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <span className="text-[#1098f7] text-xl flex-shrink-0 mt-1">✓</span>
                  <div>
                    <h4 className="font-bold text-[#001c55] mb-1">Práctica ilimitada</h4>
                    <p className="text-gray-600">Genera tantos casos como necesites para perfeccionar tus habilidades</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="relative">
              <div className="bg-[#1098f7] rounded-3xl p-12 shadow-2xl">
                <div className="bg-white rounded-2xl p-8 space-y-6">
                  <div className="flex items-center gap-4 pb-4 border-b border-gray-200">
                    <div className="w-12 h-12 bg-[#1098f7] rounded-full flex items-center justify-center">
                      <FaStethoscope className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <div className="font-bold text-[#001c55]">Caso Clínico</div>
                      <div className="text-sm text-gray-600">Simulación en progreso</div>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div className="bg-[#f0f8ff] p-4 rounded-lg">
                      <div className="text-sm text-gray-600 mb-1">Paciente</div>
                      <div className="font-semibold text-[#001c55]">Mujer, 45 años</div>
                    </div>
                    <div className="bg-[#f0f8ff] p-4 rounded-lg">
                      <div className="text-sm text-gray-600 mb-1">Motivo de consulta</div>
                      <div className="font-semibold text-[#001c55]">Dolor torácico</div>
                    </div>
                    <div className="bg-[#1098f7] p-4 rounded-lg text-white">
                      <div className="text-sm mb-1 opacity-90">Tu desempeño</div>
                      <div className="text-3xl font-bold">6.5/7.0</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#1098f7] py-12 px-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <div className="bg-white p-2 rounded-lg">
                <FaStethoscope className="w-6 h-6 text-[#1098f7]" />
              </div>
              <span className="text-2xl font-bold text-white">MedSim</span>
            </div>
          </div>
          <div className="border-t border-white/20 pt-8">
            <p className="text-center text-white">
              2025 MedSim - Grupo 13 Platanus Hack 25
            </p>
            <p className="text-center text-white/80 text-sm mt-2">
              Plataforma de simulación clínica para estudiantes de medicina
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
