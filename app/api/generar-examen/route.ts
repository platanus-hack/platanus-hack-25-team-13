import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

/**
 * Generate Exam Image API
 * Busca imágenes de exámenes médicos en la estructura de carpetas
 * Implementa búsqueda eficiente tipo binaria basada en la estructura jerárquica
 * 
 * Parámetros:
 * - tipo: tipo de examen (radiografia, ecografia, laboratorio, electrocardiograma, tomografia, resonancia, examen_fisico)
 * - clasificacion: clasificación del examen (torax, abdomen, extremidades, abdominal, pelvica, cardiaca, etc.)
 * - subclasificacion: subclasificación (normal, neumonia, colelitiasis, etc.)
 */
export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const { 
      tipo, 
      clasificacion, 
      subclasificacion 
    } = body as {
      tipo?: string;
      clasificacion?: string;
      subclasificacion?: string;
    };

    if (!tipo) {
      return NextResponse.json(
        { error: "El parámetro 'tipo' es requerido" },
        { status: 400 }
      );
    }

    // Normalizar parámetros (lowercase, sin espacios)
    const tipoNormalizado = tipo.toLowerCase().trim();
    const clasificacionNormalizada = clasificacion?.toLowerCase().trim() || "";
    const subclasificacionNormalizada = subclasificacion?.toLowerCase().trim() || "";

    // Buscar la imagen usando búsqueda eficiente
    const imagePath = findExamImage(
      tipoNormalizado,
      clasificacionNormalizada,
      subclasificacionNormalizada
    );

    // Si no se encuentra la imagen, devolver respuesta exitosa con status null
    if (!imagePath) {
      return NextResponse.json(
        {
          success: true,
          data: {
            status: null,
            imageUrl: null,
            tipo: tipoNormalizado,
            clasificacion: clasificacionNormalizada || null,
            subclasificacion: subclasificacionNormalizada || null,
            message: "Examen no encontrado",
            timestamp: new Date().toISOString(),
          },
        },
        { status: 200 }
      );
    }

    // Convertir ruta del sistema a ruta pública
    const publicPath = imagePath.replace(/^.*\/public/, "");

    return NextResponse.json(
      {
        success: true,
        data: {
          status: "found",
          imageUrl: publicPath,
          tipo: tipoNormalizado,
          clasificacion: clasificacionNormalizada || null,
          subclasificacion: subclasificacionNormalizada || null,
          timestamp: new Date().toISOString(),
        },
      },
      { status: 200 }
    );
  } catch (err) {
    console.error("Error buscando imagen de examen:", err);
    return NextResponse.json(
      { error: "Error buscando imagen de examen" },
      { status: 500 }
    );
  }
}

/**
 * Busca una imagen de examen usando búsqueda eficiente tipo binaria
 * La estructura es: /public/examenes/{tipo}/{clasificacion}/{subclasificacion}/imagen.{ext}
 */
function findExamImage(
  tipo: string,
  clasificacion: string,
  subclasificacion: string
): string | null {
  const publicDir = path.join(process.cwd(), "public", "examenes");
  
  // Paso 1: Buscar carpeta del tipo (búsqueda directa)
  const tipoPath = path.join(publicDir, tipo);
  if (!fs.existsSync(tipoPath) || !fs.statSync(tipoPath).isDirectory()) {
    return null;
  }

  // Paso 2: Si no hay clasificación, buscar directamente en el tipo (ej: electrocardiograma)
  if (!clasificacion) {
    return findImageInDirectory(tipoPath);
  }

  // Paso 3: Buscar carpeta de clasificación (búsqueda directa)
  const clasificacionPath = path.join(tipoPath, clasificacion);
  if (!fs.existsSync(clasificacionPath) || !fs.statSync(clasificacionPath).isDirectory()) {
    return null;
  }

  // Paso 4: Si no hay subclasificación, buscar directamente en la clasificación
  if (!subclasificacion) {
    return findImageInDirectory(clasificacionPath);
  }

  // Paso 5: Buscar carpeta de subclasificación (búsqueda directa)
  const subclasificacionPath = path.join(clasificacionPath, subclasificacion);
  if (!fs.existsSync(subclasificacionPath) || !fs.statSync(subclasificacionPath).isDirectory()) {
    return null;
  }

  // Paso 6: Buscar imagen en la carpeta de subclasificación
  return findImageInDirectory(subclasificacionPath);
}

/**
 * Busca una imagen en un directorio específico
 * Busca archivos con nombres comunes: imagen.{ext} o cualquier archivo de imagen
 * Extensiones soportadas: jpg, jpeg, png, webp
 */
function findImageInDirectory(directoryPath: string): string | null {
  const extensions = ["jpg", "jpeg", "png", "webp"];
  
  // Primero intentar con "imagen.{ext}"
  for (const ext of extensions) {
    const imagePath = path.join(directoryPath, `imagen.${ext}`);
    if (fs.existsSync(imagePath) && fs.statSync(imagePath).isFile()) {
      return imagePath;
    }
  }

  // Si no encuentra "imagen.{ext}", buscar cualquier archivo de imagen en el directorio
  try {
    const files = fs.readdirSync(directoryPath);
    for (const file of files) {
      const filePath = path.join(directoryPath, file);
      if (fs.statSync(filePath).isFile()) {
        const ext = file.split(".").pop()?.toLowerCase();
        if (ext && extensions.includes(ext)) {
          return filePath;
        }
      }
    }
  } catch (error) {
    console.error("Error leyendo directorio:", directoryPath, error);
    return null;
  }

  return null;
}

