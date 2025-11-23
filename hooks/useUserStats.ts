"use client";

import { useMemo } from "react";
import { Anamnesis } from "./useAnamnesis";

interface UserStats {
  totalSimulaciones: number;
  promedioNota: number;
  correctos: number;
  incorrectos: number;
  ultimaSimulacion?: string;
  ultimaSimulacionResultado?: "correcto" | "incorrecto" | "sin resultado";
  datosDesempeno: Array<{ dia: string; valor: number }>;
  categoriaFavorita?: string;
}

// Convertir porcentaje a nota chilena (1-7)
const convertirANota = (porcentaje: number): number => {
  return Math.round(((porcentaje / 100) * 6 + 1) * 10) / 10;
};

// Calcular promedio de puntajes
const calcularPromedioPuntajes = (
  puntajes?: Record<string, number>
): number => {
  if (!puntajes || Object.keys(puntajes).length === 0) return 0;

  const valores = Object.values(puntajes);
  const suma = valores.reduce((acc, val) => acc + val, 0);
  const promedio = suma / valores.length;

  // Convertir a escala 1-7 (asumiendo que los puntajes están en escala 0-7)
  return Math.round(promedio * 10) / 10;
};

export function useUserStats(anamnesis: Anamnesis[]): UserStats {
  const stats = useMemo(() => {
    const totalSimulaciones = anamnesis.length;

    // Calcular promedio de notas
    const notas = anamnesis
      .map((a) => {
        const puntajes = a.feedback_data?.puntajes;
        if (!puntajes) return null;
        return calcularPromedioPuntajes(puntajes);
      })
      .filter((n): n is number => n !== null && n > 0);

    const promedioNota =
      notas.length > 0
        ? Math.round((notas.reduce((acc, n) => acc + n, 0) / notas.length) * 10) /
          10
        : 0;

    // Contar correctos e incorrectos
    const correctos = anamnesis.filter(
      (a) => a.feedback_data?.diagnostico?.correcto === true
    ).length;

    const incorrectos = anamnesis.filter(
      (a) => a.feedback_data?.diagnostico?.correcto === false
    ).length;

    // Última simulación
    const ultimaAnamnesis = anamnesis.length > 0 ? anamnesis[0] : null;
    const ultimaSimulacion =
      ultimaAnamnesis?.created_at
        ? new Date(ultimaAnamnesis.created_at).toLocaleDateString("es-ES", {
            day: "numeric",
            month: "short",
            year: "numeric",
          })
        : undefined;
    
    // Resultado de la última simulación
    const ultimaSimulacionResultado: "correcto" | "incorrecto" | "sin resultado" | undefined = 
      ultimaAnamnesis?.feedback_data?.diagnostico?.correcto !== undefined
        ? (ultimaAnamnesis.feedback_data.diagnostico.correcto ? "correcto" : "incorrecto")
        : "sin resultado";

    // Datos de desempeño (últimos 7 días o todas si hay menos)
    const ultimos7 = anamnesis.slice(0, 7);
    const diasSemana = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];
    const datosDesempeno = ultimos7.map((a, index) => {
      const puntajes = a.feedback_data?.puntajes;
      const nota = puntajes
        ? calcularPromedioPuntajes(puntajes)
        : convertirANota(0);
      return {
        dia: diasSemana[index] || `Día ${index + 1}`,
        valor: nota,
      };
    });

    // Rellenar con ceros si hay menos de 7
    while (datosDesempeno.length < 7) {
      datosDesempeno.push({
        dia: diasSemana[datosDesempeno.length] || `Día ${datosDesempeno.length + 1}`,
        valor: 0,
      });
    }

    // Categoría favorita (basada en especialidad si está disponible)
    const categorias = anamnesis
      .map((a) => (a as any).especialidad)
      .filter((c): c is string => !!c);
    const categoriaCounts: Record<string, number> = {};
    categorias.forEach((cat) => {
      categoriaCounts[cat] = (categoriaCounts[cat] || 0) + 1;
    });
    const categoriaFavorita = Object.entries(categoriaCounts).sort(
      ([, a], [, b]) => b - a
    )[0]?.[0];

    return {
      totalSimulaciones,
      promedioNota,
      correctos,
      incorrectos: incorrectos,
      ultimaSimulacion,
      ultimaSimulacionResultado,
      datosDesempeno,
      categoriaFavorita: categoriaFavorita
        ? categoriaFavorita.charAt(0).toUpperCase() + categoriaFavorita.slice(1)
        : undefined,
    };
  }, [anamnesis]);

  return stats;
}

