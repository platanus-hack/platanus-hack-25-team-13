import { NextResponse } from "next/server";
import { findExamImage } from "@/lib/exams";

/**
 * Generate Exam Image API
 * Busca imágenes de exámenes médicos en la estructura de carpetas
 *
 * Parámetros:
 * - tipo: tipo de examen (radiografia, ecografia, laboratorio, electrocardiograma, tomografia, resonancia, examen_fisico)
 * - clasificacion: clasificación del examen (torax, abdomen, extremidades, abdominal, pelvica, cardiaca, etc.)
 * - subclasificacion: subclasificación (normal, neumonia, colelitiasis, etc.)
 * - diagnostico (opcional): diagnóstico principal para inferir subclasificación si no se especifica
 */
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { tipo, clasificacion, subclasificacion, diagnostico } = body;

    if (!tipo) {
      return NextResponse.json(
        { error: "El parámetro 'tipo' es requerido" },
        { status: 400 }
      );
    }

    // Buscar imagen usando función centralizada (con diagnóstico opcional como fallback)
    const imagePath = findExamImage(
      tipo,
      clasificacion || "",
      subclasificacion || "",
      diagnostico
    );

    if (imagePath) {
      return NextResponse.json({
        success: true,
        imageUrl: imagePath,
        tipo,
        clasificacion: clasificacion || null,
        subclasificacion: subclasificacion || null,
      });
    } else {
      return NextResponse.json({
        success: false,
        message: "No se encontró una imagen para los parámetros especificados",
        tipo,
        clasificacion: clasificacion || null,
        subclasificacion: subclasificacion || null,
      });
    }
  } catch (error) {
    console.error("Error en generar-examen:", error);
    return NextResponse.json(
      {
        error: "Error interno del servidor",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}