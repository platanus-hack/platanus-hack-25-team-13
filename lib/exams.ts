import fs from "fs";
import path from "path";

/**
 * Centralized exam image utilities
 * Handles finding and managing medical exam images
 */

// Cache para las rutas disponibles
let availableExamsCache: string[] | null = null;

/**
 * Scans all available exam images recursively
 */
export function scanAvailableExams(): string[] {
  if (availableExamsCache) {
    return availableExamsCache;
  }

  const examDir = path.join(process.cwd(), "public", "examenes");
  const allImages: string[] = [];

  function scanDirectory(dir: string) {
    try {
      if (!fs.existsSync(dir)) return;

      const entries = fs.readdirSync(dir, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);

        if (entry.isDirectory()) {
          scanDirectory(fullPath);
        } else if (entry.isFile()) {
          const ext = path.extname(entry.name).toLowerCase();
          if ([".jpg", ".jpeg", ".png", ".webp"].includes(ext)) {
            allImages.push(fullPath);
          }
        }
      }
    } catch (error) {
      console.error("Error scanning directory:", dir, error);
    }
  }

  scanDirectory(examDir);
  availableExamsCache = allImages;
  return allImages;
}

/**
 * Maps common diagnosis terms to exam subclassifications
 */
const diagnosisMapping: Record<string, Record<string, string>> = {
  electrocardiograma: {
    "bradicardia": "bradicardia",
    "frecuencia.*baja": "bradicardia",
    "taquicardia": "taquicardia",
    "frecuencia.*alta": "taquicardia",
    "palpitaciones": "taquicardia",
    "fibrilacion.*auricular": "fibrilacion_auricular",
    "arritmia": "fibrilacion_auricular",
    "infarto": "infarto",
    "iam": "infarto",
    "sindrome.*coronario": "infarto",
    "dolor.*toracico.*agudo": "infarto",
  },
  radiografia: {
    "neumonia": "neumonia",
    "neumonía": "neumonia",
    "neumotorax": "neumotorax",
    "neumotórax": "neumotorax",
    "derrame.*pleural": "derrame_pleural",
    "fractura": "fractura",
    "artritis": "artritis",
    "obstruccion.*intestinal": "obstruccion",
    "obstrucción.*intestinal": "obstruccion",
    "ileo": "ileo",
    "íleo": "ileo",
  },
  ecografia: {
    "colelitiasis": "colelitiasis",
    "colecistitis": "colelitiasis",
    "litiasis.*biliar": "colelitiasis",
    "hepatomegalia": "hepatomegalia",
    "higado.*grande": "hepatomegalia",
    "hígado.*grande": "hepatomegalia",
    "quiste.*ovarico": "quiste_ovarico",
    "quiste.*ovárico": "quiste_ovarico",
  },
  resonancia: {
    "lesion.*cerebral": "lesion",
    "lesión.*cerebral": "lesion",
    "tumor": "lesion",
    "avc": "lesion",
    "stroke": "lesion",
  },
};

/**
 * Infers subclassification from diagnosis using fuzzy matching
 */
function inferSubclasificacionFromDiagnosis(
  diagnostico: string,
  tipo: string
): string | null {
  const mappings = diagnosisMapping[tipo];
  if (!mappings) return null;

  // Try exact and pattern matches
  for (const [pattern, subclasificacion] of Object.entries(mappings)) {
    try {
      const regex = new RegExp(pattern, "i");
      if (regex.test(diagnostico)) {
        return subclasificacion;
      }
    } catch (e) {
      // If pattern is not valid regex, try simple includes
      if (diagnostico.includes(pattern)) {
        return subclasificacion;
      }
    }
  }

  return null;
}

/**
 * Finds the best matching exam image based on request parameters
 * Uses intelligent matching to find the most appropriate image
 */
