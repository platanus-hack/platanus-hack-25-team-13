import { createChatCompletion } from "@/lib/openai";
import { caseGenerationPrompts } from "@/lib/prompts";
import { generateCaseWithAssistant } from "@/lib/agents/assistantHelper";
import type { ClinicalCase } from "@/types/case";

/**
 * Case Creator Agent
 * Generates realistic clinical cases for medical training simulations
 *
 * Soporta dos modos:
 * 1. OpenAI Assistant API (con RAG de documentos MINSAL) - RECOMENDADO
 * 2. Chat Completion tradicional (fallback)
 */

export interface CaseCreatorOptions {
  difficulty?: "easy" | "medium" | "hard";
  specialty?: string;
  apsSubcategoria?: string;
  useAssistant?: boolean; // Si es true, usa Assistant API
}

/**
 * Genera un caso clínico usando el método especificado
 */
export async function generateClinicalCase(
  options: CaseCreatorOptions = {}
): Promise<ClinicalCase> {
  const difficulty = options.difficulty || "medium";
  const specialty = options.specialty || "medicina_interna";
  const apsSubcategoria = options.apsSubcategoria;

  // Usar Assistant API si está configurado y useAssistant no es false
  const shouldUseAssistant =
    options.useAssistant !== false &&
    process.env.OPENAI_ASSISTANT_ID;

  if (shouldUseAssistant) {
    return generateCaseWithAssistantAPI(specialty, difficulty, apsSubcategoria);
  } else {
    return generateCaseWithChatCompletion(specialty, difficulty, apsSubcategoria);
  }
}

/**
 * Genera caso usando OpenAI Assistant API (con RAG)
 * Los documentos MINSAL ya están pre-cargados en el Assistant
 */
async function generateCaseWithAssistantAPI(
  specialty: string,
  difficulty: "easy" | "medium" | "hard",
  apsSubcategoria?: string
): Promise<ClinicalCase> {
  try {
    console.log("🤖 Generando caso con Assistant API (con RAG)...");

    const response = await generateCaseWithAssistant(
      specialty,
      difficulty,
      apsSubcategoria
    );

    // Parsear la respuesta JSON
    const caseData = JSON.parse(response);
    const clinicalCase = caseData as ClinicalCase;

    return clinicalCase;
  } catch (error) {
    console.error("Error generando caso con Assistant API:", error);

    // Fallback a chat completion si Assistant falla
    console.log("⚠️  Fallback a Chat Completion...");
    return generateCaseWithChatCompletion(specialty, difficulty, apsSubcategoria);
  }
}

/**
 * Genera caso usando Chat Completion tradicional (sin RAG)
 * Método original como fallback
 */
async function generateCaseWithChatCompletion(
  specialty: string,
  difficulty: "easy" | "medium" | "hard",
  apsSubcategoria?: string
): Promise<ClinicalCase> {
  const { system, user } = caseGenerationPrompts;

  try {
    console.log("💬 Generando caso con Chat Completion...");

    const response = await createChatCompletion(
      [
        { role: "system", content: system(specialty, difficulty, apsSubcategoria) },
        { role: "user", content: user() as string },
      ],
      {
        temperature: 0.8,
        maxTokens: 2500,
        responseFormat: { type: "json_object" },
      }
    );

    const caseData = JSON.parse(response);
    const clinicalCase = caseData as ClinicalCase;

    return clinicalCase;
  } catch (error) {
    console.error("Error generating clinical case:", error);
    throw new Error("Failed to generate clinical case. Please try again.");
  }
}
