/**
 * Helper functions para interactuar con OpenAI Assistant
 * El Assistant ya tiene los documentos MINSAL pre-cargados
 * Solo necesitas el ASSISTANT_ID de las variables de entorno
 */

import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const ASSISTANT_ID = process.env.OPENAI_ASSISTANT_ID;

if (!ASSISTANT_ID) {
  console.warn("⚠️  OPENAI_ASSISTANT_ID no está configurado en .env");
  console.warn("Ejecuta: npx tsx scripts/setup-assistant.ts");
}

/**
 * Genera un caso clínico usando el Assistant pre-configurado
 * El Assistant ya tiene acceso a los documentos MINSAL
 */
export async function generateCaseWithAssistant(
  specialty: string,
  difficulty: "easy" | "medium" | "hard",
  apsSubcategoria?: string
): Promise<string> {
  if (!ASSISTANT_ID) {
    throw new Error("OPENAI_ASSISTANT_ID no está configurado. Ejecuta: npx tsx scripts/setup-assistant.ts");
  }

  try {
    // 1. Crear un thread (conversación)
    const thread = await openai.beta.threads.create();

    // 2. Construir el mensaje para el Assistant
    const userMessage = buildCaseGenerationPrompt(specialty, difficulty, apsSubcategoria);

    // 3. Enviar mensaje al thread
    await openai.beta.threads.messages.create(thread.id, {
      role: "user",
      content: userMessage,
    });

    // 4. Ejecutar el Assistant (automáticamente usa RAG con los documentos)
    const run = await openai.beta.threads.runs.create(thread.id, {
      assistant_id: ASSISTANT_ID,
    });

    // 5. Esperar a que termine (polling)
    const completedRun = await waitForRunCompletion(thread.id, run.id);

    if (completedRun.status !== "completed") {
      throw new Error(`Run falló con status: ${completedRun.status}`);
    }

    // 6. Obtener la respuesta
    const messages = await openai.beta.threads.messages.list(thread.id);
    const assistantMessage = messages.data.find(
      (msg) => msg.role === "assistant" && msg.run_id === run.id
    );

    if (!assistantMessage) {
      throw new Error("No se encontró respuesta del Assistant");
    }

    // 7. Extraer el contenido de texto
    const textContent = assistantMessage.content.find(
      (content) => content.type === "text"
    );

    if (!textContent || textContent.type !== "text") {
      throw new Error("No se encontró contenido de texto en la respuesta");
    }

    return textContent.text.value;

  } catch (error) {
    console.error("Error generando caso con Assistant:", error);
    throw new Error("Error generando caso clínico con Assistant");
  }
}

/**
 * Espera a que un run se complete (polling)
 */
async function waitForRunCompletion(
  threadId: string,
  runId: string,
  maxAttempts = 60,
  delayMs = 1000
): Promise<OpenAI.Beta.Threads.Runs.Run> {
  for (let i = 0; i < maxAttempts; i++) {
    const run = await openai.beta.threads.runs.retrieve(threadId, runId);

    if (run.status === "completed") {
      return run;
    }

    if (run.status === "failed" || run.status === "cancelled" || run.status === "expired") {
      throw new Error(`Run terminó con status: ${run.status}`);
    }

    // Esperar antes de volver a consultar
    await new Promise((resolve) => setTimeout(resolve, delayMs));
  }

  throw new Error("Timeout esperando que el run se complete");
}

/**
 * Construye el prompt para generar un caso clínico
 */
