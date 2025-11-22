import { openai } from "./openai";
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
 */
export async function initializeAssistant() {
  try {
    // Si ya existe, no lo volvemos a crear
    if (ASSISTANT_ID) {
      console.log("Assistant ya inicializado:", ASSISTANT_ID);
      return { assistantId: ASSISTANT_ID };
    }

    // 1. Buscar TODOS los archivos PDF en la carpeta
    const knowledgeDir = path.join(
      process.cwd(),
      "data",
      "medical-knowledge"
    );
    
    const files = fs.readdirSync(knowledgeDir);
    const pdfFiles = files.filter(file => file.toLowerCase().endsWith('.pdf'));
    
    if (pdfFiles.length === 0) {
      throw new Error("No se encontró ningún archivo PDF en data/medical-knowledge");
    }
    
    console.log(`Encontrados ${pdfFiles.length} archivos PDF:`, pdfFiles);

    // 2. Subir TODOS los PDFs a OpenAI en paralelo
    console.log("Subiendo archivos en paralelo...");
    const uploadPromises = pdfFiles.map(async (pdfFile) => {
      const pdfPath = path.join(knowledgeDir, pdfFile);
      const fileStream = fs.createReadStream(pdfPath);
      
      const uploadedFile = await openai.files.create({
        file: fileStream,
        purpose: "assistants",
      });
      
      console.log(`✓ ${pdfFile} subido:`, uploadedFile.id);
      return uploadedFile.id;
    });

    const uploadedFileIds = await Promise.all(uploadPromises);
    console.log(`✓ Todos los archivos subidos (${uploadedFileIds.length})`);

    // 3. Crear el Assistant con File Search habilitado y TODOS los archivos
    const assistant = await openai.beta.assistants.create({
      name: "Generador de Casos APS",
      instructions: `Eres un médico de Atención Primaria de Salud (APS) trabajando en un CESFAM en Chile.

Tu función es generar casos clínicos que evalúen el MANEJO INTEGRAL del paciente en APS, no solo el diagnóstico.

ENFOQUE PRINCIPAL - MANEJO COMPLETO EN APS:
1. **Ingreso a Programas**: Identificar si el paciente cumple criterios para PSCV, ERA, Salud Mental u otros
2. **Metas Terapéuticas**: Definir objetivos concretos según normativa (ej: PA <140/90, HbA1c <7%)
3. **Manejo Inicial en CESFAM**: Qué acciones tomar antes o en lugar de derivar
4. **Tiempos GES**: Considerar plazos legales cuando aplique
5. **Criterios de Derivación**: Cuándo y dónde derivar según guías nacionales
6. **Red Flags**: Signos de alarma que requieren derivación urgente
7. **Educación Obligatoria**: Temas que debe recibir el paciente según programa
8. **Seguimiento**: Frecuencia y duración según normativa
9. **Factores Psicosociales**: Soledad, falta de cuidador, riesgo suicida, abandono

USA LOS DOCUMENTOS DISPONIBLES PARA:
- Criterios precisos de ingreso a programas (PSCV 2017, Guías Respiratorias, Salud Mental)
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
