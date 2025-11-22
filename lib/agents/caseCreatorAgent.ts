import { createChatCompletion } from "@/lib/openai";
import { caseGenerationPrompts } from "@/lib/prompts";
import type { ClinicalCase } from "@/types/case";

/**
 * Case Creator Agent
 * Generates realistic clinical cases for medical training simulations
 */

export interface CaseCreatorOptions {
  difficulty?: "easy" | "medium" | "hard";
  specialty?: string;
}

export async function generateClinicalCase(
  options: CaseCreatorOptions = {}
): Promise<ClinicalCase> {
  const difficulty = options.difficulty || "medium";
  const specialty = options.specialty || "medicina_interna";
  const { system, user } = caseGenerationPrompts;

  try {
    const response = await createChatCompletion(
      [
        { role: "system", content: system(specialty, difficulty) },
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
