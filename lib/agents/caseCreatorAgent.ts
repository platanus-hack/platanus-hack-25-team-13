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
  subcategory?: string; // Subcategory hint for variety
  apsSubcategoria?: string; // Alias for subcategory (backward compatibility)
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
  // Support both subcategory and apsSubcategoria for backward compatibility
  const subcategory = options.subcategory || options.apsSubcategoria;

  // Usar Assistant API solo para APS (ya que tiene documentos MINSAL)
  const shouldUseAssistant =
    options.useAssistant !== false &&
    process.env.OPENAI_ASSISTANT_ID &&
    specialty === "aps";

  if (shouldUseAssistant) {
    return generateCaseWithAssistantAPI(specialty, difficulty, subcategory);
  } else {
    return generateCaseWithChatCompletion(specialty, difficulty, subcategory);
  }
}

/**
 * Genera caso usando OpenAI Assistant API (con RAG)
 * Los documentos MINSAL ya están pre-cargados en el Assistant
 */
async function generateCaseWithAssistantAPI(
  specialty: string,
  difficulty: "easy" | "medium" | "hard",
  subcategory?: string
): Promise<ClinicalCase> {
  try {
    console.log(`🤖 Generando caso con Assistant API (con RAG)${subcategory ? ` - ${subcategory}` : ''}...`);

    const response = await generateCaseWithAssistant(
      specialty,
      difficulty,
      subcategory
    );

    // Parsear la respuesta JSON
    const caseData = JSON.parse(response);
    const clinicalCase = caseData as ClinicalCase;

    return clinicalCase;
  } catch (error) {
    console.error("Error generando caso con Assistant API:", error);

    // Fallback a chat completion si Assistant falla
    console.log("⚠️  Fallback a Chat Completion...");
    return generateCaseWithChatCompletion(specialty, difficulty, subcategory);
  }
}

/**
 * Genera caso usando Chat Completion tradicional (sin RAG)
 * Método original como fallback
 */
async function generateCaseWithChatCompletion(
  specialty: string,
  difficulty: "easy" | "medium" | "hard",
  subcategory?: string
): Promise<ClinicalCase> {
  const { system, user } = caseGenerationPrompts;

  try {
    console.log(`💬 Generando caso con Chat Completion${subcategory ? ` - ${subcategory}` : ''}...`);

    // Build system prompt with subcategory hint
    const systemPrompt = system(specialty, difficulty, subcategory);
    
    // Add random seed for extra variety
    const varietySeed = `\n\n🎲 Seed de variación: ${Date.now()}-${Math.random().toString(36).substring(7)}`;
    
    // Add subcategory hint if provided
    const subcategoryHint = subcategory 
      ? `\n\n💡 ENFÓCATE EN ESTA CATEGORÍA: ${subcategory.toUpperCase()}\nGenera un caso específico de esta categoría, evita otras categorías.`
      : '';

    const response = await createChatCompletion(
      [
        { 
          role: "system", 
          content: systemPrompt + varietySeed + subcategoryHint 
        },
        { role: "user", content: user() as string },
      ],
      {
        temperature: 1.0, // High temperature for maximum variety
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