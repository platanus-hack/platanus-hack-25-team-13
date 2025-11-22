"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { ClinicalCase, ChatMessage } from "@/types/case";
import ChatBox from "@/components/ChatBox";

export default function SimuladorPage() {
  const [clinicalCase, setClinicalCase] = useState<ClinicalCase | null>(null);
  const [loading, setLoading] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [diagnosticoEstudiante, setDiagnosticoEstudiante] = useState("");
  const [showDiagnostico, setShowDiagnostico] = useState(false);
  const [feedbackLoading, setFeedbackLoading] = useState(false);
  const router = useRouter();

  async function handleGenerateCase() {
    setLoading(true);
    setShowDiagnostico(false);
    setDiagnosticoEstudiante("");
    setChatMessages([]);
    try {
      const res = await fetch("/api/generar-caso", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          especialidad: "urgencia",
          nivel_dificultad: "medio",
        }),
      });
      if (!res.ok) throw new Error("Error en la API");

      const data = (await res.json()) as ClinicalCase;
      setClinicalCase(data);
    } catch (e) {
      console.error(e);
      alert("Error generando caso");
    } finally {
      setLoading(false);
    }
  }

  async function handleFinalizarYFeedback() {
    if (!clinicalCase || !diagnosticoEstudiante.trim()) {
      alert("Por favor ingresa un diagnóstico antes de finalizar");
      return;
    }

    if (chatMessages.length === 0) {
      alert("Debes conversar con el paciente antes de finalizar");
      return;
    }

    setFeedbackLoading(true);
    try {
      const res = await fetch("/api/feeedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clinicalCase,
          messages: chatMessages,
          diagnostico_estudiante: diagnosticoEstudiante,
        }),
      });

      if (!res.ok) throw new Error("Error generando feedback");
      
      const feedbackData = await res.json();
      
      // Guardar en sessionStorage para la página de resultados
      sessionStorage.setItem("feedbackData", JSON.stringify({
        feedback: feedbackData,
        clinicalCase,
        diagnosticoEstudiante,
      }));

      // Redirigir a la página de resultados
      router.push("/resultados");
    } catch (err) {
      console.error(err);
      alert("Error generando feedback");
    } finally {
      setFeedbackLoading(false);
    }
  }

  return (
    <main className="p-6 max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold mb-6 text-[#001c55]">
        Simulador de Casos Clínicos
      </h1>

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
              key={clinicalCase.id}
              clinicalCase={clinicalCase}
              onMessagesChange={setChatMessages}
            />
          </div>
          
          <div className="space-y-4">
            <div className="border border-[#1098f7] border-opacity-20 rounded-lg p-4 bg-white shadow-sm">
              <h3 className="font-semibold mb-3 text-[#001c55]">
                Información del Paciente
              </h3>
              <div className="space-y-2 text-sm">
                <p><strong>Edad:</strong> {clinicalCase.paciente.edad} años</p>
                <p><strong>Sexo:</strong> {clinicalCase.paciente.sexo}</p>
                <p><strong>Ocupación:</strong> {clinicalCase.paciente.ocupacion}</p>
                <p><strong>Contexto:</strong> {clinicalCase.paciente.contexto_ingreso}</p>
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