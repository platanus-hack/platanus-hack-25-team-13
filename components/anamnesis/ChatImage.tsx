"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { FaUser } from "react-icons/fa";

export type ImageType = 
  | "neutral" 
  | "hablando" 
  | "pensando" 
  | "dolor" 
  | "preocupado" 
  | "aliviado" 
  | "diagnostico" 
  | "esperando"
  | string; // Permite cualquier string para imágenes personalizadas

interface ChatImageProps {
  /**
   * Tipo de imagen a mostrar. Puede ser un tipo predefinido o una ruta personalizada.
   * Si es una ruta personalizada, debe empezar con "/" o ser una URL completa.
   */
  imageType?: ImageType;
  /**
   * Ruta base para las imágenes. Por defecto es "/avatares"
   */
  imageBasePath?: string;
  /**
   * Paso actual del flujo (0: antecedentes, 1: consulta, 2: feedback)
   */
  step?: number;
  /**
   * Si está cargando, muestra imagen de "pensando"
   */
  loading?: boolean;
  /**
   * Rol del último mensaje para determinar el estado visual
   */
  lastMessageRole?: "user" | "assistant";
  /**
   * Ancho de la imagen (por defecto responsive)
   */
  width?: number;
  /**
   * Alto de la imagen (por defecto responsive)
   */
  height?: number;
  /**
   * Clase CSS adicional para el contenedor
   */
  className?: string;
}

/**
 * Determina qué imagen mostrar basándose en el contexto
 */
export function determineImageType(
  imageType?: ImageType,
  step?: number,
  loading?: boolean,
  lastMessageRole?: "user" | "assistant"
): ImageType {
  // Si se proporciona un tipo explícito, usarlo
  if (imageType) {
    return imageType;
  }

  // Lógica automática basada en el contexto
  if (loading) {
    return "pensando";
  }

  if (step === 0) {
    return "neutral";
  }

  if (step === 1) {
    // Durante la consulta
    if (lastMessageRole === "user") {
      return "pensando";
    } else {
      return "hablando";
    }
  }

  if (step === 2) {
    // Durante el diagnóstico/feedback
    return "diagnostico";
  }

  return "esperando";
}

/**
 * Obtiene la ruta completa de la imagen
 */
export function getImagePath(
  imageType: ImageType,
  basePath: string = "/avatares"
): string {
  // Si es una ruta absoluta o URL, devolverla tal cual
  if (imageType.startsWith("/") || imageType.startsWith("http")) {
    return imageType;
  }

  // Si es un tipo predefinido, construir la ruta
  return `${basePath}/${imageType}.png`;
}

export default function ChatImage({ 
  imageType, 
  imageBasePath = "/avatares",
  step = 0, 
  loading = false,
  lastMessageRole,
  width,
  height,
  className = ""
}: ChatImageProps) {
  const [currentImageType, setCurrentImageType] = useState<ImageType>("neutral");
  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    const determinedType = determineImageType(
      imageType,
      step,
      loading,
      lastMessageRole
    );
    setCurrentImageType(determinedType);
    setImageError(false); // Reset error cuando cambia la imagen
  }, [imageType, step, loading, lastMessageRole]);

  const imagePath = getImagePath(currentImageType, imageBasePath);

  return (
    <div className={`flex items-center justify-center h-full p-4 ${className}`}>
      {!imageError ? (
        <div 
          className="relative w-48 h-48 md:w-64 md:h-64"
          style={width && height ? { width: `${width}px`, height: `${height}px` } : undefined}
        >
          <Image
            src={imagePath}
            alt={`Chat image: ${currentImageType}`}
            fill={!width || !height}
            width={width}
            height={height}
            className="object-contain transition-opacity duration-300"
            onError={() => setImageError(true)}
            priority
          />
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center">
          <FaUser className="w-32 h-32 text-[#1098f7] opacity-50" />
          <p className="mt-2 text-xs text-gray-400 text-center">
            {typeof currentImageType === "string" && currentImageType.startsWith("/")
              ? "Imagen no encontrada"
              : `Imagen: ${currentImageType}`}
          </p>
        </div>
      )}
    </div>
  );
}

