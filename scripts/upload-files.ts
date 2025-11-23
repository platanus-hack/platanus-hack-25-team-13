import { getOpenAIClient } from "../lib/openai";
import { config } from "dotenv";
import fs from "fs";
import path from "path";

// Cargar variables de entorno desde .env
config({ path: path.join(process.cwd(), ".env") });

/**
 * Script para subir archivos PDF a OpenAI una sola vez
 *
 * Ejecutar: npx tsx scripts/upload-files.ts
 *
 * Este script:
 * 1. Busca todos los PDFs en data/medical-knowledge
 * 2. Los sube a OpenAI en paralelo
 * 3. Genera los file_ids para agregar a .env
 */

async function uploadFiles() {
  try {
    console.log("🔍 Buscando archivos PDF...");

    // 1. Buscar archivos PDF
    const knowledgeDir = path.join(process.cwd(), "data", "medical-knowledge");

    if (!fs.existsSync(knowledgeDir)) {
      throw new Error(
        `No existe el directorio: ${knowledgeDir}\nCrea la carpeta y coloca los archivos PDF dentro.`
      );
    }

    const files = fs.readdirSync(knowledgeDir);
    const pdfFiles = files.filter((file) =>
      file.toLowerCase().endsWith(".pdf")
    );

    if (pdfFiles.length === 0) {
      throw new Error(
        `No se encontraron archivos PDF en: ${knowledgeDir}\nColoca los archivos PDF en esa carpeta.`
      );
    }

    console.log(`✓ Encontrados ${pdfFiles.length} archivos PDF:`);
    pdfFiles.forEach((file) => console.log(`  - ${file}`));

    // 2. Subir archivos en paralelo
    console.log("\n📤 Subiendo archivos a OpenAI...");
    const openai = getOpenAIClient();

    const uploadPromises = pdfFiles.map(async (pdfFile) => {
      const pdfPath = path.join(knowledgeDir, pdfFile);
      const fileStream = fs.createReadStream(pdfPath);

      try {
        const uploadedFile = await openai.files.create({
          file: fileStream,
          purpose: "assistants",
        });

        console.log(`  ✓ ${pdfFile} → ${uploadedFile.id}`);
        return {
          filename: pdfFile,
          fileId: uploadedFile.id,
          success: true,
        };
      } catch (error) {
        console.error(`  ✗ ${pdfFile} → Error: ${error}`);
        return {
          filename: pdfFile,
          fileId: null,
          success: false,
          error: error instanceof Error ? error.message : String(error),
        };
      }
    });

    const results = await Promise.all(uploadPromises);

    // 3. Verificar resultados
    const successful = results.filter((r) => r.success);
    const failed = results.filter((r) => !r.success);

    console.log("\n" + "=".repeat(60));
    console.log(`✓ Archivos subidos exitosamente: ${successful.length}`);
    if (failed.length > 0) {
      console.log(`✗ Archivos fallidos: ${failed.length}`);
      failed.forEach((f) => {
        console.log(`  - ${f.filename}: ${f.error}`);
      });
    }

    if (successful.length === 0) {
      throw new Error("No se pudo subir ningún archivo");
    }

    // 4. Generar la lista de IDs para .env
    const fileIds = successful.map((r) => r.fileId).join(",");

    console.log("\n" + "=".repeat(60));
    console.log("🎉 CONFIGURACIÓN COMPLETADA");
    console.log("=".repeat(60));
    console.log("\nAgrega esta línea a tu archivo .env:\n");
    console.log(`OPENAI_FILE_IDS=${fileIds}`);
    console.log("\n" + "=".repeat(60));
    console.log("\nDetalles de archivos:");
    successful.forEach((r) => {
      console.log(`  ${r.filename}`);
      console.log(`    ID: ${r.fileId}`);
    });
    console.log("\n" + "=".repeat(60));

    return {
      success: true,
      fileIds,
      uploadedCount: successful.length,
      failedCount: failed.length,
    };
  } catch (error) {
    console.error("\n❌ ERROR:", error);
    throw error;
  }
}

// Ejecutar el script
uploadFiles()
  .then(() => {
    console.log("\n✓ Script completado exitosamente");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n✗ Script falló:", error);
    process.exit(1);
  });
