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
  chatHistory: ChatMessage[],
  clinicalCase?: any
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

  // Build clinical context (without revealing diagnosis)
  let clinicalContext = "";
  if (clinicalCase) {
    const signosVitales = clinicalCase.examen_fisico?.signos_vitales;
    let vitalesTexto = "";
    if (signosVitales) {
      vitalesTexto = `
- Signos vitales:
  * Temperatura: ${signosVitales.temperatura}°C
  * Frecuencia cardíaca: ${signosVitales.frecuencia_cardiaca} lpm
  * Presión arterial: ${signosVitales.presion_arterial}
  * Frecuencia respiratoria: ${signosVitales.frecuencia_respiratoria} rpm
  * Saturación O2: ${signosVitales.saturacion_o2}%`;
    }

    clinicalContext = `
CONTEXTO DEL CASO CLÍNICO (para inferir exámenes apropiados):
- Síntomas: ${clinicalCase.sintomas?.descripcion_general || "No especificados"}
- Motivo de consulta: ${clinicalCase.motivo_consulta || "No especificado"}
${vitalesTexto}
- Hallazgos del examen físico: ${clinicalCase.examen_fisico?.hallazgos_relevantes?.join(", ") || "No especificados"}

IMPORTANTE: Usa esta información (ESPECIALMENTE SIGNOS VITALES) para inferir qué hallazgos esperarías en los exámenes:
- Para electrocardiogramas: La frecuencia cardíaca es CRÍTICA
  * FC < 60 → bradicardia
  * FC > 100 → taquicardia
  * Palpitaciones + irregular → fibrilacion_auricular
  * Dolor torácico intenso → infarto
- Para radiografías: Síntomas respiratorios (tos, fiebre) → neumonía
- Para ecografías abdominales: Dolor en hipocondrio derecho → colelitiasis

NUNCA uses "normal" a menos que claramente no haya patología. SIEMPRE especifica subclasificación basándote en los síntomas.
`.trim();
  }

  const systemPrompt = decisionPrompts.system();
  const userPrompt = decisionPrompts.user(message, conversationContext, clinicalContext);

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

    console.log("\n🧠 [decisionAgent] Decisión tomada:");
    console.log("   Acción:", decision.action);
    console.log("   Razonamiento:", decision.reasoning);
    if (decision.action === "request_exam" && decision.exam_request) {
      console.log("   Exam request:");
      console.log("     Tipo:", decision.exam_request.tipo);
      console.log("     Clasificación:", decision.exam_request.clasificacion || "(no especificada)");
      console.log("     Subclasificación:", decision.exam_request.subclasificacion || "(no especificada)");
    }

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

    // Additional validation: If LLM says "submit_diagnosis" but message has question marks,
    // override to "patient_interaction" (safety check)
    if (
      decision.action === "submit_diagnosis" &&
      (message.includes("?") || message.includes("¿"))
    ) {
      console.warn(
        "LLM suggested submit_diagnosis but message contains question marks. Overriding to patient_interaction."
      );
      return {
        action: "patient_interaction",
        reasoning:
          "Message contains question marks - treating as hypothesis/question, not diagnosis",
        extractedDiagnosis: null,
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

  // First check: If message contains question marks, it's likely NOT a diagnosis
  // (it's a hypothesis or question to the patient)
  if (message.includes("?") || message.includes("¿")) {
    return false;
  }

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
