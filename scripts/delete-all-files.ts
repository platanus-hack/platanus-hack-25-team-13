import { getOpenAIClient } from "../lib/openai";
import { config } from "dotenv";
import path from "path";

// Cargar variables de entorno desde .env
config({ path: path.join(process.cwd(), ".env") });

/**
 * Script para eliminar TODOS los archivos de OpenAI
 *
 * Ejecutar: npx tsx scripts/delete-all-files.ts
 *
 * ⚠️  ADVERTENCIA: Este script elimina TODOS los archivos subidos
 * con purpose="assistants". Esta acción es IRREVERSIBLE.
 *
 * Para confirmar, debes editar el script y cambiar CONFIRM_DELETE a true
 */

async function deleteAllFiles() {
  try {
    console.log("🔍 Buscando TODOS los archivos en OpenAI...\n");

    const openai = getOpenAIClient();

    // 1. Listar todos los archivos
    const filesList = await openai.files.list({
      purpose: "assistants",
    });

    const files = filesList.data;

    if (files.length === 0) {
      console.log("✅ No hay archivos para eliminar.");
      return;
    }

    console.log(`📋 Encontrados ${files.length} archivos:\n`);

    // 2. Mostrar todos los archivos
    files.forEach((file) => {
      const date = new Date(file.created_at * 1000).toLocaleString();
      console.log(`  📄 ${file.filename}`);
      console.log(`     ID: ${file.id}`);
      console.log(`     Creado: ${date}`);
      console.log();
    });

    // 3. Confirmar eliminación
    console.log("=".repeat(60));
    console.log(`⚠️  SE ELIMINARÁN ${files.length} ARCHIVOS`);
    console.log("=".repeat(60));
    console.log("\n⚠️  ADVERTENCIA: Esta acción es IRREVERSIBLE\n");
    console.log("Todos los archivos listados arriba serán eliminados.");
    console.log("Los Assistants que usen estos archivos dejarán de funcionar.\n");

    // Por seguridad, requiere editar el script para confirmar
    const CONFIRM_DELETE = true; // ⚠️  Cambiar a true para confirmar eliminación

    if (!CONFIRM_DELETE) {
      console.log("❌ Eliminación CANCELADA por seguridad\n");
      console.log("Para confirmar la eliminación:");
      console.log("  1. Abre: scripts/delete-all-files.ts");
      console.log("  2. Cambia: const CONFIRM_DELETE = false");
      console.log("  3. A:      const CONFIRM_DELETE = true");
      console.log("  4. Guarda y vuelve a ejecutar\n");
      return;
    }

    // 4. Eliminar todos los archivos
    console.log("\n🗑️  Eliminando archivos...\n");

    let successCount = 0;
    let failCount = 0;

    for (const file of files) {
      try {
        await openai.files.delete(file.id);
        console.log(`  ✓ Eliminado: ${file.filename} (${file.id})`);
        successCount++;
      } catch (error) {
        console.error(
          `  ✗ Error eliminando ${file.filename}:`,
          error instanceof Error ? error.message : error
        );
        failCount++;
      }
    }

    // 5. Resumen final
    console.log("\n" + "=".repeat(60));
    console.log("✅ ELIMINACIÓN COMPLETADA");
    console.log("=".repeat(60));
    console.log(`Archivos eliminados: ${successCount}`);
    if (failCount > 0) {
      console.log(`Archivos que fallaron: ${failCount}`);
    }

    console.log("\n💡 Siguiente paso:");
    console.log("   1. Elimina OPENAI_FILE_IDS de tu .env");
    console.log("   2. Si quieres volver a usar RAG:");
    console.log("      - Ejecuta: npx tsx scripts/upload-files.ts");
    console.log("      - Configura los nuevos OPENAI_FILE_IDS en .env\n");
  } catch (error) {
    console.error("\n❌ ERROR:", error);
    throw error;
  }
}

// Ejecutar el script
deleteAllFiles()
  .then(() => {
    console.log("✓ Script completado");
    process.exit(0);
  })
  .catch((error) => {
    console.error("✗ Script falló:", error);
    process.exit(1);
  });
