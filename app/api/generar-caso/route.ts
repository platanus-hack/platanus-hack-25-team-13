import { NextResponse } from "next/server";
import { openai } from "@/lib/openai";
import { ClinicalCase } from "@/types/case";
import { caseGenerationPrompts } from "@/lib/prompts";

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const {
      especialidad = "urgencia",
      nivel_dificultad = "medio",
    } = body as {
      especialidad?: ClinicalCase["especialidad"];
      nivel_dificultad?: ClinicalCase["nivel_dificultad"];
    };

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { 
          role: "system", 
          content: caseGenerationPrompts.system(especialidad, nivel_dificultad) 
        },
        { 
          role: "user", 
          content: caseGenerationPrompts.user() 
        }
      ],
      response_format: { type: "json_object" },
      temperature: 0.7,
    });

    const output = response.choices[0].message.content;
    if (!output) {
      throw new Error("No se recibió respuesta del modelo");
    }

    const clinicalCase = JSON.parse(output) as ClinicalCase;
    if (!clinicalCase.paciente || !clinicalCase.motivo_consulta) {
      throw new Error("Caso incompleto");
    }

    if (!clinicalCase.id) {
      clinicalCase.id = `case-${Date.now()}`;
    }

    return NextResponse.json(clinicalCase, { status: 200 });
  } catch (err) {
    console.error("Error generando caso clínico:", err);
    return NextResponse.json(
      { error: "Error generando caso clínico" },
      { status: 500 },
    );
  }
}