"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { FaUser, FaTimes, FaSearchPlus } from "react-icons/fa";

export type ImageType = 
  | "feliz" 
  | "neutral" 
  | "sorprendido" 
  | "triste"
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
   * Si está cargando, muestra imagen de "neutral"
   */
  loading?: boolean;
  /**
   * Rol del último mensaje para determinar el estado visual
   */
  lastMessageRole?: "user" | "assistant";
  /**
   * Contenido del último mensaje del asistente (paciente) para analizar la expresión
   */
  lastMessageContent?: string;
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
  /**
   * Texto informativo a mostrar debajo del avatar (ej: nombre, edad del paciente)
   */
  infoText?: string;
  /**
   * Sexo del paciente para determinar la carpeta de imágenes ("masculino" usa /avatares/hombre/)
   */
  sexo?: "masculino" | "femenino" | "otro";
  /**
   * Habilita la funcionalidad de zoom al hacer click (solo para imágenes de exámenes)
   */
  enableZoom?: boolean;
}

/**
 * Analiza el contenido del mensaje y determina la expresión apropiada
 */
export function analyzeMessageForExpression(content: string): ImageType {
  if (!content) return "neutral";

  const lowerContent = content.toLowerCase();

  // Palabras clave para triste
  const sadKeywords = [
    "dolor", "duele", "molestia", "ardor", "quemazón", "punzada",
    "dolores", "me duele", "siento dolor", "tengo dolor", "doloroso",
    "triste", "mal", "malestar", "sufro", "sufriendo", "preocupado",
    "preocupada", "ansioso", "ansiosa", "nervioso", "nerviosa",
    "miedo", "temor", "asustado", "asustada", "inquieto", "inquieta"
  ];

  // Palabras clave para sorprendido
  const surprisedKeywords = [
    "sorprendido", "sorprendida", "increíble", "increible", "wow", "oh",
    "no sabía", "no sabia", "no lo sabía", "no lo sabia", "qué", "que",
    "cómo", "como", "realmente", "de verdad"
  ];

  // Palabras clave para feliz
  const happyKeywords = [
    "mejor", "me siento mejor", "aliviado", "aliviada", "bien", "bienestar",
    "gracias", "entendido", "perfecto", "ok", "de acuerdo", "está bien",
    "esta bien", "bueno", "buena", "feliz", "contento", "contenta"
  ];

  // Verificar triste (prioridad alta)
  if (sadKeywords.some(keyword => lowerContent.includes(keyword))) {
    return "triste";
  }

  // Verificar sorprendido
  if (surprisedKeywords.some(keyword => lowerContent.includes(keyword))) {
    return "sorprendido";
  }

  // Verificar feliz
  if (happyKeywords.some(keyword => lowerContent.includes(keyword))) {
    return "feliz";
  }

  // Por defecto: neutral
  return "neutral";
}

/**
 * Determina qué imagen mostrar basándose en el contexto
 */
export function determineImageType(
  imageType?: ImageType,
  step?: number,
  loading?: boolean,
  lastMessageRole?: "user" | "assistant",
  lastMessageContent?: string
): ImageType {
  // Si se proporciona un tipo explícito, usarlo
  if (imageType) {
    return imageType;
  }

  // Lógica automática basada en el contexto
  if (loading) {
    return "neutral";
  }

  if (step === 0) {
    return "neutral";
  }

  if (step === 1) {
    // Durante la consulta
    if (lastMessageRole === "user") {
      return "neutral"; // El paciente está esperando después de que el usuario habla
    } else if (lastMessageRole === "assistant") {
      // Analizar el contenido del mensaje del asistente (paciente) para determinar expresión
      if (lastMessageContent) {
        return analyzeMessageForExpression(lastMessageContent);
      }
      return "neutral"; // Por defecto neutral
    }
    return "neutral";
  }

  if (step === 2) {
    // Durante el diagnóstico/feedback
    return "neutral";
  }

  return "neutral";
}

/**
 * Obtiene la ruta completa de la imagen
 */
export function getImagePath(
  imageType: ImageType,
  basePath: string = "/avatares",
  sexo?: "masculino" | "femenino" | "otro"
): string {
  // Si es una ruta absoluta o URL, devolverla tal cual
  if (imageType.startsWith("/") || imageType.startsWith("http")) {
    return imageType;
  }

  // Determinar la carpeta según el sexo
  let finalBasePath = basePath;
  let fileName = imageType;

  if (sexo === "masculino") {
    // Usar carpeta "hombre"
    finalBasePath = `${basePath}/hombre`;
    // Manejar typo en el nombre del archivo
    if (imageType === "sorprendido") {
      fileName = "sorprendido";
    }
  } else if (sexo === "femenino") {
    // Usar carpeta "mujer"
    finalBasePath = `${basePath}/mujer`;
    // En carpeta mujer, "sorprendido" se llama "sorprendida"
    if (imageType === "sorprendido") {
      fileName = "sorprendida";
    }
  }

  // Si es un tipo predefinido, construir la ruta
  return `${finalBasePath}/${fileName}.png`;
}

