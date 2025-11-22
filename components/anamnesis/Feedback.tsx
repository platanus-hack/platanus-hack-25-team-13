"use client";

import { useRouter } from "next/navigation";
import { FaDownload, FaExclamationTriangle, FaTimesCircle, FaBook, FaCheckCircle, FaShare, FaCheck, FaStar, FaExternalLinkAlt } from "react-icons/fa";
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

  const getGradientColor = () => {
    if (value >= 6.0) return ["#10b981", "#059669", "#047857"];
    if (value >= 4.0) return ["#f59e0b", "#d97706", "#b45309"];
    return ["#ef4444", "#dc2626", "#b91c1c"];
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

  const gradientColors = getGradientColor();
  const data = [
    { name: "filled", value: percentage, color: gradientColors[0] },
    { name: "empty", value: 100 - percentage, color: "#e5e7eb" }
  ];

  return (
    <div className="flex flex-col items-center">
      <div className="relative w-36 h-36 flex-shrink-0">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <defs>
              <linearGradient id="gaugeGradient" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor={gradientColors[0]} />
                <stop offset="50%" stopColor={gradientColors[1]} />
                <stop offset="100%" stopColor={gradientColors[2]} />
              </linearGradient>
            </defs>
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
                <Cell 
                  key={`cell-${index}`} 
                  fill={index === 0 ? "url(#gaugeGradient)" : entry.color}
                />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <div className="text-3xl font-bold" style={{ color: getColor() }}>
            {value.toFixed(1)}
          </div>
          <div className="text-xs text-gray-500 font-medium">/ {max}.0</div>
        </div>
      </div>
      <div className="text-center mt-0.5 w-full">
        <div className="text-lg mb-0.5">{getEmoji()}</div>
        <div className="text-xs font-bold" style={{ color: getColor() }}>
          {getText()}
        </div>
      </div>
    </div>
  );
}

