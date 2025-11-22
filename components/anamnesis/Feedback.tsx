"use client";

import { FaDownload, FaExclamationTriangle, FaTimesCircle, FaBook, FaCheckCircle } from "react-icons/fa";
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import type { ClinicalCase } from "@/types/case";

interface FeedbackProps {
  clinicalCase: ClinicalCase;
}

interface FeedbackData {
  nota: number;
  fallas: string[];
  mejoras: string[];
  puntosFuertes: string[];
  puntosDebiles: string[];
  queRepasar: string[];
}

// Datos de ejemplo - esto debería venir de una API
const mockFeedbackData: FeedbackData = {
  nota: 5.5,
  fallas: [
    "No preguntaste sobre alergias a medicamentos",
    "Faltó indagar sobre antecedentes familiares de enfermedades cardiovasculares",
    "No exploraste completamente la historia del dolor torácico"
  ],
  mejoras: [
    "Realizar una anamnesis más exhaustiva sobre antecedentes familiares",
    "Preguntar sobre factores de riesgo cardiovascular",
    "Indagar más sobre las características del dolor"
  ],
  puntosFuertes: [
    "Buena comunicación con el paciente",
    "Identificaste correctamente los síntomas principales",
    "Preguntaste sobre medicamentos actuales"
  ],
  puntosDebiles: [
    "Anamnesis incompleta de antecedentes familiares",
    "No exploraste factores de riesgo",
    "Faltó profundizar en la cronología de los síntomas"
  ],
  queRepasar: [
    "Anamnesis de dolor torácico",
    "Factores de riesgo cardiovascular",
    "Interpretación de ECG en síndrome coronario agudo"
  ]
};

function GaugeChart({ value, max = 7 }: { value: number; max?: number }) {
  const percentage = (value / max) * 100;
  
  const getColor = () => {
    if (value >= 6.0) return "#10b981";
    if (value >= 4.0) return "#f59e0b";
    return "#ef4444";
  };

  const getEmoji = () => {
    if (value >= 6.0) return "🎉";
    if (value >= 4.0) return "⚠️";
    return "❌";
  };

  const getText = () => {
    if (value >= 6.0) return "Excelente";
    if (value >= 4.0) return "Regular";
    return "Necesita Mejora";
  };

  const data = [
    { name: "filled", value: percentage, color: getColor() },
    { name: "empty", value: 100 - percentage, color: "#e5e7eb" }
  ];

  return (
    <div className="flex flex-col items-center">
      <div className="relative w-36 h-36 flex-shrink-0">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              startAngle={180}
              endAngle={0}
              innerRadius={45}
              outerRadius={65}
              dataKey="value"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <div className="text-2xl font-bold" style={{ color: getColor() }}>
            {value.toFixed(1)}
          </div>
          <div className="text-xs text-gray-500">/ {max}.0</div>
        </div>
      </div>
      <div className="text-center mt-2 w-full">
        <div className="text-lg mb-0.5">{getEmoji()}</div>
        <div className="text-xs font-medium" style={{ color: getColor() }}>
          {getText()}
        </div>
      </div>
    </div>
  );
}

export default function Feedback({ clinicalCase }: FeedbackProps) {
  const feedbackData = mockFeedbackData;
  
  // Get final diagnosis
  const finalDiagnosis = clinicalCase.diagnostico_principal || "Sin diagnóstico";
  
  // Determine if passed (nota >= 6.0)
  const isPassed = feedbackData.nota >= 6.0;

  const handleDownload = () => {
    const informe = `
INFORME DE FEEDBACK - SIMULACIÓN CLÍNICA
=========================================

NOTA FINAL: ${feedbackData.nota}/7.0

FALLAS DURANTE LA ANAMNESIS:
${feedbackData.fallas.map((f, i) => `${i + 1}. ${f}`).join('\n')}

PUNTOS FUERTES:
${feedbackData.puntosFuertes.map((p, i) => `${i + 1}. ${p}`).join('\n')}

PUNTOS DÉBILES:
${feedbackData.puntosDebiles.map((p, i) => `${i + 1}. ${p}`).join('\n')}

POSIBLES MEJORAS:
${feedbackData.mejoras.map((m, i) => `${i + 1}. ${m}`).join('\n')}

QUÉ REPASAR:
${feedbackData.queRepasar.map((r, i) => `${i + 1}. ${r}`).join('\n')}
    `.trim();

    const blob = new Blob([informe], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `feedback-simulacion-${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="w-full max-w-7xl mx-auto bg-white rounded-lg shadow-lg border border-gray-200 p-8 h-[99vh] overflow-y-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8 pb-6 border-b border-gray-200">
        <div className="flex items-center gap-3 flex-1">
          {isPassed ? (
            <FaCheckCircle className="text-green-500 text-2xl flex-shrink-0" />
          ) : (
            <FaTimesCircle className="text-red-500 text-2xl flex-shrink-0" />
          )}
          <h2 className="text-2xl font-bold text-gray-900">
            Feedback Simulación: {finalDiagnosis}
          </h2>
        </div>
      </div>

      {/* Grid de 2 columnas */}
      <div className="grid grid-cols-2 md:grid-cols-2 gap-6">
        {/* Columna Izquierda - Errores */}
        <div>
          <div className="flex items-center gap-3 mb-3">
            <FaExclamationTriangle className="text-red-500 text-xl flex-shrink-0" />
            <h3 className="text-lg font-semibold text-gray-900">Errores</h3>
          </div>
          <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
            <ul className="space-y-1.5">
              {feedbackData.fallas.map((falla, idx) => (
                <li key={idx} className="text-gray-700 text-sm flex items-start gap-2">
                  <span className="text-red-500 mt-1 flex-shrink-0">•</span>
                  <span>{falla}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Gauge Chart */}
        </div>

        {/* Columna Derecha - Calificación */}
        <div>
          <div className="flex items-center gap-3 mb-3">
            <FaTimesCircle className="text-blue-500 text-xl flex-shrink-0" />
            <h3 className="text-lg font-semibold text-gray-900">Calificación</h3>
          </div>
          <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
            <div className="flex justify-center">
              <GaugeChart value={feedbackData.nota} />
            </div>
          </div>
        </div>
      </div>

      {/* Qué Repasar - Full Width */}
      <div className="mt-6">
        <div className="flex items-center gap-3 mb-3">
          <FaBook className="text-purple-500 text-xl flex-shrink-0" />
          <h3 className="text-lg font-semibold text-gray-900">Qué Repasar</h3>
        </div>
        <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
          <ul className="space-y-1.5">
            {feedbackData.queRepasar.map((tema, idx) => (
              <li key={idx} className="text-gray-700 text-sm flex items-start gap-2">
                <span className="text-purple-500 mt-1 flex-shrink-0">•</span>
                <span>{tema}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Botón Descargar */}
      <div className="text-center mt-8 pb-4">
        <button
          onClick={handleDownload}
          className="bg-[#1098f7] hover:bg-[#0d7fd6] text-white font-medium py-3 px-8 rounded-lg transition-colors duration-200 flex items-center gap-2 mx-auto"
        >
          <FaDownload className="w-5 h-5" />
          Descargar Informe
        </button>
      </div>
    </div>
  );
}
