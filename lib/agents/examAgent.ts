import { createChatCompletion } from "@/lib/openai";
import { findExamImage } from "@/lib/exams";

/**
 * Exam Agent
 * Handles medical exam requests by finding exam images based on available files
 */

export interface ExamRequest {
  tipo: string;
  clasificacion?: string;
  subclasificacion?: string;
}

export interface ExamResult {
  success: boolean;
  imageUrl: string | null;
  examDetails: {
    tipo: string;
    clasificacion: string | null;
    subclasificacion: string | null;
  };
}

/**
 * Processes an exam request by finding the image and generating a response
 */
export async function processExamRequest(
  examRequest: ExamRequest,
  conversationContext: string
): Promise<ExamResult> {
  try {
    console.log("\n🔬 [examAgent] Procesando solicitud de examen:");
    console.log("   Tipo original:", examRequest.tipo);
    console.log("   Clasificación original:", examRequest.clasificacion || "(no especificada)");
    console.log("   Subclasificación original:", examRequest.subclasificacion || "(no especificada)");

    // Normalize parameters
    const tipoNormalizado = examRequest.tipo.toLowerCase().trim();
    const clasificacionNormalizada =
      examRequest.clasificacion?.toLowerCase().trim() || "";
    const subclasificacionNormalizada =
      examRequest.subclasificacion?.toLowerCase().trim() || "";

    console.log("\n   Valores normalizados:");
    console.log("   Tipo:", tipoNormalizado);
    console.log("   Clasificación:", clasificacionNormalizada || "(vacío)");
    console.log("   Subclasificación:", subclasificacionNormalizada || "(vacío)");

    // Find the exam image using centralized function
    const imageUrl = findExamImage(
      tipoNormalizado,
      clasificacionNormalizada,
      subclasificacionNormalizada
    );

    // If image found, return success
    if (imageUrl) {
      return {
        success: true,
        imageUrl: imageUrl,
        examDetails: {
          tipo: tipoNormalizado,
          clasificacion: clasificacionNormalizada || null,
          subclasificacion: subclasificacionNormalizada || null,
        },
      };
    } else {
      // Exam not found
      return {
        success: false,
        imageUrl: null,
        examDetails: {
          tipo: tipoNormalizado,
          clasificacion: clasificacionNormalizada || null,
          subclasificacion: subclasificacionNormalizada || null,
        },
      };
    }
  } catch (error) {
    console.error("Error processing exam request:", error);
    return {
      success: false,
      imageUrl: null,
      examDetails: {
        tipo: examRequest.tipo,
        clasificacion: examRequest.clasificacion || null,
        subclasificacion: examRequest.subclasificacion || null,
      },
    };
  }
}

