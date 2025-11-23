"use client";

import { useRouter } from "next/navigation";
import { FaDownload, FaExclamationTriangle, FaTimesCircle, FaBook, FaCheckCircle, FaShare, FaCheck, FaStar, FaChartLine } from "react-icons/fa";
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import type { ClinicalCase } from "@/types/case";
import jsPDF from "jspdf";

interface FeedbackProps {
  clinicalCase: ClinicalCase;
  feedback?: any;
}

function GaugeChart({ value, max = 7 }: { value: number; max?: number }) {
  const percentage = ((value - 1) / (max - 1)) * 100;
  
  const getColor = () => {
    if (value >= 5.0) return "#10b981";
    if (value >= 4.0) return "#f59e0b";
    return "#ef4444";
  };

  const getGradientColor = () => {
    if (value >= 5.0) return ["#10b981", "#059669", "#047857"];
    if (value >= 4.0) return ["#f59e0b", "#d97706", "#b45309"];
    return ["#ef4444", "#dc2626", "#b91c1c"];
  };

  const getEmoji = () => {
    if (value >= 5.0) return "🎉";
    if (value >= 4.0) return "⚠️";
    return "❌";
  };

  const getText = () => {
    if (value >= 5.0) return "Excelente";
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

const puntajeLabels: Record<string, string> = {
  anamnesis_motivo_consulta: "Anamnesis y motivo de consulta",
  identificacion_sintomas: "Identificación de síntomas y signos",
  antecedentes: "Antecedentes mórbidos y farmacológicos",
  razonamiento_clinico: "Razonamiento clínico y diagnóstico diferencial",
  comunicacion_empatia: "Comunicación efectiva y empatía",
  manejo_derivacion: "Manejo y decisiones de derivación (APS)",
};

export default function Feedback({ clinicalCase, feedback }: FeedbackProps) {
  const router = useRouter();
  
  if (!feedback) {
    return (
      <div className="w-full max-w-7xl mx-auto bg-white rounded-lg shadow-lg border border-gray-200 p-6 h-[99vh] overflow-y-auto">
        <div className="flex items-center justify-center min-h-[50vh]">
          <p className="text-lg text-gray-500">Cargando feedback...</p>
        </div>
      </div>
    );
  }

  // Calculate average score from puntajes
  const puntajes = feedback.puntajes || {};
  const scores = Object.values(puntajes) as number[];
  const notaPromedio = scores.length > 0 
    ? scores.reduce((a, b) => a + b, 0) / scores.length 
    : 0;

  // Get diagnosis info
  const diagnostico = feedback.diagnostico || {};
  const diagnosticoEstudiante = diagnostico.estudiante || "No especificado";
  const diagnosticoReal = diagnostico.diagnostico_real || clinicalCase.diagnostico_principal || "Sin diagnóstico";
  const diagnosticoCorrecto = diagnostico.correcto || false;
  const diagnosticoComentario = diagnostico.comentario || "";

  // Get comments
  const comentarios = feedback.comentarios || {};
  const fortalezas = comentarios.fortalezas || [];
  const debilidades = comentarios.debilidades || [];
  const sugerencias = comentarios.sugerencias || [];

  // Determine if passed (nota >= 4.0 out of 7.0, sistema chileno)
  const isPassed = notaPromedio >= 4.0;

  const handleDownload = () => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 15;
    let yPosition = margin;

    // Colors - more subtle
    const lightGray = [240, 240, 240];
    const darkGray = [100, 100, 100];
    const primaryColor = [16, 152, 247]; // Just for subtle accents

    // Header - simple line
    doc.setDrawColor(200, 200, 200);
    doc.setLineWidth(0.5);
    doc.line(margin, yPosition, pageWidth - margin, yPosition);
    yPosition += 5;
    
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.text("INFORME DE FEEDBACK - SIMULACIÓN CLÍNICA", pageWidth / 2, yPosition, { align: "center" });
    yPosition += 6;
    
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(darkGray[0], darkGray[1], darkGray[2]);
    const fecha = new Date().toLocaleDateString("es-ES", { 
      year: "numeric", 
      month: "long", 
      day: "numeric" 
    });
    doc.text(fecha, pageWidth / 2, yPosition, { align: "center" });
    doc.setTextColor(0, 0, 0);
    yPosition += 10;
    
    doc.setDrawColor(200, 200, 200);
    doc.line(margin, yPosition, pageWidth - margin, yPosition);
    yPosition += 8;

    // Calificación General
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("CALIFICACIÓN GENERAL", margin, yPosition);
    yPosition += 6;
    
    doc.setFontSize(18);
    doc.setFont("helvetica", "bold");
    doc.text(`${notaPromedio.toFixed(1)}/7.0`, margin, yPosition);
    yPosition += 12;

    // Puntajes por Criterio
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.text("PUNTAJES POR CRITERIO", margin, yPosition);
    yPosition += 6;
    
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    
    Object.entries(puntajes).forEach(([key, value], index) => {
      const label = puntajeLabels[key] || key;
      const score = value as number;
      
      // Simple row with minimal styling
      if (index % 2 === 0) {
        doc.setFillColor(lightGray[0], lightGray[1], lightGray[2]);
        doc.rect(margin, yPosition - 3, pageWidth - 2 * margin, 6, 'F');
      }
      
      doc.setTextColor(0, 0, 0);
      doc.setFont("helvetica", "normal");
      doc.text(label, margin + 2, yPosition + 1);
      
      doc.setFont("helvetica", "bold");
      doc.text(`${score.toFixed(1)}/7.0`, pageWidth - margin - 10, yPosition + 1, { align: "right" });
      
      yPosition += 6;
    });
    
    yPosition += 5;

    // Diagnóstico
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.text("DIAGNÓSTICO", margin, yPosition);
    yPosition += 6;
    
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    
    doc.setFont("helvetica", "bold");
    doc.text("Tu diagnóstico:", margin, yPosition);
    doc.setFont("helvetica", "normal");
    const splitDiagEst = doc.splitTextToSize(diagnosticoEstudiante, pageWidth - 2 * margin - 50);
    doc.text(splitDiagEst, margin + 45, yPosition);
    yPosition += Math.max(splitDiagEst.length * 4, 5);
    
    doc.setFont("helvetica", "bold");
    doc.text("Correcto:", margin, yPosition);
    doc.setFont("helvetica", "normal");
    const splitDiagReal = doc.splitTextToSize(diagnosticoReal, pageWidth - 2 * margin - 50);
    doc.text(splitDiagReal, margin + 45, yPosition);
    yPosition += Math.max(splitDiagReal.length * 4, 5);
    
    doc.setFont("helvetica", "bold");
    doc.text("Resultado:", margin, yPosition);
    doc.setFont("helvetica", "bold");
    doc.text(diagnosticoCorrecto ? 'Correcto' : 'Incorrecto', margin + 45, yPosition);
    yPosition += 5;
    
    if (diagnosticoComentario) {
      doc.setFont("helvetica", "italic");
      doc.setFontSize(7);
      const splitComment = doc.splitTextToSize(
        diagnosticoComentario,
        pageWidth - 2 * margin
      );
      doc.text(splitComment, margin, yPosition);
      yPosition += splitComment.length * 3 + 3;
    }
    yPosition += 3;

    // Manejo APS (si aplica)
    if (feedback.manejo && clinicalCase.especialidad === 'aps') {
      // Check if we need a new page
      if (yPosition > pageHeight - 80) {
        doc.addPage();
        yPosition = margin;
      }

      doc.setFontSize(11);
      doc.setFont("helvetica", "bold");
      doc.text("EVALUACIÓN DE MANEJO EN APS", margin, yPosition);
      yPosition += 6;
      
      doc.setFontSize(8);
      doc.setFont("helvetica", "normal");
      
      // Evaluación de checkmarks
      const checks = [
        { label: 'Decisión de derivación correcta', value: feedback.manejo.derivacion_correcta },
        { label: 'Tipo de derivación adecuado', value: feedback.manejo.tipo_derivacion_adecuado },
        { label: 'Manejo inicial apropiado', value: feedback.manejo.manejo_inicial_apropiado },
        { label: 'Consideró ingreso a programa', value: feedback.manejo.considero_ingreso_programa },
        { label: 'Definió metas terapéuticas', value: feedback.manejo.metas_terapeuticas_definidas },
        { label: 'Educación y seguimiento apropiados', value: feedback.manejo.educacion_y_seguimiento_apropiados },
        { label: 'Consideró factores psicosociales', value: feedback.manejo.considero_factores_psicosociales }
      ];

      checks.forEach(check => {
        if (check.value !== undefined) {
          const checkmark = check.value ? '✓' : '✗';
          doc.setFont("helvetica", "bold");
          doc.text(`${checkmark}`, margin, yPosition);
          doc.setFont("helvetica", "normal");
          doc.text(check.label, margin + 5, yPosition);
          yPosition += 4;
        }
      });
      yPosition += 2;

      // Comentario de manejo
      if (feedback.manejo.comentario) {
        doc.setFont("helvetica", "italic");
        doc.setFontSize(7);
        const splitManejo = doc.splitTextToSize(
          feedback.manejo.comentario,
          pageWidth - 2 * margin
        );
        doc.text(splitManejo, margin, yPosition);
        yPosition += splitManejo.length * 3 + 3;
      }

      // Recomendaciones específicas
      if (feedback.manejo.recomendaciones_especificas) {
        // Check if we need a new page
        if (yPosition > pageHeight - 60) {
          doc.addPage();
          yPosition = margin;
        }

        doc.setFontSize(10);
        doc.setFont("helvetica", "bold");
        doc.text("MANEJO CORRECTO PARA ESTE CASO", margin, yPosition);
        yPosition += 6;
        
        doc.setFontSize(8);
        const recs = feedback.manejo.recomendaciones_especificas;

        // Derivación
        doc.setFont("helvetica", "bold");
        doc.text("Derivación:", margin, yPosition);
        yPosition += 4;
        doc.setFont("helvetica", "normal");
        const splitDeriv = doc.splitTextToSize(recs.derivacion, pageWidth - 2 * margin - 5);
        doc.text(splitDeriv, margin + 5, yPosition);
        yPosition += splitDeriv.length * 3 + 2;

        // Programa APS
        doc.setFont("helvetica", "bold");
        doc.text("Programa APS:", margin, yPosition);
        yPosition += 4;
        doc.setFont("helvetica", "normal");
        const splitProg = doc.splitTextToSize(recs.programa_aps, pageWidth - 2 * margin - 5);
        doc.text(splitProg, margin + 5, yPosition);
        yPosition += splitProg.length * 3 + 2;

        // Metas terapéuticas
        if (recs.metas_terapeuticas.length > 0) {
          doc.setFont("helvetica", "bold");
          doc.text("Metas terapéuticas:", margin, yPosition);
          yPosition += 4;
          doc.setFont("helvetica", "normal");
          recs.metas_terapeuticas.forEach((meta: string) => {
            const splitMeta = doc.splitTextToSize(`• ${meta}`, pageWidth - 2 * margin - 5);
            doc.text(splitMeta, margin + 5, yPosition);
            yPosition += splitMeta.length * 3 + 1;
          });
          yPosition += 1;
        }

        // Manejo CESFAM
        if (recs.manejo_cesfam.length > 0) {
          // Check if we need a new page
          if (yPosition > pageHeight - 40) {
            doc.addPage();
            yPosition = margin;
          }

          doc.setFont("helvetica", "bold");
          doc.text("Manejo inicial en CESFAM:", margin, yPosition);
          yPosition += 4;
          doc.setFont("helvetica", "normal");
          recs.manejo_cesfam.forEach((accion: string) => {
            const splitAccion = doc.splitTextToSize(`• ${accion}`, pageWidth - 2 * margin - 5);
            doc.text(splitAccion, margin + 5, yPosition);
            yPosition += splitAccion.length * 3 + 1;
          });
          yPosition += 1;
        }

        // Educación
        if (recs.educacion_paciente.length > 0) {
          // Check if we need a new page
          if (yPosition > pageHeight - 40) {
            doc.addPage();
            yPosition = margin;
          }

          doc.setFont("helvetica", "bold");
          doc.text("Educación al paciente:", margin, yPosition);
          yPosition += 4;
          doc.setFont("helvetica", "normal");
          recs.educacion_paciente.forEach((edu: string) => {
            const splitEdu = doc.splitTextToSize(`• ${edu}`, pageWidth - 2 * margin - 5);
            doc.text(splitEdu, margin + 5, yPosition);
            yPosition += splitEdu.length * 3 + 1;
          });
          yPosition += 1;
        }

        // Seguimiento
        doc.setFont("helvetica", "bold");
        doc.text("Seguimiento:", margin, yPosition);
        yPosition += 4;
        doc.setFont("helvetica", "normal");
        const splitSeg = doc.splitTextToSize(recs.seguimiento, pageWidth - 2 * margin - 5);
        doc.text(splitSeg, margin + 5, yPosition);
        yPosition += splitSeg.length * 3 + 4;
      }
    }

    // Check if we need a new page before Fortalezas
    if (yPosition > pageHeight - 40) {
      doc.addPage();
      yPosition = margin;
    }

    // Fortalezas
    if (fortalezas.length > 0) {
      doc.setFontSize(11);
      doc.setFont("helvetica", "bold");
      doc.text("FORTALEZAS", margin, yPosition);
      yPosition += 6;
      
      doc.setFontSize(8);
      doc.setFont("helvetica", "normal");
      
      fortalezas.forEach((fortaleza: string, i: number) => {
        const splitText = doc.splitTextToSize(
          `${i + 1}. ${fortaleza}`,
          pageWidth - 2 * margin
        );
        doc.text(splitText, margin, yPosition);
        yPosition += splitText.length * 3.5;
      });
      yPosition += 3;
    }

    // Debilidades
    if (debilidades.length > 0) {
      doc.setFontSize(11);
      doc.setFont("helvetica", "bold");
      doc.text("ÁREAS DE MEJORA", margin, yPosition);
      yPosition += 6;
      
      doc.setFontSize(8);
      doc.setFont("helvetica", "normal");
      
      debilidades.forEach((debilidad: string, i: number) => {
        const splitText = doc.splitTextToSize(
          `${i + 1}. ${debilidad}`,
          pageWidth - 2 * margin
        );
        doc.text(splitText, margin, yPosition);
        yPosition += splitText.length * 3.5;
      });
      yPosition += 3;
    }

    // Sugerencias
    if (sugerencias.length > 0) {
      doc.setFontSize(11);
      doc.setFont("helvetica", "bold");
      doc.text("SUGERENCIAS PARA MEJORAR", margin, yPosition);
      yPosition += 6;
      
      doc.setFontSize(8);
      doc.setFont("helvetica", "normal");
      
      sugerencias.forEach((sugerencia: string, i: number) => {
        const splitText = doc.splitTextToSize(
          `${i + 1}. ${sugerencia}`,
          pageWidth - 2 * margin
        );
        doc.text(splitText, margin, yPosition);
        yPosition += splitText.length * 3.5;
      });
    }

    // Save PDF
    const fileName = `feedback-simulacion-${new Date().toISOString().split('T')[0]}.pdf`;
    doc.save(fileName);
  };

  const handleShare = async () => {
    const shareData = {
      title: `Feedback Simulación: ${diagnosticoReal}`,
      text: `Nota: ${notaPromedio.toFixed(1)}/7.0 - ${isPassed ? 'Aprobado' : 'Reprobado'}`,
      url: window.location.href,
    };

    try {
      if (navigator.share && navigator.canShare && navigator.canShare(shareData)) {
        await navigator.share(shareData);
      } else {
        const textToCopy = `${shareData.title}\n${shareData.text}\n${shareData.url}`;
        await navigator.clipboard.writeText(textToCopy);
        alert('Enlace copiado al portapapeles');
      }
    } catch (err) {
      if ((err as Error).name !== 'AbortError') {
        const textToCopy = `${shareData.title}\n${shareData.text}\n${shareData.url}`;
        await navigator.clipboard.writeText(textToCopy);
        alert('Enlace copiado al portapapeles');
      }
    }
  };

  const handleFinalize = () => {
    sessionStorage.removeItem('feedbackData');
    router.push('/');
  };

  return (
    <div className="w-full max-w-7xl mx-auto bg-white rounded-lg shadow-lg border border-gray-200 p-6 ">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 pb-4 border-b border-gray-200">
        <div className="flex items-center gap-2 flex-1">
          {diagnosticoCorrecto ? (
            <FaCheckCircle className="text-green-500 text-lg flex-shrink-0" />
          ) : (
            <FaTimesCircle className="text-red-500 text-lg flex-shrink-0" />
          )}
          <h2 className="text-lg font-bold text-gray-900">
            {diagnosticoCorrecto ? "Diagnóstico Correcto" : "Diagnóstico Incorrecto"} - {diagnosticoReal}
          </h2>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleShare}
            className="bg-green-500 hover:bg-green-600 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200 flex items-center gap-2"
          >
            <FaShare className="w-4 h-4" />
            Compartir
          </button>
          <button
            onClick={handleDownload}
            className="bg-[#1098f7] hover:bg-[#0d7fd6] text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200 flex items-center gap-2"
          >
            <FaDownload className="w-4 h-4" />
            Descargar informe
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

      {/* Diagnóstico Section */}
      <div className="mb-6 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg p-5 border-2 border-blue-200">
        <div className="flex items-start gap-4">
          {diagnosticoCorrecto ? (
            <FaCheckCircle className="text-green-500 text-2xl flex-shrink-0 mt-1" />
          ) : (
            <FaTimesCircle className="text-red-500 text-2xl flex-shrink-0 mt-1" />
          )}
          <div className="flex-1">
            <h3 className="text-xl font-bold text-gray-900 mb-3">Diagnóstico</h3>
            <div className="space-y-2">
              <div>
                <span className="text-sm font-semibold text-gray-600">Tu diagnóstico: </span>
                <span className="text-base text-gray-800">{diagnosticoEstudiante}</span>
              </div>
              <div>
                <span className="text-sm font-semibold text-gray-600">Diagnóstico correcto: </span>
                <span className="text-base text-gray-800 font-medium">{diagnosticoReal}</span>
              </div>
              {diagnosticoComentario && (
                <div className="bg-white border-l-4 border-blue-500 p-3 rounded mt-3">
                  <p className="text-sm text-gray-700">{diagnosticoComentario}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Manejo APS - Solo para casos de APS */}
      {feedback.manejo && clinicalCase.especialidad === "aps" && (
        <div className="bg-white rounded-lg p-6 border-2 border-gray-200 mb-6">
          <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            {feedback.manejo.derivacion_correcta && 
             feedback.manejo.tipo_derivacion_adecuado && 
             feedback.manejo.manejo_inicial_apropiado ? (
              <FaCheckCircle className="text-green-500" />
            ) : (
              <FaTimesCircle className="text-orange-500" />
            )}
            Evaluación de Manejo en APS
          </h3>

          {/* Evaluación de lo que hizo el estudiante */}
          <div className="mb-4">
            <h4 className="font-semibold text-gray-700 mb-3 text-sm">Tu desempeño:</h4>
            <div className="grid grid-cols-2 gap-2">
              <div className="flex items-center gap-2 p-2 bg-gray-50 rounded text-xs">
                {feedback.manejo.derivacion_correcta ? (
                  <FaCheckCircle className="text-green-500 shrink-0" />
                ) : (
                  <FaTimesCircle className="text-red-500 shrink-0" />
                )}
                <span>Decisión de derivación correcta</span>
              </div>
              <div className="flex items-center gap-2 p-2 bg-gray-50 rounded text-xs">
                {feedback.manejo.tipo_derivacion_adecuado ? (
                  <FaCheckCircle className="text-green-500 shrink-0" />
                ) : (
                  <FaTimesCircle className="text-red-500 shrink-0" />
                )}
                <span>Tipo de derivación adecuado</span>
              </div>
              <div className="flex items-center gap-2 p-2 bg-gray-50 rounded text-xs">
                {feedback.manejo.manejo_inicial_apropiado ? (
                  <FaCheckCircle className="text-green-500 shrink-0" />
                ) : (
                  <FaTimesCircle className="text-red-500 shrink-0" />
                )}
                <span>Manejo inicial apropiado</span>
              </div>
              {feedback.manejo.considero_ingreso_programa !== undefined && (
                <div className="flex items-center gap-2 p-2 bg-gray-50 rounded text-xs">
                  {feedback.manejo.considero_ingreso_programa ? (
                    <FaCheckCircle className="text-green-500 shrink-0" />
                  ) : (
                    <FaTimesCircle className="text-red-500 shrink-0" />
                  )}
                  <span>Consideró ingreso a programa</span>
                </div>
              )}
              {feedback.manejo.metas_terapeuticas_definidas !== undefined && (
                <div className="flex items-center gap-2 p-2 bg-gray-50 rounded text-xs">
                  {feedback.manejo.metas_terapeuticas_definidas ? (
                    <FaCheckCircle className="text-green-500 shrink-0" />
                  ) : (
                    <FaTimesCircle className="text-red-500 shrink-0" />
                  )}
                  <span>Definió metas terapéuticas</span>
                </div>
              )}
              {feedback.manejo.educacion_y_seguimiento_apropiados !== undefined && (
                <div className="flex items-center gap-2 p-2 bg-gray-50 rounded text-xs">
                  {feedback.manejo.educacion_y_seguimiento_apropiados ? (
                    <FaCheckCircle className="text-green-500 shrink-0" />
                  ) : (
                    <FaTimesCircle className="text-red-500 shrink-0" />
                  )}
                  <span>Educación y seguimiento apropiados</span>
                </div>
              )}
              {feedback.manejo.considero_factores_psicosociales !== undefined && (
                <div className="flex items-center gap-2 p-2 bg-gray-50 rounded text-xs">
                  {feedback.manejo.considero_factores_psicosociales ? (
                    <FaCheckCircle className="text-green-500 shrink-0" />
                  ) : (
                    <FaTimesCircle className="text-red-500 shrink-0" />
                  )}
                  <span>Consideró factores psicosociales</span>
                </div>
              )}
            </div>
          </div>

          {/* Comentario general */}
          <div className="bg-blue-50 border-l-4 border-blue-500 p-3 rounded mb-4">
            <p className="text-xs text-gray-700"><strong>Comentario:</strong> {feedback.manejo.comentario}</p>
          </div>

          {/* Recomendaciones específicas */}
          {feedback.manejo.recomendaciones_especificas && (
            <div className="p-4 bg-green-50 border-2 border-green-200 rounded-lg">
              <h4 className="font-semibold text-green-900 mb-3 flex items-center gap-2 text-sm">
                <FaCheckCircle className="text-green-600" />
                Manejo Correcto para este Caso
              </h4>
              <div className="space-y-3 text-xs">
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
          )}
        </div>
      )}

      {/* Grid de 2 columnas */}
      <div className="grid grid-cols-2 md:grid-cols-2 gap-6 mb-6">
        {/* Columna Izquierda - Puntajes Detallados */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <FaChartLine className="text-blue-500 text-base flex-shrink-0" />
            <h3 className="text-base font-semibold text-gray-900">Puntajes por Criterio</h3>
          </div>
          <div className="bg-blue-50 rounded-lg p-4 border-2 border-blue-200">
            <div className="space-y-3">
              {Object.entries(puntajes).map(([key, value]) => {
                const numValue = value as number;
                const percentage = Math.max(0, ((numValue - 1) / 6) * 100);
                return (
                  <div key={key}>
                    <div className="flex justify-between mb-1">
                      <span className="text-xs font-medium text-gray-700">
                        {puntajeLabels[key] || key}
                      </span>
                      <span className="text-xs font-bold text-[#1098f7]">
                        {numValue.toFixed(1)}/7.0
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-gradient-to-r from-[#1098f7] to-[#0d7fd6] h-2 rounded-full transition-all duration-500"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Columna Derecha - Calificación General */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <FaStar className="text-blue-500 text-base flex-shrink-0" />
            <h3 className="text-base font-semibold text-gray-900">Calificación General</h3>
          </div>
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg p-4 border-2 border-blue-200">
            <div className="flex justify-center">
              <GaugeChart value={notaPromedio} max={5} />
            </div>
            <div className="mt-3 pt-3 border-t border-blue-200">
              <p className="text-xs text-gray-600 text-center">
                Promedio de todos los criterios evaluados
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Fortalezas y Debilidades */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {/* Fortalezas */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <FaCheckCircle className="text-green-500 text-base flex-shrink-0" />
            <h3 className="text-base font-semibold text-gray-900">Fortalezas</h3>
          </div>
          <div className="bg-green-50 rounded-lg p-4 border-2 border-green-200">
            <ul className="space-y-2">
              {fortalezas.length > 0 ? (
                fortalezas.map((fortaleza: string, idx: number) => (
                  <li key={idx} className="text-sm text-gray-800 flex gap-2">
                    <span className="text-green-500 flex-shrink-0">✓</span>
                    <span>{fortaleza}</span>
                  </li>
                ))
              ) : (
                <li className="text-sm text-gray-500 italic">No hay fortalezas registradas</li>
              )}
            </ul>
          </div>
        </div>

        {/* Debilidades */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <FaExclamationTriangle className="text-orange-500 text-base flex-shrink-0" />
            <h3 className="text-base font-semibold text-gray-900">Áreas de Mejora</h3>
          </div>
          <div className="bg-orange-50 rounded-lg p-4 border-2 border-orange-200">
            <ul className="space-y-2">
              {debilidades.length > 0 ? (
                debilidades.map((debilidad: string, idx: number) => (
                  <li key={idx} className="text-sm text-gray-800 flex gap-2">
                    <span className="text-orange-500 flex-shrink-0">!</span>
                    <span>{debilidad}</span>
                  </li>
                ))
              ) : (
                <li className="text-sm text-gray-500 italic">No hay debilidades registradas</li>
              )}
            </ul>
          </div>
        </div>
      </div>

      {/* Sugerencias - Full Width */}
      <div className="mt-4">
        <div className="flex items-center gap-2 mb-3">
          <FaBook className="text-purple-500 text-base flex-shrink-0" />
          <h3 className="text-base font-semibold text-gray-900">Sugerencias para Mejorar</h3>
        </div>
        <div className="bg-gradient-to-br from-purple-50 via-indigo-50 to-blue-50 rounded-lg p-5 border-2 border-purple-200">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {sugerencias.length > 0 ? (
              sugerencias.map((sugerencia: string, idx: number) => (
                <div
                  key={idx}
                  className="bg-white rounded-lg p-3 border border-purple-100 shadow-sm hover:shadow-md transition-shadow flex items-start gap-3"
                >
                  <div className="flex-shrink-0 w-6 h-6 bg-purple-100 rounded-full flex items-center justify-center mt-0.5">
                    <span className="text-purple-600 font-bold text-xs">{idx + 1}</span>
                  </div>
                  <span className="text-gray-800 text-sm font-medium flex-1">{sugerencia}</span>
                </div>
              ))
            ) : (
              <div className="col-span-2 text-sm text-gray-500 italic text-center py-4">
                No hay sugerencias registradas
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