function buildCaseGenerationPrompt(
  specialty: string,
  difficulty: "easy" | "medium" | "hard",
  apsSubcategoria?: string
): string {
  const difficultyMap = {
    easy: "fácil",
    medium: "medio",
    hard: "difícil",
  };

  const nivelDificultad = difficultyMap[difficulty];

  let prompt = `Genera un caso clínico con las siguientes características:

NIVEL DE ATENCIÓN: ${specialty}
NIVEL DE DIFICULTAD: ${nivelDificultad}
`;

  if (specialty === "aps" && apsSubcategoria) {
    prompt += `SUBCATEGORÍA APS: ${apsSubcategoria}\n`;
  }

  if (specialty === "aps") {
    prompt += `
INSTRUCCIONES ESPECÍFICAS PARA APS:
- Usa los documentos MINSAL para definir criterios de ingreso a programas (PSCV, ERA, Salud Mental, PNI, etc.)
- Usa los documentos para criterios de derivación (ambulatoria/urgencia/hospitalización)
- Define metas terapéuticas según normativa del programa
- Incluye educación y seguimiento según guías
- Considera factores psicosociales modificadores
- Identifica red flags que requieran derivación urgente
`;
  }

  prompt += `
FORMATO DE RESPUESTA:
Devuelve SOLO un objeto JSON válido siguiendo esta estructura exacta:

{
  "id": "string único",
  "especialidad": "${specialty}",
  ${specialty === "aps" ? `"aps_subcategoria": "${apsSubcategoria || "general"}",` : ""}
  "nivel_dificultad": "${difficulty}",
  "paciente": {
    "edad": number,
    "sexo": "masculino|femenino|otro",
    "ocupacion": "string",
    "contexto_ingreso": "string"
  },
  "motivo_consulta": "string",
  "sintomas": {
    "descripcion_general": "string",
    "detalle": ["string"]
  },
  "antecedentes": {
    "personales": ["string"],
    "familiares": ["string"],
    "farmacos": ["string"],
    "alergias": ["string"]
  },
  "examen_fisico": {
    "signos_vitales": {
      "temperatura": number,
      "frecuencia_cardiaca": number,
      "presion_arterial": "string",
      "frecuencia_respiratoria": number,
      "saturacion_o2": number
    },
    "hallazgos_relevantes": ["string"]
  },
  "examenes": {
    "nombre_examen": {
      "realizado": boolean,
      "resultado": "string (opcional)"
    }
  },
  "diagnostico_principal": "string",
  "diagnosticos_diferenciales": ["string"],
  "info_oculta": ["información que solo se revela si se pregunta directamente"],
  "info_prohibida": ["información que el paciente nunca debe decir"]
  ${
    specialty === "aps"
      ? `,"manejo_aps": {
    "criterio_ingreso_programa": {
      "aplica": boolean,
      "programa": "string (nombre del programa según guías)",
      "justificacion": "string"
    },
    "metas_terapeuticas": ["string con valores específicos"],
    "manejo_inicial": ["acciones concretas en CESFAM"],
    "tiempos_legales_y_oportunidad": {
      "es_ges": boolean,
      "tiempos_requeridos": ["string"]
    },
    "derivacion": {
      "requiere_derivacion": boolean,
      "tipo_derivacion": "ambulatoria_especialista|urgencia|hospitalizacion|no_requiere",
      "criterios": ["criterios según guías"],
      "red_flags": ["signos de alarma para derivación urgente"]
    },
    "seguimiento": {
      "frecuencia": "string",
      "duracion": "string",
      "educacion_obligatoria": ["string"]
    },
    "factores_psicosociales_modificadores": ["string"]
  }`
      : ""
  }
}

IMPORTANTE:
- Devuelve SOLO el JSON, sin texto adicional
- Genera valores realistas y coherentes
- NO inventes enfermedades raras
- Varía edad, sexo, severidad y presentación clínica
${specialty === "aps" ? "- USA LA INFORMACIÓN DE LOS DOCUMENTOS MINSAL para criterios de programas, derivación y metas" : ""}
`;

  return prompt;
}

/**
 * Función de prueba para verificar que el Assistant funciona
 */
export async function testAssistant(): Promise<boolean> {
  if (!ASSISTANT_ID) {
    console.error("❌ OPENAI_ASSISTANT_ID no configurado");
    return false;
  }

  try {
    console.log("🧪 Probando conexión con Assistant...");

    const thread = await openai.beta.threads.create();
    await openai.beta.threads.messages.create(thread.id, {
      role: "user",
      content: "Hola, ¿estás funcionando?",
    });

    const run = await openai.beta.threads.runs.create(thread.id, {
      assistant_id: ASSISTANT_ID,
    });

    const completedRun = await waitForRunCompletion(thread.id, run.id);

    if (completedRun.status === "completed") {
      console.log("✅ Assistant funcionando correctamente");
      return true;
    }

    return false;
  } catch (error) {
    console.error("❌ Error probando Assistant:", error);
    return false;
  }
}
