"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { FaCheckCircle, FaTimesCircle, FaStar, FaChartLine, FaRedo } from "react-icons/fa";
import type { ClinicalCase } from "@/types/case";

type FeedbackResult = {
  puntajes: {
    motivo_consulta: number;
    sintomas_relevantes: number;
    antecedentes: number;
    red_flags: number;
    razonamiento_clinico: number;
    comunicacion: number;
  };
  comentarios: {
    fortalezas: string[];
    debilidades: string[];
    sugerencias: string[];
  };
  diagnostico: {
    estudiante: string;
    correcto: boolean;
    diagnostico_real: string;
    comentario: string;
  };
};

type ResultData = {
  feedback: FeedbackResult;
  clinicalCase: ClinicalCase;
  diagnosticoEstudiante: string;
};

export default function ResultadosPage() {
  const [resultData, setResultData] = useState<ResultData | null>(null);
  const router = useRouter();

  useEffect(() => {
    const data = sessionStorage.getItem("feedbackData");
    if (!data) {
      router.push("/simulador");
      return;
    }
    setResultData(JSON.parse(data));
  }, [router]);

  if (!resultData) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-lg text-gray-500">Cargando resultados...</p>
      </div>
    );
  }

  const { feedback, clinicalCase, diagnosticoEstudiante } = resultData;
  const promedioGeneral = Object.values(feedback.puntajes).reduce((a, b) => a + b, 0) / Object.keys(feedback.puntajes).length;

  const puntajeLabels: Record<keyof typeof feedback.puntajes, string> = {
    motivo_consulta: "Exploración del motivo de consulta",
    sintomas_relevantes: "Interrogatorio de síntomas",
    antecedentes: "Evaluación de antecedentes",
    red_flags: "Detección de red flags",
    razonamiento_clinico: "Razonamiento clínico",
    comunicacion: "Comunicación con el paciente",
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-[#f0f8ff] to-[#e6f3ff] p-6">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-lg p-6 border border-[#1098f7] border-opacity-20">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-[#001c55] mb-2">
                Resultados de la Evaluación
              </h1>
              <p className="text-gray-600">Caso: {clinicalCase.id}</p>
            </div>
            <div className="text-center">
              <div className="text-5xl font-bold text-[#1098f7]">
                {promedioGeneral.toFixed(1)}
              </div>
              <p className="text-sm text-gray-500">Promedio general</p>
            </div>
          </div>
        </div>

        {/* Diagnóstico */}
        <div className="bg-white rounded-xl shadow-lg p-6 border border-[#1098f7] border-opacity-20">
          <div className="flex items-start gap-4 mb-4">
            {feedback.diagnostico.correcto ? (
              <FaCheckCircle className="w-8 h-8 text-green-500 flex-shrink-0 mt-1" />
            ) : (
              <FaTimesCircle className="w-8 h-8 text-red-500 flex-shrink-0 mt-1" />
            )}
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-[#001c55] mb-3">
                Diagnóstico
              </h2>
              <div className="space-y-3">
                <div>
                  <p className="text-sm font-semibold text-gray-600">Tu diagnóstico:</p>
                  <p className="text-base text-gray-800">{diagnosticoEstudiante}</p>
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-600">Diagnóstico correcto:</p>
                  <p className="text-base text-gray-800 font-medium">{feedback.diagnostico.diagnostico_real}</p>
                </div>
                <div className="bg-blue-50 border-l-4 border-[#1098f7] p-3 rounded">
                  <p className="text-sm text-gray-700">{feedback.diagnostico.comentario}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Puntajes detallados */}
        <div className="bg-white rounded-xl shadow-lg p-6 border border-[#1098f7] border-opacity-20">
          <div className="flex items-center gap-2 mb-4">
            <FaChartLine className="w-6 h-6 text-[#1098f7]" />
            <h2 className="text-2xl font-bold text-[#001c55]">
              Puntajes por Criterio
            </h2>
          </div>
          <div className="space-y-4">
            {Object.entries(feedback.puntajes).map(([key, value]) => {
              const percentage = (value / 5) * 100;
              return (
                <div key={key}>
                  <div className="flex justify-between mb-1">
                    <span className="text-sm font-medium text-gray-700">
                      {puntajeLabels[key as keyof typeof puntajeLabels]}
                    </span>
                    <span className="text-sm font-bold text-[#1098f7]">
                      {value}/5
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div
                      className="bg-gradient-to-r from-[#1098f7] to-[#0d7fd6] h-3 rounded-full transition-all duration-500"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Comentarios */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Fortalezas */}
          <div className="bg-white rounded-xl shadow-lg p-5 border-t-4 border-green-500">
            <div className="flex items-center gap-2 mb-3">
              <FaStar className="w-5 h-5 text-green-500" />
              <h3 className="font-bold text-[#001c55]">Fortalezas</h3>
            </div>
            <ul className="space-y-2">
              {feedback.comentarios.fortalezas.map((item, idx) => (
                <li key={idx} className="text-sm text-gray-700 flex gap-2">
                  <span className="text-green-500 flex-shrink-0">✓</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Debilidades */}
          <div className="bg-white rounded-xl shadow-lg p-5 border-t-4 border-orange-500">
            <div className="flex items-center gap-2 mb-3">
              <FaTimesCircle className="w-5 h-5 text-orange-500" />
              <h3 className="font-bold text-[#001c55]">Áreas de mejora</h3>
            </div>
            <ul className="space-y-2">
              {feedback.comentarios.debilidades.map((item, idx) => (
                <li key={idx} className="text-sm text-gray-700 flex gap-2">
                  <span className="text-orange-500 flex-shrink-0">!</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Sugerencias */}
          <div className="bg-white rounded-xl shadow-lg p-5 border-t-4 border-[#1098f7]">
            <div className="flex items-center gap-2 mb-3">
              <FaChartLine className="w-5 h-5 text-[#1098f7]" />
              <h3 className="font-bold text-[#001c55]">Sugerencias</h3>
            </div>
            <ul className="space-y-2">
              {feedback.comentarios.sugerencias.map((item, idx) => (
                <li key={idx} className="text-sm text-gray-700 flex gap-2">
                  <span className="text-[#1098f7] flex-shrink-0">→</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Botones de acción */}
        <div className="flex gap-4 justify-center pb-6">
          <button
            onClick={() => router.push("/simulador")}
            className="flex items-center gap-2 bg-[#1098f7] text-white px-6 py-3 rounded-lg hover:bg-[#0d7fd6] transition-colors font-medium"
          >
            <FaRedo className="w-4 h-4" />
            Nuevo caso
          </button>
          <button
            onClick={() => router.push("/home")}
            className="flex items-center gap-2 border border-[#1098f7] text-[#1098f7] px-6 py-3 rounded-lg hover:bg-[#1098f7] hover:bg-opacity-10 transition-colors font-medium"
          >
            Volver al inicio
          </button>
        </div>
      </div>
    </main>
  );
}