export default function Feedback({ clinicalCase }: FeedbackProps) {
  const router = useRouter();
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

  const handleShare = async () => {
    const shareData = {
      title: `Feedback Simulación: ${finalDiagnosis}`,
      text: `Nota: ${feedbackData.nota}/7.0 - ${isPassed ? 'Aprobado' : 'Reprobado'}`,
      url: window.location.href,
    };

    try {
      if (navigator.share && navigator.canShare && navigator.canShare(shareData)) {
        await navigator.share(shareData);
      } else {
        // Fallback: copiar al portapapeles
        const textToCopy = `${shareData.title}\n${shareData.text}\n${shareData.url}`;
        await navigator.clipboard.writeText(textToCopy);
        alert('Enlace copiado al portapapeles');
      }
    } catch (err) {
      // Si el usuario cancela, no hacer nada
      if ((err as Error).name !== 'AbortError') {
        // Fallback: copiar al portapapeles
        const textToCopy = `${shareData.title}\n${shareData.text}\n${shareData.url}`;
        await navigator.clipboard.writeText(textToCopy);
        alert('Enlace copiado al portapapeles');
      }
    }
  };

  const handleFinalize = () => {
    // Limpiar datos de sesión si es necesario
    sessionStorage.removeItem('feedbackData');
    // Navegar a la página principal
    router.push('/');
  };

  const getStudyResourceLink = (tema: string) => {
    // Generar enlace de búsqueda en PubMed/Google Scholar
    const query = encodeURIComponent(`${tema} medicina`);
    return `https://scholar.google.com/scholar?q=${query}`;
  };

  const handleStudyResource = (tema: string) => {
    const link = getStudyResourceLink(tema);
    window.open(link, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="w-full max-w-7xl mx-auto bg-white rounded-lg shadow-lg border border-gray-200 p-6 h-[99vh] overflow-y-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 pb-4 border-b border-gray-200">
        <div className="flex items-center gap-2 flex-1">
          {isPassed ? (
            <FaCheckCircle className="text-green-500 text-lg flex-shrink-0" />
          ) : (
            <FaTimesCircle className="text-red-500 text-lg flex-shrink-0" />
          )}
          <h2 className="text-lg font-bold text-gray-900">
            Calificación final: Diagnostico {finalDiagnosis}
          </h2>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleShare}
            className="bg-green-500 hover:bg-green-600 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200 flex items-center gap-2"
          >
            <FaShare className="w-4 h-4" />
            Compartir Consulta
          </button>
          <button
            onClick={handleDownload}
            className="bg-[#1098f7] hover:bg-[#0d7fd6] text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200 flex items-center gap-2"
          >
            <FaDownload className="w-4 h-4" />
            Descargar Informe
          </button>
          <button
            onClick={handleFinalize}
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200 flex items-center gap-2"
          >
            <FaCheck className="w-4 h-4" />
            Finalizar
          </button>
        </div>
      </div>

      {/* Grid de 2 columnas */}
      <div className="grid grid-cols-2 md:grid-cols-2 gap-6">
        {/* Columna Izquierda - Errores */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <FaExclamationTriangle className="text-red-500 text-base flex-shrink-0" />
            <h3 className="text-base font-semibold text-gray-900">Errores</h3>
          </div>
          <div className="bg-red-50 rounded-lg p-4 border-2 border-red-200">
            <ul className="space-y-3">
              {feedbackData.fallas.map((falla, idx) => (
                <li key={idx} className="text-gray-800 text-base flex items-start gap-3">
                  <span className="text-red-600 mt-1 flex-shrink-0 font-bold">✗</span>
                  <div className="flex-1">
                    <span className="font-medium text-gray-900">{falla}</span>
                    <p className="text-xs text-gray-600 mt-1">
                      Este error indica que durante la anamnesis no se exploró adecuadamente este aspecto, lo cual puede afectar la precisión del diagnóstico.
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Columna Derecha - Calificación */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <FaStar className="text-blue-500 text-base flex-shrink-0" />
            <h3 className="text-base font-semibold text-gray-900">Calificación</h3>
          </div>
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg p-4 border-2 border-blue-200">
            <div className="flex justify-center">
              <GaugeChart value={feedbackData.nota} />
            </div>
            <div className="mt-3 pt-3 border-t border-blue-200">
              <p className="text-xs text-gray-600 text-center">
                Para un caso real, necesitarías mejorar aspectos como la exploración más exhaustiva de síntomas, 
                antecedentes familiares y factores de riesgo para alcanzar un diagnóstico más preciso.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Qué Repasar - Full Width */}
      <div className="mt-4">
        <div className="flex items-center gap-2 mb-3">
          <FaBook className="text-purple-500 text-base flex-shrink-0" />
          <h3 className="text-base font-semibold text-gray-900">Qué Repasar</h3>
        </div>
        <div className="bg-gradient-to-br from-purple-50 via-indigo-50 to-blue-50 rounded-lg p-5 border-2 border-purple-200">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {feedbackData.queRepasar.map((tema, idx) => (
              <div
                key={idx}
                className="bg-white rounded-lg p-3 border border-purple-100 shadow-sm hover:shadow-md transition-shadow flex items-center justify-between gap-3"
              >
                <div className="flex items-start gap-3 flex-1">
                  <div className="flex-shrink-0 w-6 h-6 bg-purple-100 rounded-full flex items-center justify-center mt-0.5">
                    <span className="text-purple-600 font-bold text-xs">{idx + 1}</span>
                  </div>
                  <span className="text-gray-800 text-sm font-medium flex-1">{tema}</span>
                </div>
                <button
                  onClick={() => handleStudyResource(tema)}
                  className="flex-shrink-0 bg-purple-500 hover:bg-purple-600 text-white p-2 rounded-lg transition-colors duration-200 flex items-center gap-1.5 text-xs font-medium"
                  title={`Estudiar: ${tema}`}
                >
                  <FaExternalLinkAlt className="w-3 h-3" />
                  <span className="hidden sm:inline">Estudiar</span>
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
