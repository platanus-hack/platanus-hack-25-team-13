"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { FaCheckCircle, FaTimesCircle, FaStar, FaChartLine, FaRedo, FaLightbulb } from "react-icons/fa";
import type { ClinicalCase } from "@/types/case";

type FeedbackResult = {
  puntajes: {
    anamnesis_motivo_consulta: number;
    identificacion_sintomas: number;
    antecedentes: number;
    razonamiento_clinico: number;
    comunicacion_empatia: number;
    manejo_derivacion?: number;
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
  manejo?: {
    derivacion_correcta: boolean;
    tipo_derivacion_adecuado: boolean;
    manejo_inicial_apropiado: boolean;
    considero_ingreso_programa?: boolean;
    metas_terapeuticas_definidas?: boolean;
    educacion_y_seguimiento_apropiados?: boolean;
    considero_factores_psicosociales?: boolean;
    comentario: string;
    recomendaciones_especificas?: {
      derivacion: string;
      programa_aps: string;
      metas_terapeuticas: string[];
      manejo_cesfam: string[];
      educacion_paciente: string[];
      seguimiento: string;
    };
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
    const parsedData = JSON.parse(data);
    console.log("📊 Feedback data loaded:", parsedData);
    console.log("📋 Recomendaciones específicas:", parsedData.feedback?.manejo?.recomendaciones_especificas);
    setResultData(parsedData);
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
    anamnesis_motivo_consulta: "Anamnesis y motivo de consulta",
    identificacion_sintomas: "Identificación de síntomas y signos",
    antecedentes: "Antecedentes mórbidos y farmacológicos",
    razonamiento_clinico: "Razonamiento clínico y diagnóstico diferencial",
    comunicacion_empatia: "Comunicación efectiva y empatía",
    manejo_derivacion: "Manejo y decisiones de derivación (APS)",
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

        {/* Manejo APS - Solo para casos de APS */}
        {feedback.manejo && clinicalCase.especialidad === "aps" && (
          <div className="bg-white rounded-xl shadow-lg p-6 border border-[#1098f7] border-opacity-20">
            <h2 className="text-2xl font-bold text-[#001c55] mb-4 flex items-center gap-2">
              {feedback.manejo.derivacion_correcta && 
               feedback.manejo.tipo_derivacion_adecuado && 
               feedback.manejo.manejo_inicial_apropiado ? (
                <FaCheckCircle className="text-green-500" />
              ) : (
                <FaTimesCircle className="text-orange-500" />
              )}
              Evaluación de Manejo en APS
            </h2>

            {/* Evaluación de lo que hizo el estudiante */}
            <div className="mb-4">
              <h3 className="font-semibold text-gray-700 mb-3">Tu desempeño:</h3>
              <div className="grid grid-cols-2 gap-3">
                <div className="flex items-center gap-2 p-2 bg-gray-50 rounded">
                  {feedback.manejo.derivacion_correcta ? (
                    <FaCheckCircle className="text-green-500 shrink-0" />
                  ) : (
                    <FaTimesCircle className="text-red-500 shrink-0" />
                  )}
                  <span className="text-sm">Decisión de derivación correcta</span>
                </div>
                <div className="flex items-center gap-2 p-2 bg-gray-50 rounded">
                  {feedback.manejo.tipo_derivacion_adecuado ? (
                    <FaCheckCircle className="text-green-500 shrink-0" />
                  ) : (
                    <FaTimesCircle className="text-red-500 shrink-0" />
                  )}
                  <span className="text-sm">Tipo de derivación adecuado</span>
                </div>
                <div className="flex items-center gap-2 p-2 bg-gray-50 rounded">
                  {feedback.manejo.manejo_inicial_apropiado ? (
                    <FaCheckCircle className="text-green-500 shrink-0" />
                  ) : (
                    <FaTimesCircle className="text-red-500 shrink-0" />
                  )}
                  <span className="text-sm">Manejo inicial apropiado</span>
                </div>
                {feedback.manejo.considero_ingreso_programa !== undefined && (
                  <div className="flex items-center gap-2 p-2 bg-gray-50 rounded">
                    {feedback.manejo.considero_ingreso_programa ? (
                      <FaCheckCircle className="text-green-500 shrink-0" />
                    ) : (
                      <FaTimesCircle className="text-red-500 shrink-0" />
                    )}
                    <span className="text-sm">Consideró ingreso a programa</span>
                  </div>
                )}
                {feedback.manejo.metas_terapeuticas_definidas !== undefined && (
                  <div className="flex items-center gap-2 p-2 bg-gray-50 rounded">
                    {feedback.manejo.metas_terapeuticas_definidas ? (
                      <FaCheckCircle className="text-green-500 shrink-0" />
                    ) : (
                      <FaTimesCircle className="text-red-500 shrink-0" />
                    )}
                    <span className="text-sm">Definió metas terapéuticas</span>
                  </div>
                )}
                {feedback.manejo.educacion_y_seguimiento_apropiados !== undefined && (
                  <div className="flex items-center gap-2 p-2 bg-gray-50 rounded">
                    {feedback.manejo.educacion_y_seguimiento_apropiados ? (
                      <FaCheckCircle className="text-green-500 shrink-0" />
                    ) : (
                      <FaTimesCircle className="text-red-500 shrink-0" />
                    )}
                    <span className="text-sm">Educación y seguimiento apropiados</span>
                  </div>
                )}
                {feedback.manejo.considero_factores_psicosociales !== undefined && (
                  <div className="flex items-center gap-2 p-2 bg-gray-50 rounded">
                    {feedback.manejo.considero_factores_psicosociales ? (
                      <FaCheckCircle className="text-green-500 shrink-0" />
                    ) : (
                      <FaTimesCircle className="text-red-500 shrink-0" />
                    )}
                    <span className="text-sm">Consideró factores psicosociales</span>
                  </div>
                )}
              </div>
            </div>

            {/* Comentario general */}
            <div className="bg-blue-50 border-l-4 border-blue-500 p-3 rounded mb-4">
              <p className="text-sm text-gray-700"><strong>Comentario:</strong> {feedback.manejo.comentario}</p>
            </div>

            {/* Recomendaciones específicas */}
            {feedback.manejo.recomendaciones_especificas ? (
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <h3 className="font-semibold text-green-900 mb-3 flex items-center gap-2">
                  <FaLightbulb className="text-green-600" />
                  Manejo Correcto para este Caso
                </h3>
                <div className="space-y-3 text-sm">
                  {/* Derivación */}
                  <div>
                    <p className="font-semibold text-green-800">Derivación:</p>
                    <p className="text-gray-700 ml-2">{feedback.manejo.recomendaciones_especificas.derivacion}</p>
                  </div>

                  {/* Programa APS */}
                  <div>
                    <p className="font-semibold text-green-800">Programa APS:</p>
                    <p className="text-gray-700 ml-2">{feedback.manejo.recomendaciones_especificas.programa_aps}</p>
                  </div>

                  {/* Metas terapéuticas */}
                  {feedback.manejo.recomendaciones_especificas.metas_terapeuticas.length > 0 && (
                    <div>
                      <p className="font-semibold text-green-800">Metas terapéuticas:</p>
                      <ul className="list-disc ml-5 text-gray-700">
                        {feedback.manejo.recomendaciones_especificas.metas_terapeuticas.map((meta: string, i: number) => (
                          <li key={i}>{meta}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Manejo en CESFAM */}
                  {feedback.manejo.recomendaciones_especificas.manejo_cesfam.length > 0 && (
                    <div>
                      <p className="font-semibold text-green-800">Manejo inicial en CESFAM:</p>
                      <ul className="list-disc ml-5 text-gray-700">
                        {feedback.manejo.recomendaciones_especificas.manejo_cesfam.map((accion: string, i: number) => (
                          <li key={i}>{accion}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Educación */}
                  {feedback.manejo.recomendaciones_especificas.educacion_paciente.length > 0 && (
                    <div>
                      <p className="font-semibold text-green-800">Educación al paciente:</p>
                      <ul className="list-disc ml-5 text-gray-700">
                        {feedback.manejo.recomendaciones_especificas.educacion_paciente.map((edu: string, i: number) => (
                          <li key={i}>{edu}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Seguimiento */}
                  <div>
                    <p className="font-semibold text-green-800">Seguimiento:</p>
                    <p className="text-gray-700 ml-2">{feedback.manejo.recomendaciones_especificas.seguimiento}</p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-sm text-yellow-800">
                  ⚠️ No se encontraron recomendaciones específicas en el feedback. 
                  <br />
                  <span className="text-xs">Debug: {JSON.stringify(Object.keys(feedback.manejo || {}))}</span>
                </p>
              </div>
            )}
          </div>
        )}

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
              const percentage = Math.max(0, ((value - 1) / 6) * 100);
              return (
                <div key={key}>
                  <div className="flex justify-between mb-1">
                    <span className="text-sm font-medium text-gray-700">
                      {puntajeLabels[key as keyof typeof puntajeLabels]}
                    </span>
                    <span className="text-sm font-bold text-[#1098f7]">
                      {value.toFixed(1)}/7.0
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