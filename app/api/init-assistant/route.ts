import { NextResponse } from "next/server";
import { initializeAssistant, getAssistantInfo } from "@/lib/assistant";

/**
 * Endpoint para inicializar el Assistant de OpenAI con RAG
 * GET: Obtiene el estado actual
 * POST: Inicializa o re-inicializa el Assistant
 */
export async function GET() {
  try {
    const info = getAssistantInfo();
    return NextResponse.json(info);
  } catch (error) {
    console.error("Error obteniendo info del Assistant:", error);
    return NextResponse.json(
      { error: "Error obteniendo información" },
      { status: 500 }
    );
  }
}

export async function POST() {
  try {
    const result = await initializeAssistant();
    return NextResponse.json({
      success: true,
      ...result,
      message: "Assistant inicializado correctamente",
    });
  } catch (error) {
    console.error("Error inicializando Assistant:", error);
    return NextResponse.json(
      { error: "Error inicializando Assistant" },
      { status: 500 }
    );
  }
}
