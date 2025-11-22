import { NextResponse } from "next/server";

/**
 * Generate Exam Image API
 * Generates a mock medical exam image URL
 * Returns a URL that points to an endpoint that serves a generated exam image
 */
export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const { tipoExamen = "radiografia" } = body as {
      tipoExamen?: string;
    };

    // Generate a unique ID for this exam image
    const examId = `exam_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    
    // Return URL to the exam image endpoint
    const imageUrl = `/api/images/examen/${tipoExamen}?id=${examId}`;

    return NextResponse.json(
      {
        success: true,
        data: {
          imageUrl,
          tipoExamen,
          examId,
          timestamp: new Date().toISOString(),
        },
      },
      { status: 200 }
    );
  } catch (err) {
    console.error("Error generando imagen de examen:", err);
    return NextResponse.json(
      { error: "Error generando imagen de examen" },
      { status: 500 }
    );
  }
}

