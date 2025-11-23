import { getOpenAIClient } from "../lib/openai";
import { config } from "dotenv";
import path from "path";

// Cargar variables de entorno desde .env
config({ path: path.join(process.cwd(), ".env") });

/**
 * Script para limpiar archivos duplicados en OpenAI
 *
 * Ejecutar: npx tsx scripts/cleanup-files.ts
 *
 * Este script:
 * 1. Lista todos los archivos de tipo "assistants"
 * 2. Agrupa por nombre de archivo
 * 3. Mantiene solo el más reciente de cada archivo
 * 4. Elimina los duplicados más antiguos
 *
 * IMPORTANTE: Solo ejecuta esto si estás seguro de que quieres eliminar los duplicados.
 * Los file_ids antiguos quedarán inválidos.
 */

async function cleanupDuplicateFiles() {
  try {
    console.log("🔍 Buscando archivos en OpenAI...\n");

    const openai = getOpenAIClient();

    // 1. Listar todos los archivos
    const filesList = await openai.files.list({
      purpose: "assistants",
    });

    const files = filesList.data;

    if (files.length === 0) {
      console.log("No se encontraron archivos.");
      return;
    }

    console.log(`Encontrados ${files.length} archivos totales.\n`);

    // 2. Agrupar por nombre de archivo
    const filesByName = new Map<
      string,
      Array<{ id: string; filename: string; created_at: number }>
    >();

    files.forEach((file) => {
      if (!filesByName.has(file.filename)) {
        filesByName.set(file.filename, []);
      }
      filesByName.get(file.filename)!.push({
        id: file.id,
        filename: file.filename,
        created_at: file.created_at,
      });
    });

    // 3. Identificar duplicados
    console.log("📋 Análisis de archivos:\n");
    let totalDuplicates = 0;
    const filesToDelete: string[] = [];

    for (const [filename, fileVersions] of filesByName) {
      if (fileVersions.length > 1) {
        console.log(`📄 ${filename}`);
        console.log(`   Duplicados encontrados: ${fileVersions.length} copias`);

        // Ordenar por fecha (más reciente primero)
        fileVersions.sort((a, b) => b.created_at - a.created_at);

        // Mantener el más reciente
        console.log(`   ✓ Mantener: ${fileVersions[0].id} (más reciente)`);

        // Marcar el resto para eliminar
        for (let i = 1; i < fileVersions.length; i++) {
          console.log(`   ✗ Eliminar: ${fileVersions[i].id} (duplicado)`);
          filesToDelete.push(fileVersions[i].id);
          totalDuplicates++;
        }
        console.log();
      } else {
        console.log(`📄 ${filename}`);
        console.log(`   ✓ Sin duplicados: ${fileVersions[0].id}\n`);
      }
    }

    if (filesToDelete.length === 0) {
      console.log("✅ No hay duplicados para eliminar.");
      return;
    }

    // 4. Confirmar eliminación
    console.log("=".repeat(60));
    console.log(`⚠️  SE ELIMINARÁN ${totalDuplicates} ARCHIVOS DUPLICADOS`);
    console.log("=".repeat(60));
    console.log(
      "\nEsto eliminará permanentemente los archivos duplicados más antiguos."
    );
    console.log("Los file_ids eliminados quedarán inválidos.\n");

    // En Node.js no podemos hacer input interactivo fácilmente en TypeScript
    // Por seguridad, requiere que el usuario edite el script para confirmar
    const CONFIRM_DELETE = false; // Cambiar a true para confirmar

    if (!CONFIRM_DELETE) {
      console.log('⚠️  Para confirmar la eliminación, edita este script:');
      console.log("   scripts/cleanup-files.ts");
      console.log("   Cambia: const CONFIRM_DELETE = false");
      console.log("   A:      const CONFIRM_DELETE = true\n");
      console.log("Archivos que se eliminarían:");
      filesToDelete.forEach((id) => console.log(`   - ${id}`));
      return;
    }

    // 5. Eliminar duplicados
    console.log("\n🗑️  Eliminando archivos duplicados...\n");

    let successCount = 0;
    let failCount = 0;

    for (const fileId of filesToDelete) {
      try {
        await openai.files.delete(fileId);
        console.log(`  ✓ Eliminado: ${fileId}`);
        successCount++;
      } catch (error) {
        console.error(`  ✗ Error eliminando ${fileId}:`, error);
        failCount++;
      }
    }

    // 6. Resumen final
    console.log("\n" + "=".repeat(60));
    console.log("✅ LIMPIEZA COMPLETADA");
    console.log("=".repeat(60));
    console.log(`Archivos eliminados exitosamente: ${successCount}`);
    if (failCount > 0) {
      console.log(`Archivos que fallaron: ${failCount}`);
    }

    // 7. Listar archivos restantes
    console.log("\n📋 Archivos únicos restantes:\n");
    for (const [filename, fileVersions] of filesByName) {
      const remaining = fileVersions.filter(
        (v) => !filesToDelete.includes(v.id)
      );
      if (remaining.length > 0) {
        console.log(`  ${filename}`);
        console.log(`    ID: ${remaining[0].id}`);
      }
    }

    console.log("\n💡 Tip: Ejecuta scripts/upload-files.ts si necesitas");
    console.log("   regenerar OPENAI_FILE_IDS con los archivos únicos.");
  } catch (error) {
    console.error("\n❌ ERROR:", error);
    throw error;
  }
}

// Ejecutar el script
cleanupDuplicateFiles()
  .then(() => {
    console.log("\n✓ Script completado");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n✗ Script falló:", error);
    process.exit(1);
  });
