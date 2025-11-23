import { getOpenAIClient } from "./openai";
import fs from "fs";
import path from "path";

/**
 * ID del Assistant para casos APS con RAG
 * Se crea una sola vez y se reutiliza
 */
let ASSISTANT_ID: string | null = null;

/**
 * Inicializa el Assistant de OpenAI con File Search habilitado
 * Se ejecuta una sola vez al inicio o cuando se necesite
 *
 * IMPORTANTE: Los archivos deben estar previamente subidos a OpenAI.
 * Usa el script scripts/upload-files.ts para subir archivos y obtener los IDs.
 */
export async function initializeAssistant() {
  try {
    // Si ya existe, no lo volvemos a crear
    if (ASSISTANT_ID) {
      console.log("Assistant ya inicializado:", ASSISTANT_ID);
      return { assistantId: ASSISTANT_ID };
    }

    // Obtener los file IDs desde variables de entorno
    const fileIdsString = process.env.OPENAI_FILE_IDS;

    if (!fileIdsString) {
      throw new Error(
        "OPENAI_FILE_IDS no está configurado. Ejecuta scripts/upload-files.ts primero para subir los archivos y obtener los IDs."
      );
    }

    const uploadedFileIds = fileIdsString.split(",").map(id => id.trim()).filter(id => id.length > 0);

    if (uploadedFileIds.length === 0) {
      throw new Error(
        "OPENAI_FILE_IDS está vacío. Ejecuta scripts/upload-files.ts primero."
      );
    }

    console.log(`Usando ${uploadedFileIds.length} archivos previamente subidos`);

    // Crear el Assistant con File Search habilitado y los archivos ya subidos
    const openai = getOpenAIClient();
    const assistant = await openai.beta.assistants.create({
      name: "Generador de Casos APS",
      instructions: `Eres un médico de Atención Primaria de Salud (APS) trabajando en un CESFAM en Chile.

Tu función es generar casos clínicos que evalúen el MANEJO INTEGRAL del paciente en APS, no solo el diagnóstico.

ENFOQUE PRINCIPAL - MANEJO COMPLETO EN APS:
1. **Ingreso a Programas**: Identificar si el paciente cumple criterios para programas APS
   - Usa el NOMBRE EXACTO del programa según aparece en los documentos
   - Ejemplos: PSCV, ERA, Salud Mental, PNI, PIE Adulto Mayor, etc.
   - Si no aplica a ningún programa, indica "No aplica"
2. **Metas Terapéuticas**: Definir objetivos concretos según normativa (ej: PA <140/90, HbA1c <7%)
3. **Manejo Inicial en CESFAM**: Qué acciones tomar antes o en lugar de derivar
4. **Tiempos GES**: Considerar plazos legales cuando aplique
5. **Criterios de Derivación**: Cuándo y dónde derivar según guías nacionales
6. **Red Flags**: Signos de alarma que requieren derivación urgente
7. **Educación Obligatoria**: Temas que debe recibir el paciente según programa
8. **Seguimiento**: Frecuencia y duración según normativa
9. **Factores Psicosociales**: Soledad, falta de cuidador, riesgo suicida, abandono

USA LOS DOCUMENTOS DISPONIBLES PARA:
- Criterios precisos de ingreso a programas APS (busca el nombre oficial en las guías)
- Metas terapéuticas específicas por patología
- Tiempos GES y oportunidad de atención
- Criterios de derivación ambulatoria vs urgente
- Red flags documentados en guías nacionales
- Contenidos educativos obligatorios por programa
- Factores que modifican el plan de manejo

Los casos deben ser REALISTAS para CESFAM, donde el manejo integral, la derivación oportuna y el seguimiento son competencias clave.`,
      model: "gpt-4o",
      tools: [{ type: "file_search" }],
      tool_resources: {
        file_search: {
          vector_stores: [
            {
              file_ids: uploadedFileIds,
            },
          ],
        },
      },
    });

    ASSISTANT_ID = assistant.id;
    console.log("Assistant creado:", ASSISTANT_ID);

    return { assistantId: ASSISTANT_ID };
  } catch (error) {
    console.error("Error inicializando Assistant:", error);
    throw error;
  }
}

/**
 * Genera un caso clínico usando el Assistant con RAG
 */
export async function generateCaseWithRAG(
  especialidad: string,
  nivelDificultad: string,
  prompt: string
) {
  try {
    // Asegurar que el Assistant esté inicializado
    if (!ASSISTANT_ID) {
      await initializeAssistant();
    }

    if (!ASSISTANT_ID) {
      throw new Error("No se pudo inicializar el Assistant");
    }

    // Crear un Thread para la conversación
    const openai = getOpenAIClient();
    const thread = await openai.beta.threads.create();

    // Añadir el mensaje con la solicitud
    await openai.beta.threads.messages.create(thread.id, {
      role: "user",
      content: prompt,
    });

    // Ejecutar el Assistant
    const run = await openai.beta.threads.runs.createAndPoll(thread.id, {
      assistant_id: ASSISTANT_ID,
    });

    if (run.status === "completed") {
      // Obtener los mensajes de la respuesta
      const messages = await openai.beta.threads.messages.list(thread.id);
      const assistantMessage = messages.data[0];

      if (assistantMessage.content[0].type === "text") {
        return assistantMessage.content[0].text.value;
      }
    } else {
      throw new Error(`Run status: ${run.status}`);
    }

    throw new Error("No se recibió respuesta del Assistant");
  } catch (error) {
    console.error("Error generando caso con RAG:", error);
    throw error;
  }
}

/**
 * Obtener información del Assistant (para debugging)
 */
export function getAssistantInfo() {
  return {
    assistantId: ASSISTANT_ID,
    initialized: !!ASSISTANT_ID,
  };
}
