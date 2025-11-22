import { NextResponse } from "next/server";
import { openai } from "@/lib/openai";
import type { ClinicalCase, ChatMessage } from "@/types/case";
import { feedbackPrompts } from "@/lib/prompts";

export async function POST(req: Request) {
  try {
    const { clinicalCase, messages, diagnostico_estudiante } = await req.json() as {
      clinicalCase: ClinicalCase;
      messages: ChatMessage[];
      diagnostico_estudiante: string;
    };

    const conversationText = messages
      .map(m => `${m.role === "user" ? "Estudiante" : "Paciente"}: ${m.content}`)
      .join("\n");

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { 
          role: "system", 
          content: feedbackPrompts.system(clinicalCase, conversationText, diagnostico_estudiante) 
        },
        { 
          role: "user", 
          content: feedbackPrompts.user() 
        }
      ],
      temperature: 0.1,
      response_format: { type: "json_object" }
    });

    const output = response.choices[0].message.content ?? "{}";
    const jsonOutput = JSON.parse(output);

    return NextResponse.json(jsonOutput);
  } catch (err) {
    console.error("Error en feedback:", err);
    return NextResponse.json({ error: "Error generando feedback" }, { status: 500 });
  }
}