import { NextRequest, NextResponse } from "next/server";
import { generateFeedback } from "@/lib/agents/feedbackAgent";
import { SimulationEngine } from "@/lib/orchestator/simulationEngine";
import type { StudentManagementPlan } from "@/types/case";

export async function POST(request: NextRequest) {
  try {
    const { simulationId, managementPlan } = await request.json() as {
      simulationId: string;
      managementPlan: StudentManagementPlan;
    };

    // Buscar la simulación usando SimulationEngine
    // Pasar includeDiagnosis=true para obtener el diagnóstico real del caso
    const simulation = SimulationEngine.getSimulation(simulationId, true);

    if (!simulation) {
      return NextResponse.json(
        { success: false, error: "Simulación no encontrada" },
        { status: 404 }
      );
    }

    // Generar feedback evaluando el plan de manejo del estudiante
    const feedback = await generateFeedback(
      simulation.clinicalCase,
      simulation.chatHistory || [],
      managementPlan.diagnostico,
      managementPlan // Pasar el plan de manejo del estudiante
    );

    return NextResponse.json({
      success: true,
      feedback,
    });
  } catch (error) {
    console.error("Error generating feedback:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Error desconocido",
      },
      { status: 500 }
    );
  }
}
