"use client";

import { useState } from "react";
import VoiceAgent from "@/components/VoiceAgent";
import Feedback from "@/components/anamnesis/Feedback";
import type { FeedbackResult, ClinicalCase } from "@/types/case";

type CaseData = {
  sut: string;
  simulationId: string;
  initialMessage: string;
  patientInfo: {
    edad: number;
    sexo: string;
    ocupacion: string;
    contexto_ingreso: string;
  };
  especialidad: string;
  nivel_dificultad: string;
};

export default function VoiceAgentPage() {
  const [step, setStep] = useState<"selection" | "conversation" | "feedback">("selection");
  const [caseData, setCaseData] = useState<CaseData | null>(null);
  const [feedbackData, setFeedbackData] = useState<FeedbackResult | null>(null);
  const [clinicalCase, setClinicalCase] = useState<ClinicalCase | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [selectedSpecialty, setSelectedSpecialty] = useState("medicina_interna");
  const [selectedDifficulty, setSelectedDifficulty] = useState<"facil" | "medio" | "dificil">("medio");

  const specialties = [
    { value: "medicina_interna", label: "Medicina Interna", icon: "🩺" },
    { value: "pediatria", label: "Pediatría", icon: "👶" },
    { value: "cardiologia", label: "Cardiología", icon: "❤️" },
    { value: "neurologia", label: "Neurología", icon: "🧠" },
  ];

  const difficulties = [
    { value: "facil" as const, label: "Fácil", description: "Casos básicos y directos" },
    { value: "medio" as const, label: "Medio", description: "Casos intermedios con más detalles" },
    { value: "dificil" as const, label: "Difícil", description: "Casos complejos y desafiantes" },
  ];

  const handleGenerateCase = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/generar-caso", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          especialidad: selectedSpecialty,
          nivel_dificultad: selectedDifficulty,
        }),
      });

      if (!response.ok) {
        throw new Error("Error al generar caso clínico");
      }

      const data = await response.json();

      setCaseData({
        sut: data.sut,
        simulationId: data.data.simulationId,
        initialMessage: data.data.initialMessage  ,
        patientInfo: data.data.patientInfo,
        especialidad: data.data.especialidad,
        nivel_dificultad: data.data.nivel_dificultad,
      });

      // Guardar el caso clínico completo desde simulation-debug
      if (data.data['simulation-debug']?.clinicalCase) {
        setClinicalCase(data.data['simulation-debug'].clinicalCase);
      }

      setStep("conversation");
    } catch (err) {
      console.error("Error al generar caso:", err);
      setError("No se pudo generar el caso clínico. Por favor, intenta nuevamente.");
    } finally {
      setLoading(false);
    }
  };

  if (step === "selection") {
    return (
      <div className="h-full bg-white overflow-y-auto p-6">
        <div className="w-full max-w-3xl mx-auto py-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-[#00072d] text-sm font-medium tracking-widest mb-2">SIMULACIÓN MÉDICA</h1>
            <p className="text-[#00072d]/60 text-sm">Configura los parámetros de tu caso clínico</p>
          </div>

          {/* Error message */}
          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 rounded-xl p-4">
              <div className="text-red-700 text-sm font-semibold mb-1">Error</div>
              <p className="text-red-600 text-xs">{error}</p>
            </div>
          )}

          {/* Main card */}
          <div className="bg-white rounded-xl border border-[#00072d]/10 shadow-sm p-8">
            {/* Especialidad */}
            <div className="mb-8">
              <label className="block text-[#00072d]/50 text-xs uppercase tracking-wide font-medium mb-4">
                Especialidad Médica
              </label>
              <div className="grid grid-cols-2 gap-3">
                {specialties.map((specialty) => (
                  <button
                    key={specialty.value}
                    onClick={() => setSelectedSpecialty(specialty.value)}
                    className={`
                      group p-5 rounded-xl border transition-all duration-200 text-left
                      ${
                        selectedSpecialty === specialty.value
                          ? "border-[#1098f7] bg-[#1098f7]/5 shadow-sm"
                          : "border-[#00072d]/10 hover:border-[#1098f7]/30 hover:bg-[#1098f7]/5"
                      }
                    `}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`
                        text-2xl transition-transform duration-200
                        ${selectedSpecialty === specialty.value ? 'scale-110' : 'group-hover:scale-105'}
                      `}>
                        {specialty.icon}
                      </div>
                      <div className={`
                        font-medium text-sm
                        ${selectedSpecialty === specialty.value ? 'text-[#1098f7]' : 'text-[#00072d]'}
                      `}>
                        {specialty.label}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Divider */}
            <div className="border-t border-[#00072d]/5 my-8"></div>

            {/* Dificultad */}
            <div className="mb-8">
              <label className="block text-[#00072d]/50 text-xs uppercase tracking-wide font-medium mb-4">
                Nivel de Dificultad
              </label>
              <div className="space-y-2">
                {difficulties.map((difficulty) => (
                  <button
                    key={difficulty.value}
                    onClick={() => setSelectedDifficulty(difficulty.value)}
                    className={`
                      w-full p-4 rounded-xl border transition-all duration-200 text-left
                      ${
                        selectedDifficulty === difficulty.value
                          ? "border-[#1098f7] bg-[#1098f7]/5 shadow-sm"
                          : "border-[#00072d]/10 hover:border-[#1098f7]/30 hover:bg-[#1098f7]/5"
                      }
                    `}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className={`
                          font-semibold text-sm mb-1
                          ${selectedDifficulty === difficulty.value ? 'text-[#1098f7]' : 'text-[#00072d]'}
                        `}>
                          {difficulty.label}
                        </div>
                        <div className="text-[#00072d]/50 text-xs">{difficulty.description}</div>
                      </div>
                      <div className={`
                        w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all
                        ${
                          selectedDifficulty === difficulty.value
                            ? 'border-[#1098f7] bg-[#1098f7]'
                            : 'border-[#00072d]/20'
                        }
                      `}>
                        {selectedDifficulty === difficulty.value && (
                          <div className="w-2 h-2 bg-white rounded-full"></div>
                        )}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Divider */}
            <div className="border-t border-[#00072d]/5 my-8"></div>


            {/* Botón de generar */}
            <button
              onClick={handleGenerateCase}
              disabled={loading}
              className={`
                w-full py-4 rounded-xl font-semibold text-sm transition-all duration-300 uppercase tracking-wide
                ${
                  loading
                    ? "bg-[#00072d]/20 text-[#00072d]/40 cursor-not-allowed"
                    : "bg-[#1098f7] text-white hover:bg-[#0d7ed9] hover:shadow-lg hover:scale-[1.01] active:scale-[0.99]"
                }
              `}
            >
              {loading ? (
                <div className="flex items-center justify-center gap-3">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Generando caso clínico</span>
                </div>
              ) : (
                "Iniciar Simulación"
              )}
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (step === "conversation" && caseData) {
    return (
      <div className="h-full bg-white overflow-y-auto">
        {/* Header con botón de volver */}
        <div className="border-b border-[#00072d]/10 bg-white px-6 py-4">
          <div className="w-full max-w-2xl mx-auto flex justify-between items-center">
            <h1 className="text-[#00072d] text-sm font-medium tracking-widest">VOICE AGENT</h1>
            <button
              onClick={() => {
                // Limpiar datos del caso para forzar nueva generación
                setCaseData(null);
                setStep("selection");
              }}
              className="px-4 py-2 text-[#00072d]/60 hover:text-[#00072d] text-sm transition-colors duration-200 font-medium"
            >
              ← Volver
            </button>
          </div>
        </div>

        {/* VoiceAgent sin header */}
        <VoiceAgent
          token={caseData.sut}
          caseInfo={{
            message: caseData.initialMessage,
            patient: caseData.patientInfo,
            specialty: caseData.especialidad,
            difficulty: caseData.nivel_dificultad,
            simulationId: caseData.simulationId,
          }}
          onFeedback={async (feedback) => {
            console.log('📊 Feedback recibido en página:', feedback);

            // Guardar feedback en el estado
            setFeedbackData(feedback);

            // Guardar en la base de datos
            if (clinicalCase) {
              try {
                const promedioGeneral = feedback.puntajes
                  ? Object.values(feedback.puntajes as Record<string, number>).reduce((a: number, b: number) => a + b, 0) /
                    Object.keys(feedback.puntajes).length
                  : 0;

                const diagnosticoFinal = feedback.diagnostico?.diagnostico_real || "";

                const response = await fetch("/api/update-anamnesis", {
                  method: "POST",
                  headers: {
                    "Content-Type": "application/json",
                  },
                  body: JSON.stringify({
                    simulationId: caseData.simulationId,
                    finalDiagnosis: diagnosticoFinal,
                    calificacion: promedioGeneral,
                    simulationData: {
                      feedback_data: feedback,
                    },
                  }),
                });

                if (!response.ok) {
                  console.error("Error al guardar en la base de datos");
                }
              } catch (error) {
                console.error("Error al guardar simulación:", error);
              }
            }

            // Cambiar al paso de feedback
            setStep("feedback");
          }}
          onSimulationEnd={() => {
            console.log('🏁 Simulación finalizada por el usuario');
            // Volver a la pantalla de selección
            setCaseData(null);
            setStep("selection");
          }}
        />
      </div>
    );
  }

  if (step === "feedback" && feedbackData && clinicalCase) {
    return (
      <div className="h-full bg-white overflow-y-auto">
        {/* Header con botón de volver */}
        <div className="border-b border-[#00072d]/10 bg-white px-6 py-4">
          <div className="w-full max-w-7xl mx-auto flex justify-between items-center">
            <h1 className="text-[#00072d] text-sm font-medium tracking-widest">RESULTADOS DE LA SIMULACIÓN</h1>
            <button
              onClick={() => {
                // Limpiar datos y volver a la selección
                setCaseData(null);
                setFeedbackData(null);
                setClinicalCase(null);
                setStep("selection");
              }}
              className="px-4 py-2 text-[#00072d]/60 hover:text-[#00072d] text-sm transition-colors duration-200 font-medium"
            >
              ← Nueva Simulación
            </button>
          </div>
        </div>

        {/* Componente Feedback */}
        <div className="p-6">
          <Feedback clinicalCase={clinicalCase} feedback={feedbackData} />
        </div>
      </div>
    );
  }

  return null;
}
