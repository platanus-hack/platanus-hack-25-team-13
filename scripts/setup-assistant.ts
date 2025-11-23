/**
 * Script para configurar OpenAI Assistant una sola vez
 * Este script sube los documentos MINSAL y crea el Assistant
 * Solo necesitas ejecutarlo una vez, luego usas el ASSISTANT_ID generado
 *
 * Uso:
 * 1. Coloca tus archivos PDF/TXT de guías MINSAL en la carpeta ./docs/
 * 2. Ejecuta: npx tsx scripts/setup-assistant.ts
 * 3. Copia el ASSISTANT_ID generado a tu .env
 */

import OpenAI from "openai";
import fs from "fs";
import path from "path";
import { config } from "dotenv";

// Cargar variables de entorno desde .env
config();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Carpeta donde están los documentos MINSAL
const DOCS_FOLDER = path.join(process.cwd(), "docs");

async function setupAssistant() {
  console.log("🚀 Iniciando setup de OpenAI Assistant...\n");

  try {
    // 1. Verificar que exista la carpeta de documentos
    if (!fs.existsSync(DOCS_FOLDER)) {
      console.error(`❌ Error: No existe la carpeta ${DOCS_FOLDER}`);
      console.log(
        "Crea la carpeta './docs' y coloca tus archivos PDF/TXT de guías MINSAL ahí.",
      );
      process.exit(1);
    }

    // 2. Buscar archivos PDF y TXT en la carpeta
    const files = fs.readdirSync(DOCS_FOLDER).filter((file) => {
      const ext = path.extname(file).toLowerCase();
      return ext === ".pdf" || ext === ".txt";
    });

    if (files.length === 0) {
      console.warn("⚠️  No se encontraron archivos PDF o TXT en ./docs/");
      console.log(
        "Puedes crear el Assistant sin archivos y agregarlos después.\n",
      );
    } else {
      console.log(`📁 Archivos encontrados: ${files.length}`);
      files.forEach((file) => console.log(`   - ${file}`));
      console.log();
    }

    // 3. Subir archivos a OpenAI
    const fileIds: string[] = [];

    for (const file of files) {
      console.log(`📤 Subiendo ${file}...`);
      const filePath = path.join(DOCS_FOLDER, file);

      try {
        const uploadedFile = await openai.files.create({
          file: fs.createReadStream(filePath),
          purpose: "assistants",
        });

        fileIds.push(uploadedFile.id);
        console.log(`   ✅ Subido: ${uploadedFile.id}`);
      } catch (error) {
        console.error(`   ❌ Error subiendo ${file}:`, error);
      }
    }

    console.log();

    // 4. Crear el Assistant con las instrucciones de generación de casos
    console.log("🤖 Creando Assistant...");

    const assistant = await openai.beta.assistants.create({
      name: "MedSim Case Generator",
      model: "gpt-4-turbo-preview",
      instructions:
        `Eres un médico experto en educación médica en Chile, especializado en crear casos clínicos realistas por NIVEL DE ATENCIÓN.

Tu tarea es generar casos clínicos REALISTAS, coherentes y adecuados para estudiantes de medicina.
NO inventes enfermedades raras ni datos fisiológicamente imposibles.

NIVELES DE ATENCIÓN DISPONIBLES:
- APS (Atención Primaria de Salud - CESFAM)
- Urgencia (Servicio de Urgencias)
- Hospitalización (Medicina Interna)

Para casos de APS:
- Usa los documentos MINSAL adjuntos para criterios de ingreso a programas (PSCV, ERA, Salud Mental, PNI, etc.)
- Usa los documentos para criterios de derivación y red flags
- Incluye metas terapéuticas según normativa
- Define plan de seguimiento según guías
- Considera factores psicosociales modificadores

IMPORTANTE:
- Genera casos variados (edad, sexo, severidad, presentación clínica)
- Respeta la estructura JSON solicitada
- No generes valores extremos o fisiológicamente imposibles
- Usa información de los documentos cuando esté disponible`,
      tools: fileIds.length > 0 ? [{ type: "file_search" }] : [],
      tool_resources: fileIds.length > 0
        ? {
          file_search: {
            vector_stores: [
              {
                file_ids: fileIds,
              },
            ],
          },
        }
        : undefined,
    });

    console.log("✅ Assistant creado exitosamente!\n");

    // 5. Mostrar resultados
    console.log("=".repeat(60));
    console.log("📋 INFORMACIÓN DEL ASSISTANT");
    console.log("=".repeat(60));
    console.log(`ID del Assistant: ${assistant.id}`);
    console.log(`Nombre: ${assistant.name}`);
    console.log(`Modelo: ${assistant.model}`);
    console.log(`Archivos vinculados: ${fileIds.length}`);
    console.log();

    if (fileIds.length > 0) {
      console.log("📎 IDs de archivos:");
      fileIds.forEach((id, index) => {
        console.log(`   ${index + 1}. ${id} (${files[index]})`);
      });
      console.log();
    }

    console.log("=".repeat(60));
    console.log("🔑 VARIABLES DE ENTORNO");
    console.log("=".repeat(60));
    console.log("Agrega esta línea a tu archivo .env:\n");
    console.log(`OPENAI_ASSISTANT_ID=${assistant.id}`);
    console.log();
    console.log("=".repeat(60));
    console.log();

    console.log("✅ Setup completado!");
    console.log(
      "💡 Ahora puedes usar el Assistant en tu aplicación con solo el ASSISTANT_ID",
    );
    console.log("💡 Los archivos quedan almacenados en OpenAI permanentemente");
    console.log();

    // 6. Guardar la configuración en un archivo para referencia
    const configPath = path.join(process.cwd(), ".assistant-config.json");
    fs.writeFileSync(
      configPath,
      JSON.stringify(
        {
          assistantId: assistant.id,
          fileIds,
          files: files,
          createdAt: new Date().toISOString(),
        },
        null,
        2,
      ),
    );
    console.log(`📝 Configuración guardada en: ${configPath}`);
    console.log();
  } catch (error) {
    console.error("❌ Error durante el setup:", error);
    process.exit(1);
  }
}

