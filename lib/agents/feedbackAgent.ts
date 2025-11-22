import { createChatCompletion } from "@/lib/openai";
import { feedbackPrompts } from "@/lib/prompts";
import type { ClinicalCase, ChatMessage, FeedbackResult } from "@/types/case";

/**
 * Feedback Agent
 * Evaluates the student's clinical interview and diagnosis
 */

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
        motivo_consulta: feedbackData.puntajes?.motivo_consulta || 1,
        sintomas_relevantes: feedbackData.puntajes?.sintomas_relevantes || 1,
        antecedentes: feedbackData.puntajes?.antecedentes || 1,
        red_flags: feedbackData.puntajes?.red_flags || 1,
        razonamiento_clinico: feedbackData.puntajes?.razonamiento_clinico || 1,
        comunicacion: feedbackData.puntajes?.comunicacion || 1,
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
 * Gets performance level based on average score
 */
export function getPerformanceLevel(averageScore: number): string {
  if (averageScore >= 4.5) return "Excelente";
  if (averageScore >= 3.5) return "Bueno";
  if (averageScore >= 2.5) return "Aceptable";
  if (averageScore >= 1.5) return "Necesita mejorar";
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
