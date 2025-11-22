"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { FaUser } from "react-icons/fa";

export type AvatarExpression = 
  | "neutral" 
  | "hablando" 
  | "pensando" 
  | "dolor" 
  | "preocupado" 
  | "aliviado" 
  | "diagnostico" 
  | "esperando";

interface ChatAvatarProps {
  expression?: AvatarExpression;
  step?: number;
  loading?: boolean;
  lastMessageRole?: "user" | "assistant";
}

export default function ChatAvatar({ 
  expression, 
  step = 0, 
  loading = false,
  lastMessageRole 
}: ChatAvatarProps) {
  const [currentExpression, setCurrentExpression] = useState<AvatarExpression>("neutral");

  useEffect(() => {
    // Determinar expresión automáticamente si no se proporciona
    if (expression) {
      setCurrentExpression(expression);
      return;
    }

    // Lógica automática basada en el contexto
    if (loading) {
      setCurrentExpression("pensando");
    } else if (step === 0) {
      setCurrentExpression("neutral");
    } else if (step === 1) {
      // Durante la consulta
      if (lastMessageRole === "user") {
        setCurrentExpression("pensando");
      } else {
        setCurrentExpression("hablando");
      }
    } else if (step === 2) {
      // Durante el diagnóstico
      setCurrentExpression("diagnostico");
    } else {
      setCurrentExpression("esperando");
    }
  }, [expression, step, loading, lastMessageRole]);

  // Intentar cargar la imagen, si falla usar el icono por defecto
  const imagePath = `/avatares/${currentExpression}.png`;
  const [imageError, setImageError] = useState(false);

  return (
    <div className="flex items-center justify-center h-full p-4">
      {!imageError ? (
        <div className="relative w-48 h-48 md:w-64 md:h-64">
          <Image
            src={imagePath}
            alt={`Avatar ${currentExpression}`}
            fill
            className="object-contain transition-opacity duration-300"
            onError={() => setImageError(true)}
            priority
          />
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center">
          <FaUser className="w-32 h-32 text-[#1098f7] opacity-50" />
          <p className="mt-2 text-xs text-gray-400 text-center">
            Avatar: {currentExpression}
          </p>
        </div>
      )}
    </div>
  );
}