// Función para actualizar archivos del Assistant existente
async function updateAssistantFiles() {
  console.log("🔄 Actualizando archivos del Assistant...\n");

  const assistantId = process.env.OPENAI_ASSISTANT_ID;
  if (!assistantId) {
    console.error("❌ Error: No se encontró OPENAI_ASSISTANT_ID en .env");
    console.log("Ejecuta primero: npx tsx scripts/setup-assistant.ts");
    process.exit(1);
  }

  try {
    const files = fs.readdirSync(DOCS_FOLDER).filter((file) => {
      const ext = path.extname(file).toLowerCase();
      return ext === ".pdf" || ext === ".txt";
    });

    const fileIds: string[] = [];

    for (const file of files) {
      console.log(`📤 Subiendo ${file}...`);
      const filePath = path.join(DOCS_FOLDER, file);

      const uploadedFile = await openai.files.create({
        file: fs.createReadStream(filePath),
        purpose: "assistants",
      });

      fileIds.push(uploadedFile.id);
      console.log(`   ✅ Subido: ${uploadedFile.id}`);
    }

    console.log();
    console.log("🔄 Actualizando Assistant...");

    await openai.beta.assistants.update(assistantId, {
      tool_resources: {
        file_search: {
          vector_stores: [
            {
              file_ids: fileIds,
            },
          ],
        },
      },
    });

    console.log("✅ Archivos actualizados exitosamente!");
    console.log(`📎 ${fileIds.length} archivos vinculados al Assistant`);
  } catch (error) {
    console.error("❌ Error actualizando archivos:", error);
    process.exit(1);
  }
}

// Detectar modo de ejecución
const args = process.argv.slice(2);
const mode = args[0];

if (mode === "update") {
  updateAssistantFiles();
} else {
  setupAssistant();
}
