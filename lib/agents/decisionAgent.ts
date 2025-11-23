import { createChatCompletion } from "@/lib/openai";
import { decisionPrompts } from "@/lib/prompts";
import type { ChatMessage } from "@/types/case";

/**
 * Decision Agent (Router)
 * Analyzes user messages and decides which action to take
 */

export type SystemAction =
  | "patient_interaction"
  | "submit_diagnosis"
  | "end_simulation"
  | "request_exam";

export interface DecisionResult {
  action: SystemAction;
  reasoning: string;
  extractedDiagnosis: string | null;
  examRequest?: {
    tipo: string;
    clasificacion?: string;
    subclasificacion?: string;
  } | null;
}

/**
 * Analyzes a user message and decides what action the system should take
 */
export async function decideAction(
  message: string,
  chatHistory: ChatMessage[]
): Promise<DecisionResult> {
  // Build conversation context (last 4 messages for context)
  const recentMessages = chatHistory.slice(-4);
  const conversationContext =
    recentMessages.length > 0
      ? recentMessages
          .map(
            (msg) =>
              `${msg.role === "user" ? "Estudiante" : "Paciente"}: ${
                msg.content
              }`
          )
          .join("\n")
      : "No hay conversación previa";

  const systemPrompt = decisionPrompts.system();
  const userPrompt = decisionPrompts.user(message, conversationContext);

  try {
    const response = await createChatCompletion(
      [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      {
        temperature: 0.3, // Low temperature for consistent decisions
        maxTokens: 200,
        responseFormat: { type: "json_object" },
      }
    );

    const decision = JSON.parse(response);

    // Validate response
    if (
      !decision.action ||
      !["patient_interaction", "submit_diagnosis", "end_simulation", "request_exam"].includes(
        decision.action
      )
    ) {
      console.warn(
        "Invalid decision from LLM, defaulting to patient_interaction"
      );
      return {
        action: "patient_interaction",
        reasoning: "Default action due to invalid LLM response",
        extractedDiagnosis: null,
        examRequest: null,
      };
    }

    return {
      action: decision.action as SystemAction,
      reasoning: decision.reasoning || "No reasoning provided",
      extractedDiagnosis: decision.extracted_diagnosis || null,
      examRequest: decision.exam_request || null,
    };
  } catch (error) {
    console.error("Error in decision agent:", error);
    // Default to patient interaction on error
    return {
      action: "patient_interaction",
      reasoning: "Error occurred, defaulting to patient interaction",
      extractedDiagnosis: null,
      examRequest: null,
    };
  }
}

/**
 * Quick check if a message is likely a diagnosis submission
 * (Used as a fast pre-filter before calling the LLM)
 */
export function isLikelyDiagnosisSubmission(message: string): boolean {
  const lowerMessage = message.toLowerCase();

  const diagnosisKeywords = [
    "mi diagnóstico",
    "creo que es",
    "creo que tiene",
    "el paciente tiene",
    "diagnostico",
    "mi conclusión",
    "concluyo que",
    "entregar diagnóstico",
    "dar mi diagnóstico",
    "quiero evaluar",
    "pedir feedback",
    "recibir feedback",
  ];

  return diagnosisKeywords.some((keyword) => lowerMessage.includes(keyword));
}

/**
 * Quick check if a message is likely ending the simulation
 */
export function isLikelyEndSimulation(message: string): boolean {
  const lowerMessage = message.toLowerCase().trim();

  const endKeywords = [
    "terminar",
    "salir",
    "abandonar",
    "cancelar",
    "finalizar",
    "no continuar",
    "hasta aquí",
  ];

  return endKeywords.some((keyword) => lowerMessage.includes(keyword));
}
