import { createChatCompletion } from "@/lib/openai";
import { feedbackPrompts } from "@/lib/prompts";
import type { ClinicalCase, ChatMessage, FeedbackResult } from "@/types/case";

/**
 * Feedback Agent
 * Evaluates the student's clinical interview and diagnosis
 */

/**
 * Removes source references from text (e.g., 【4:6†source】)
 */
function cleanSourceReferences(text: string): string {
  // Remove references in the format 【number:number†source】
  return text.replace(/【\d+:\d+†source】/g, '').trim();
}

/**
 * Cleans source references from array of strings
 */
function cleanArrayReferences(arr: string[]): string[] {
  return arr.map(item => cleanSourceReferences(item));
}

/**
 * Generates comprehensive feedback for a completed simulation
 */
export async function generateFeedback(
  clinicalCase: ClinicalCase,
  chatHistory: ChatMessage[],
  studentDiagnosis: string
): Promise<FeedbackResult> {
  // Build conversation transcript
  const conversationText = chatHistory
    .map((msg) => {
      const speaker = msg.role === "user" ? "Estudiante" : "Paciente";
      return `${speaker}: ${msg.content}`;
    })
    .join("\n\n");

  const systemPrompt = feedbackPrompts.system(
    clinicalCase,
    conversationText,
    studentDiagnosis
  );
  const userPrompt = feedbackPrompts.user();

  try {
    const response = await createChatCompletion(
      [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      {
        temperature: 0.7,
        maxTokens: 2000,
        responseFormat: { type: "json_object" },
      }
    );

    const feedbackData = JSON.parse(response);

    // Validate and structure the response
    const feedback: FeedbackResult = {
      puntajes: {
        anamnesis_motivo_consulta: feedbackData.puntajes?.anamnesis_motivo_consulta || 1,
        identificacion_sintomas: feedbackData.puntajes?.identificacion_sintomas || 1,
        antecedentes: feedbackData.puntajes?.antecedentes || 1,
        razonamiento_clinico: feedbackData.puntajes?.razonamiento_clinico || 1,
        comunicacion_empatia: feedbackData.puntajes?.comunicacion_empatia || 1,
        // Incluir puntaje de manejo/derivación si es caso APS
        ...(clinicalCase.especialidad === "aps" && feedbackData.puntajes?.manejo_derivacion !== undefined
          ? { manejo_derivacion: feedbackData.puntajes.manejo_derivacion }
          : {}),
      },
      comentarios: {
        fortalezas: feedbackData.comentarios?.fortalezas || [],
        debilidades: feedbackData.comentarios?.debilidades || [],
        sugerencias: feedbackData.comentarios?.sugerencias || [],
      },
      diagnostico: {
        estudiante: studentDiagnosis,
        correcto: feedbackData.diagnostico?.correcto || false,
        diagnostico_real: clinicalCase.diagnostico_principal,
        comentario: feedbackData.diagnostico?.comentario || "",
      },
      // Incluir evaluación de manejo si es caso APS
      ...(clinicalCase.especialidad === "aps" && feedbackData.manejo
        ? {
            manejo: {
              derivacion_correcta: feedbackData.manejo.derivacion_correcta || false,
              tipo_derivacion_adecuado: feedbackData.manejo.tipo_derivacion_adecuado || false,
              manejo_inicial_apropiado: feedbackData.manejo.manejo_inicial_apropiado || false,
              considero_ingreso_programa: feedbackData.manejo.considero_ingreso_programa,
              metas_terapeuticas_definidas: feedbackData.manejo.metas_terapeuticas_definidas,
              educacion_y_seguimiento_apropiados: feedbackData.manejo.educacion_y_seguimiento_apropiados,
              considero_factores_psicosociales: feedbackData.manejo.considero_factores_psicosociales,
              comentario: cleanSourceReferences(feedbackData.manejo.comentario || ""),
              recomendaciones_especificas: feedbackData.manejo.recomendaciones_especificas
                ? {
                    derivacion: cleanSourceReferences(feedbackData.manejo.recomendaciones_especificas.derivacion || ""),
                    programa_aps: cleanSourceReferences(feedbackData.manejo.recomendaciones_especificas.programa_aps || ""),
                    metas_terapeuticas: cleanArrayReferences(feedbackData.manejo.recomendaciones_especificas.metas_terapeuticas || []),
                    manejo_cesfam: cleanArrayReferences(feedbackData.manejo.recomendaciones_especificas.manejo_cesfam || []),
                    educacion_paciente: cleanArrayReferences(feedbackData.manejo.recomendaciones_especificas.educacion_paciente || []),
                    seguimiento: cleanSourceReferences(feedbackData.manejo.recomendaciones_especificas.seguimiento || ""),
                  }
                : undefined,
            },
          }
        : {}),
    };

    return feedback;
  } catch (error) {
    console.error("Error generating feedback:", error);
    throw new Error("Failed to generate feedback");
  }
}

/**
 * Calculates average score from feedback
 */
export function calculateAverageScore(feedback: FeedbackResult): number {
  const scores = Object.values(feedback.puntajes);
  const sum = scores.reduce((acc, score) => acc + score, 0);
  return Math.round((sum / scores.length) * 10) / 10;
}

/**
 * Gets performance level based on average score (escala chilena 1.0-7.0)
 */
export function getPerformanceLevel(averageScore: number): string {
  if (averageScore >= 6.0) return "Excelente";
  if (averageScore >= 5.0) return "Bueno";
  if (averageScore >= 4.0) return "Aceptable";
  if (averageScore >= 3.0) return "Necesita mejorar";
  return "Insuficiente";
}

/**
 * Quick feedback summary for UI display
 */
export interface FeedbackSummary {
  averageScore: number;
  performanceLevel: string;
  diagnosisCorrect: boolean;
  totalQuestions: number;
  topStrengths: string[];
  topWeaknesses: string[];
}

export function createFeedbackSummary(
  feedback: FeedbackResult,
  chatHistory: ChatMessage[]
): FeedbackSummary {
  const averageScore = calculateAverageScore(feedback);
  const totalQuestions = chatHistory.filter(
    (msg) => msg.role === "user"
  ).length;

  return {
    averageScore,
    performanceLevel: getPerformanceLevel(averageScore),
    diagnosisCorrect: feedback.diagnostico.correcto,
    totalQuestions,
    topStrengths: feedback.comentarios.fortalezas.slice(0, 3),
    topWeaknesses: feedback.comentarios.debilidades.slice(0, 3),
  };
}
