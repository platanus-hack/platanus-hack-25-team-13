import { config } from "dotenv";
import path from "path";

// Cargar variables de entorno desde .env
config({ path: path.join(process.cwd(), ".env") });

/**
 * Script para verificar que las variables de entorno se están leyendo correctamente
 *
 * Ejecutar: npx tsx scripts/verify-env.ts
 */

function verifyEnvironment() {
  console.log("🔍 Verificando variables de entorno...\n");

  // 1. Verificar OPENAI_API_KEY
  const apiKey = process.env.OPENAI_API_KEY;
  if (apiKey) {
    console.log("✅ OPENAI_API_KEY encontrada");
    console.log(`   Valor: ${apiKey.substring(0, 10)}...${apiKey.substring(apiKey.length - 4)}`);
  } else {
    console.log("❌ OPENAI_API_KEY NO encontrada");
  }

  console.log();

  // 2. Verificar OPENAI_FILE_IDS
  const fileIds = process.env.OPENAI_FILE_IDS;
  if (fileIds) {
    const ids = fileIds.split(",").map((id) => id.trim()).filter((id) => id.length > 0);
    console.log("✅ OPENAI_FILE_IDS encontrada");
    console.log(`   Cantidad de archivos: ${ids.length}`);
    console.log(`   IDs:`);
    ids.forEach((id, index) => {
      console.log(`     ${index + 1}. ${id}`);
    });
  } else {
    console.log("❌ OPENAI_FILE_IDS NO encontrada");
  }

  console.log();

  // 3. Resumen
  console.log("=".repeat(60));
  if (apiKey && fileIds) {
    console.log("✅ TODO CONFIGURADO CORRECTAMENTE");
    console.log("=".repeat(60));
    console.log("\n✓ Puedes ejecutar: npm run dev");
    console.log("✓ Los archivos se leerán correctamente desde OpenAI");
  } else {
    console.log("❌ FALTAN VARIABLES DE ENTORNO");
    console.log("=".repeat(60));
    console.log("\nAgrega al archivo .env:");
    if (!apiKey) {
      console.log("  OPENAI_API_KEY=sk-...");
    }
    if (!fileIds) {
      console.log("  OPENAI_FILE_IDS=file-xxx,file-yyy,...");
    }
  }
}

verifyEnvironment();
