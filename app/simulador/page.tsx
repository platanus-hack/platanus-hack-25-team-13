"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import type { ClinicalCase, FeedbackResult } from "@/types/case";
import ChatBox from "@/components/ChatBox";

interface ClinicalCaseResponse {
  success: boolean;
  data: {
    simulationId: string;
    initialMessage: string;
    "simulation-debug"?: Simulation;
    patientInfo: {
      edad: number;
      sexo: string;
      ocupacion: string;
      contexto_ingreso: string;
    };
    createdAt: Date;
    especialidad: "aps" | "urgencia" | "hospitalizacion" | "otro";
    nivel_dificultad: "facil" | "medio" | "dificil";
    aps_subcategoria?: "cardiovascular" | "respiratorio" | "metabolico" | "salud_mental" | "musculoesqueletico" | "general";
  };
}

interface Simulation {
  id: string;
  clinicalCase: ClinicalCase;
}

export default function SimuladorPage() {
  const [clinicalCase, setClinicalCase] = useState<ClinicalCaseResponse["data"] | null>(null);
  const [loading, setLoading] = useState(false);
  const [diagnosticoEstudiante, setDiagnosticoEstudiante] = useState("");
  const [showDiagnostico, setShowDiagnostico] = useState(false);
  const [feedbackLoading, setFeedbackLoading] = useState(false);
  const [feedbackFromEngine, setFeedbackFromEngine] = useState<FeedbackResult | null>(null);
  const [especialidad, setEspecialidad] = useState<ClinicalCase["especialidad"]>("aps");
  const [nivelDificultad, setNivelDificultad] = useState<ClinicalCase["nivel_dificultad"]>("medio");
  const router = useRouter();

  // Cargar caso generado desde home si existe
  useEffect(() => {
    const savedCase = sessionStorage.getItem("generatedCase");
    if (savedCase) {
      try {
        const parsedCase = JSON.parse(savedCase);
        setClinicalCase(parsedCase);
        setEspecialidad(parsedCase.especialidad || "aps");
        setNivelDificultad(parsedCase.nivel_dificultad || "medio");
        sessionStorage.removeItem("generatedCase");
      } catch (e) {
        console.error("Error parsing saved case:", e);
      }
    }
  }, []);

  async function handleGenerateCase() {
    setLoading(true);
    setShowDiagnostico(false);
    setDiagnosticoEstudiante("");
    try {
      const res = await fetch("/api/generar-caso", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          especialidad,
          nivel_dificultad: nivelDificultad,
        }),
      });
      if (!res.ok) throw new Error("Error en la API");

      const data = (await res.json()) as ClinicalCaseResponse;
      setClinicalCase(data?.data);  
    } catch (e) {
      console.error(e);
      alert("Error generando caso");
    } finally {
      setLoading(false);
    }
  }

  function handleFeedbackReceived(feedback: FeedbackResult) {
    setFeedbackFromEngine(feedback);
    // Guardar en sessionStorage para la página de resultados
    const simulationDebug = clinicalCase?.["simulation-debug"];
    sessionStorage.setItem("feedbackData", JSON.stringify({
      feedback,
      clinicalCase: simulationDebug?.clinicalCase || null,
      diagnosticoEstudiante: diagnosticoEstudiante || feedback.diagnostico.estudiante,
    }));
    
    // Redirigir automáticamente a resultados cuando se recibe feedback
    router.push("/resultados");
  }

  async function handleFinalizarYFeedback() {
    if (!clinicalCase) {
      alert("Por favor genera un caso primero");
      return;
    }

    // Si ya tenemos feedback del engine (diagnóstico enviado por chat), usarlo
    if (feedbackFromEngine) {
      const simulationDebug = clinicalCase?.["simulation-debug"];
      sessionStorage.setItem("feedbackData", JSON.stringify({
        feedback: feedbackFromEngine,
        clinicalCase: simulationDebug?.clinicalCase || null,
        diagnosticoEstudiante: diagnosticoEstudiante || feedbackFromEngine.diagnostico.estudiante,
      }));
      router.push("/resultados");
      return;
    }

    // Si no hay feedback y hay diagnóstico en el formulario, enviarlo automáticamente por chat
    if (!diagnosticoEstudiante.trim()) {
      alert("Por favor ingresa un diagnóstico antes de finalizar");
      return;
    }

    // Enviar el diagnóstico al engine para que genere feedback automáticamente
    setFeedbackLoading(true);
    try {
      const res = await fetch("/api/engine", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          simulationId: clinicalCase.simulationId,
          message: `Mi diagnóstico es: ${diagnosticoEstudiante}`,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Error enviando diagnóstico");
      }

      const data = await res.json();
      
      if (data.success && data.data?.feedback) {
        // El feedback ya se manejará en handleFeedbackReceived
        // pero también lo guardamos aquí por si acaso
        handleFeedbackReceived(data.data.feedback);
      } else {
        throw new Error("No se recibió feedback del engine");
      }
    } catch (err) {
      console.error(err);
      alert(err instanceof Error ? err.message : "Error enviando diagnóstico");
    } finally {
      setFeedbackLoading(false);
    }
  }

  return (
    <main className="p-6 max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold mb-6 text-[#001c55]">
        Simulador de Casos Clínicos
      </h1>

      <div className="mb-6 p-4 bg-white rounded-lg border border-[#1098f7] border-opacity-20 shadow-sm">
        <h2 className="text-lg font-semibold mb-4 text-[#001c55]">
          Configuración del Caso
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nivel de Atención
            </label>
            <select
              value={especialidad}
              onChange={(e) => setEspecialidad(e.target.value as ClinicalCase["especialidad"])}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:border-[#1098f7] focus:ring-1 focus:ring-[#1098f7]"
            >
              <option value="aps">🏥 APS (CESFAM) - con RAG 🤖</option>
              <option value="urgencia">🚨 Urgencia (Servicio de Urgencias)</option>
              <option value="hospitalizacion">🏨 Hospitalización (Medicina Interna)</option>
              <option value="otro">🔧 Otro (Pediatría / Especialidades)</option>
            </select>
            {especialidad === "aps" && (
              <p className="text-xs text-green-600 mt-1">
                ✨ Usando RAG con guías clínicas chilenas (PSCV, ERA, Salud Mental)
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nivel de Dificultad
            </label>
            <select
              value={nivelDificultad}
              onChange={(e) => setNivelDificultad(e.target.value as ClinicalCase["nivel_dificultad"])}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:border-[#1098f7] focus:ring-1 focus:ring-[#1098f7]"
            >
              <option value="facil">Fácil</option>
              <option value="medio">Medio</option>
              <option value="dificil">Difícil</option>
            </select>
          </div>
        </div>
      </div>

      <button
        onClick={handleGenerateCase}
        disabled={loading}
        className="bg-[#1098f7] text-white px-6 py-3 rounded-lg mb-6 disabled:opacity-50 hover:bg-[#0d7fd6] transition-colors"
      >
        {loading ? "Generando caso..." : "Generar nuevo caso"}
      </button>

      {clinicalCase && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div>
            <h2 className="text-xl font-semibold mb-4 text-[#001c55]">
              Chat con el Paciente
            </h2>
            <ChatBox
              key={clinicalCase?.simulationId}
              simulationId={clinicalCase.simulationId}
              initialMessage={clinicalCase.initialMessage}  
              onFeedbackReceived={handleFeedbackReceived}
            />
          </div>
          
          <div className="space-y-4">
            <div className="border border-[#1098f7] border-opacity-20 rounded-lg p-4 bg-white shadow-sm">
              <h3 className="font-semibold mb-3 text-[#001c55]">
                Información del Paciente
              </h3>
              <div className="space-y-2 text-sm">
                <p><strong>Edad:</strong> {clinicalCase.patientInfo.edad} años</p>
                <p><strong>Sexo:</strong> {clinicalCase.patientInfo.sexo}</p>
                <p><strong>Ocupación:</strong> {clinicalCase.patientInfo.ocupacion}</p>
                <p><strong>Contexto:</strong> {clinicalCase.patientInfo.contexto_ingreso}</p>
                {clinicalCase.aps_subcategoria && (
                  <p className="mt-2 pt-2 border-t border-gray-200">
                    <strong>Foco APS:</strong> 
                    <span className="ml-2 px-2 py-1 bg-green-100 text-green-700 rounded text-xs font-medium">
                      {clinicalCase.aps_subcategoria}
                    </span>
                  </p>
                )}
              </div>
            </div>
            
            <div className="border border-[#1098f7] border-opacity-20 rounded-lg p-4 bg-white shadow-sm">
              <h3 className="font-semibold mb-3 text-[#001c55]">Acciones</h3>
              <button 
                onClick={() => setShowDiagnostico(!showDiagnostico)}
                className="w-full border border-[#1098f7] px-4 py-2 rounded-lg mb-2 hover:bg-[#1098f7] hover:bg-opacity-10 transition-colors text-[#001c55]"
              >
                {showDiagnostico ? "Ocultar" : "Ingresar"} Diagnóstico Final
              </button>
            </div>

            {showDiagnostico && (
              <div className="border border-[#1098f7] border-opacity-20 rounded-lg p-4 bg-white shadow-sm">
                <h3 className="font-semibold mb-3 text-[#001c55]">
                  Tu Diagnóstico
                </h3>
                <textarea
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm min-h-[120px] focus:outline-none focus:border-[#1098f7] focus:ring-1 focus:ring-[#1098f7]"
                  value={diagnosticoEstudiante}
                  onChange={(e) => setDiagnosticoEstudiante(e.target.value)}
                  placeholder="Escribe tu diagnóstico principal y diagnósticos diferenciales..."
                />
                <button
                  onClick={handleFinalizarYFeedback}
                  disabled={feedbackLoading || !diagnosticoEstudiante.trim()}
                  className="w-full mt-3 bg-emerald-600 text-white px-4 py-3 rounded-lg disabled:opacity-50 hover:bg-emerald-700 transition-colors font-medium"
                >
                  {feedbackLoading ? "Generando evaluación..." : "Finalizar y obtener feedback"}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </main>
  );
}