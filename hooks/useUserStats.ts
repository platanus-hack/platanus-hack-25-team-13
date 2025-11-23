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

    // Datos de desempeño - Agrupar por fecha real (últimos 7 días)
    const hoy = new Date();
    const ultimos7Dias: Array<{ dia: string; valor: number; count: number }> = [];

    // Crear estructura para los últimos 7 días
    for (let i = 6; i >= 0; i--) {
      const fecha = new Date(hoy);
      fecha.setDate(hoy.getDate() - i);
      fecha.setHours(0, 0, 0, 0);

      const diaAbreviado = fecha.toLocaleDateString("es-ES", { weekday: "short" });
      const diaCapitalizado = diaAbreviado.charAt(0).toUpperCase() + diaAbreviado.slice(1);

      ultimos7Dias.push({
        dia: diaCapitalizado,
        valor: 0,
        count: 0,
      });
    }

    // Agrupar anamnesis por fecha
    anamnesis.forEach((a) => {
      if (!a.created_at) return;

      const fechaAnamnesis = new Date(a.created_at);
      fechaAnamnesis.setHours(0, 0, 0, 0);

      // Buscar el índice del día correspondiente
      for (let i = 0; i < 7; i++) {
        const fecha = new Date(hoy);
        fecha.setDate(hoy.getDate() - (6 - i));
        fecha.setHours(0, 0, 0, 0);

        if (fechaAnamnesis.getTime() === fecha.getTime()) {
          const puntajes = a.feedback_data?.puntajes;
          const nota = puntajes ? calcularPromedioPuntajes(puntajes) : 0;

          if (nota > 0) {
            ultimos7Dias[i].valor += nota;
            ultimos7Dias[i].count += 1;
          }
          break;
        }
      }
    });

    // Calcular promedios y preparar datos finales
    const datosDesempeno = ultimos7Dias.map((dia) => ({
      dia: dia.dia,
      valor: dia.count > 0 ? Math.round((dia.valor / dia.count) * 10) / 10 : 0,
    }));

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