export default function ChatImage({ 
  imageType, 
  imageBasePath = "/avatares",
  step = 0, 
  loading = false,
  lastMessageRole,
  lastMessageContent,
  width,
  height,
  className = "",
  infoText,
  sexo,
  enableZoom = false
}: ChatImageProps) {
  const [currentImageType, setCurrentImageType] = useState<ImageType>("neutral");
  const [imageError, setImageError] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    const determinedType = determineImageType(
      imageType,
      step,
      loading,
      lastMessageRole,
      lastMessageContent
    );
    setCurrentImageType(determinedType);
    setImageError(false); // Reset error cuando cambia la imagen
  }, [imageType, step, loading, lastMessageRole, lastMessageContent]);

  const imagePath = getImagePath(currentImageType, imageBasePath, sexo);

  // Cerrar modal con ESC
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isModalOpen) {
        setIsModalOpen(false);
      }
    };

    if (isModalOpen) {
      document.addEventListener("keydown", handleEscape);
      // Prevenir scroll del body cuando el modal está abierto
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "unset";
    };
  }, [isModalOpen]);

  const handleImageClick = () => {
    if (!imageError) {
      setIsModalOpen(true);
    }
  };

  const handleCloseModal = (e: React.MouseEvent) => {
    // Cerrar solo si se hace click en el fondo o en el botón de cerrar
    if (e.target === e.currentTarget || (e.target as HTMLElement).closest('[data-close-modal]')) {
      setIsModalOpen(false);
    }
  };

  return (
    <>
      <div className={`flex flex-col items-center justify-center h-full p-4 ${className}`}>
        {!imageError ? (
          <>
            <div 
              className={`relative w-48 h-48 md:w-64 md:h-64 ${enableZoom ? 'cursor-pointer group' : ''}`}
              style={width && height ? { width: `${width}px`, height: `${height}px` } : undefined}
              onClick={enableZoom ? handleImageClick : undefined}
            >
              <Image
                src={imagePath}
                alt={`Chat image: ${currentImageType}`}
                fill={!width || !height}
                width={width}
                height={height}
                className="object-contain"
                onError={() => setImageError(true)}
                priority
              />
              {/* Indicador de zoom - solo visible si enableZoom está activado */}
              {enableZoom && (
                <div className="absolute inset-0 flex items-center justify-center rounded-lg pointer-events-none opacity-0 group-hover:opacity-50 transition-opacity duration-300">
                  <div className="bg-black bg-opacity-10 rounded-lg absolute inset-0" />
                  <FaSearchPlus className="text-white opacity-70 text-2xl drop-shadow-2xl relative z-10" />
                </div>
              )}
            </div>
            {infoText && (
              <div className="mt-4 text-center">
                <p className="text-sm font-medium text-gray-700">{infoText}</p>
              </div>
            )}
          </>
        ) : (
          <div className="flex flex-col items-center justify-center">
            <FaUser className="w-32 h-32 text-[#1098f7] opacity-50" />
            <p className="mt-2 text-xs text-gray-400 text-center">
              {typeof currentImageType === "string" && currentImageType.startsWith("/")
                ? "Imagen no encontrada"
                : `Imagen: ${currentImageType}`}
            </p>
            {infoText && (
              <div className="mt-4 text-center">
                <p className="text-sm font-medium text-gray-700">{infoText}</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modal de zoom */}
      {isModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-90 p-4"
          onClick={handleCloseModal}
        >
          {/* Botón de cerrar */}
          <button
            data-close-modal
            onClick={handleCloseModal}
            className="absolute top-4 right-4 z-10 text-white hover:text-gray-300 transition-colors bg-black bg-opacity-50 rounded-full p-2 hover:bg-opacity-70"
            aria-label="Cerrar"
          >
            <FaTimes className="w-6 h-6" />
          </button>

          {/* Imagen en pantalla completa */}
          <div className="relative w-full h-full max-w-7xl max-h-[90vh] flex items-center justify-center">
            <Image
              src={imagePath}
              alt={`Imagen ampliada: ${currentImageType}`}
              fill
              className="object-contain"
              priority
              sizes="100vw"
            />
          </div>

          {/* Texto informativo en el modal */}
          {infoText && (
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black bg-opacity-70 text-white px-4 py-2 rounded-lg">
              <p className="text-sm font-medium">{infoText}</p>
            </div>
          )}

          {/* Indicador de que se puede cerrar con ESC */}
          <div className="absolute bottom-4 right-4 bg-black bg-opacity-50 text-white text-xs px-3 py-1 rounded">
            Presiona ESC para cerrar
          </div>
        </div>
      )}
    </>
  );
}
