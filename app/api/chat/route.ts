import { NextResponse } from "next/server";
import { openai } from "@/lib/openai";
import type { ClinicalCase, ChatMessage } from "@/types/case";
import { patientChatPrompts } from "@/lib/prompts";

export async function POST(req: Request) {
  try {
    const { messages, clinicalCase } = await req.json() as {
      messages: ChatMessage[];
      clinicalCase: ClinicalCase;
    };

    const formattedMessages = messages
      .filter((m) => m.role === "user" || m.role === "assistant")
      .map((m) => ({
        role: m.role,
        content: m.content,
      }));

    const initialUserPrompt = {
      role: "user" as const,
      content:
        "El médico entra a la consulta y te saluda. Responde como paciente con tu presentación inicial natural.",
    };

    const messagesToSend =
      formattedMessages.length === 0
        ? [initialUserPrompt] 
        : formattedMessages;

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { 
          role: "system", 
          content: patientChatPrompts.system(clinicalCase) 
        },
        ...messagesToSend,
      ],
      temperature: 0.3,
      max_tokens: 400,
    });

    const assistantMessage = response.choices[0].message.content ?? "";

    return NextResponse.json({ message: assistantMessage });

  } catch (err) {
    console.error("Error en chat:", err);
    return NextResponse.json(
      { error: "Error en el chat" },
      { status: 500 }
    );
  }
}