export function findExamImage(
  tipo: string,
  clasificacion: string,
  subclasificacion: string,
  diagnosticoPrincipal?: string
): string | null {
  const availableExams = scanAvailableExams();

  // Normalize search parameters
  const tipoNorm = tipo.toLowerCase().trim();
  const clasificacionNorm = clasificacion?.toLowerCase().trim() || "";
  let subclasificacionNorm = subclasificacion?.toLowerCase().trim() || "";

  console.log("🔍 [findExamImage] Búsqueda de examen:");
  console.log("   Tipo:", tipoNorm);
  console.log("   Clasificación:", clasificacionNorm || "(vacío)");
  console.log("   Subclasificación:", subclasificacionNorm || "(vacío)");
  console.log("   Diagnóstico (fallback):", diagnosticoPrincipal || "(no disponible)");

  // If no subclasificacion specified, try to infer from diagnosis
  if (!subclasificacionNorm && diagnosticoPrincipal) {
    const diagNorm = diagnosticoPrincipal.toLowerCase();
    subclasificacionNorm = inferSubclasificacionFromDiagnosis(diagNorm, tipoNorm);
    if (subclasificacionNorm) {
      console.log("   ✨ Subclasificación inferida del diagnóstico:", subclasificacionNorm);
    }
  }

  // Score each available image based on match quality
  const scored = availableExams.map((imagePath) => {
    const relativePath = imagePath.replace(
      /^.*[\\\/]public[\\\/]examenes[\\\/]/,
      ""
    );
    const parts = relativePath.toLowerCase().split(/[\\\/]/);

    let score = 0;
    const scoreDetails: string[] = [];

    // Match tipo (most important)
    if (parts[0] === tipoNorm) {
      score += 100;
      scoreDetails.push("tipo exacto (+100)");
    } else if (parts[0].includes(tipoNorm) || tipoNorm.includes(parts[0])) {
      score += 50;
      scoreDetails.push("tipo parcial (+50)");
    }

    // Match clasificacion (if provided)
    if (clasificacionNorm && parts.length > 1) {
      if (parts[1] === clasificacionNorm) {
        score += 50;
        scoreDetails.push("clasificación exacta (+50)");
      } else if (
        parts[1].includes(clasificacionNorm) ||
        clasificacionNorm.includes(parts[1])
      ) {
        score += 25;
        scoreDetails.push("clasificación parcial (+25)");
      }
    }

    // Match subclasificacion (if provided)
    if (subclasificacionNorm && parts.length > 2) {
      if (parts[2] === subclasificacionNorm) {
        score += 30;
        scoreDetails.push("subclasificación exacta (+30)");
      } else if (
        parts[2].includes(subclasificacionNorm) ||
        subclasificacionNorm.includes(parts[2])
      ) {
        score += 15;
        scoreDetails.push("subclasificación parcial (+15)");
      }
    }
    // NOTE: Removed automatic preference for "normal" images when subclasificacion is not specified
    // The decision agent should explicitly specify "normal" if needed, or better yet,
    // infer the appropriate subclasificacion based on the clinical case

    return { imagePath, relativePath, parts, score, scoreDetails };
  });

  // Sort by score (highest first)
  scored.sort((a, b) => {
    // Primary sort: by score
    if (b.score !== a.score) {
      return b.score - a.score;
    }

    // Secondary sort: when scores are tied
    // Prefer "normal" as safe fallback when we couldn't infer subclasificacion
    const aIsNormal = a.parts.includes("normal");
    const bIsNormal = b.parts.includes("normal");

    if (aIsNormal && !bIsNormal) return -1; // a (normal) comes first
    if (bIsNormal && !aIsNormal) return 1; // b (normal) comes first

    // If both normal or both not normal, use alphabetical order
    return a.relativePath.localeCompare(b.relativePath);
  });

  // Log top 5 results
  console.log("\n📊 [findExamImage] Top 5 resultados:");
  scored.slice(0, 5).forEach((item, idx) => {
    console.log(`   ${idx + 1}. [Score: ${item.score}] ${item.relativePath}`);
    console.log(`      Path parts: [${item.parts.join(", ")}]`);
    console.log(`      Detalles: ${item.scoreDetails.join(", ")}`);
  });

  // Return the best match if score is reasonable
  if (scored.length > 0 && scored[0].score >= 100) {
    // Convert to public path
    const publicPath = scored[0].imagePath
      .replace(/^.*[\\\/]public/, "")
      .replace(/\\/g, "/");
    console.log(`\n✅ [findExamImage] Imagen seleccionada: ${publicPath}`);
    console.log(`   Score final: ${scored[0].score}\n`);
    return publicPath;
  }

  console.log("\n❌ [findExamImage] No se encontró imagen con score suficiente\n");
  return null;
}

/**
 * Clears the exam cache (useful for development)
 */
export function clearExamCache(): void {
  availableExamsCache = null;
}