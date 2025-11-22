import { createChatCompletion } from "@/lib/openai";
import { patientChatPrompts } from "@/lib/prompts";
import type { ClinicalCase, ChatMessage } from "@/types/case";

/**
 * Patient Agent
 * Simulates a realistic patient interaction based on a clinical case
 */

export interface PatientResponse {
  message: string;
  timestamp: Date;
}

/**
 * Generates the initial greeting from the patient
 */
export async function generateInitialGreeting(
  clinicalCase: ClinicalCase
): Promise<string> {
  const systemPrompt = patientChatPrompts.system(clinicalCase);

  try {
    const response = await createChatCompletion(
      [
        { role: "system", content: systemPrompt },
        {
          role: "user",
          content:
            "El doctor acaba de entrar a la sala. Salúdalo brevemente como paciente y espera a que te pregunte.",
        },
      ],
      {
        temperature: 0.7,
        maxTokens: 150,
      }
    );

    return response.trim();
  } catch (error) {
    console.error("Error generating initial greeting:", error);
    return "Buenos días doctor. ¿Cómo está?";
  }
}

/**
 * Generates a patient response based on the conversation history
 */
export async function generatePatientResponse(
  clinicalCase: ClinicalCase,
  chatHistory: ChatMessage[],
  userMessage: string
): Promise<PatientResponse> {
  const systemPrompt = patientChatPrompts.system(clinicalCase);

  // Convert chat history to OpenAI format
  const messages: Array<{
    role: "system" | "user" | "assistant";
    content: string;
  }> = [{ role: "system", content: systemPrompt }];

  // Add conversation history (excluding the system message)
  for (const msg of chatHistory) {
    if (msg.role !== "system") {
      messages.push({
        role: msg.role === "user" ? "user" : "assistant",
        content: msg.content,
      });
    }
  }

  // Add the new user message
  messages.push({ role: "user", content: userMessage });

  try {
    const response = await createChatCompletion(messages, {
      temperature: 0.8,
      maxTokens: 300,
    });

    return {
      message: response.trim(),
      timestamp: new Date(),
    };
  } catch (error) {
    console.error("Error generating patient response:", error);
    throw new Error("Failed to generate patient response");
  }
}
