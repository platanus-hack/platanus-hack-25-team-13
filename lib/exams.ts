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
 * Finds the best matching exam image based on request parameters
 * Uses intelligent matching to find the most appropriate image
 */
export function findExamImage(
  tipo: string,
  clasificacion: string,
  subclasificacion: string
): string | null {
  const availableExams = scanAvailableExams();

  // Normalize search parameters
  const tipoNorm = tipo.toLowerCase().trim();
  const clasificacionNorm = clasificacion?.toLowerCase().trim() || "";
  const subclasificacionNorm = subclasificacion?.toLowerCase().trim() || "";

  // Score each available image based on match quality
  const scored = availableExams.map((imagePath) => {
    const relativePath = imagePath.replace(
      /^.*[\\\/]public[\\\/]examenes[\\\/]/,
      ""
    );
    const parts = relativePath.toLowerCase().split(/[\\\/]/);

    let score = 0;

    // Match tipo (most important)
    if (parts[0] === tipoNorm) {
      score += 100;
    } else if (parts[0].includes(tipoNorm) || tipoNorm.includes(parts[0])) {
      score += 50;
    }

    // Match clasificacion (if provided)
    if (clasificacionNorm && parts.length > 1) {
      if (parts[1] === clasificacionNorm) {
        score += 50;
      } else if (
        parts[1].includes(clasificacionNorm) ||
        clasificacionNorm.includes(parts[1])
      ) {
        score += 25;
      }
    }

    // Match subclasificacion (if provided)
    if (subclasificacionNorm && parts.length > 2) {
      if (parts[2] === subclasificacionNorm) {
        score += 30;
      } else if (
        parts[2].includes(subclasificacionNorm) ||
        subclasificacionNorm.includes(parts[2])
      ) {
        score += 15;
      }
    } else if (
      !subclasificacionNorm &&
      parts.length > 2 &&
      parts[2] === "normal"
    ) {
      // Prefer "normal" if no subclasificacion specified
      score += 20;
    }

    return { imagePath, score };
  });

  // Sort by score (highest first)
  scored.sort((a, b) => b.score - a.score);

  // Return the best match if score is reasonable
  if (scored.length > 0 && scored[0].score >= 100) {
    // Convert to public path
    const publicPath = scored[0].imagePath
      .replace(/^.*[\\\/]public/, "")
      .replace(/\\/g, "/");
    return publicPath;
  }

  return null;
}

/**
 * Clears the exam cache (useful for development)
 */
export function clearExamCache(): void {
  availableExamsCache = null;
}