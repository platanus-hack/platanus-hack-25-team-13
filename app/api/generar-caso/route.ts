import { NextResponse } from "next/server";
import { SimulationEngine } from "@/lib/orchestator/simulationEngine";

/**
 * Generate Case API
 * Creates a complete simulation with clinical case and initial patient greeting
 */
export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const { especialidad = "medicina_interna", nivel_dificultad = "medio" } =
      body as {
        especialidad?: string;
        nivel_dificultad?: "facil" | "medio" | "dificil";
      };

    // Map nivel_dificultad to difficulty
    const difficultyMap: Record<string, "easy" | "medium" | "hard"> = {
      facil: "easy",
      medio: "medium",
      dificil: "hard",
    };

    const difficulty = difficultyMap[nivel_dificultad] || "medium";
    const { simulation, initialMessage } =
      await SimulationEngine.createSimulation({
        difficulty,
        specialty: especialidad,
      });

    return NextResponse.json(
      {
        success: true,
        data: {
          simulationId: simulation.id,
          initialMessage,
          "simulation-debug": simulation,
          patientInfo: {
            edad: simulation.clinicalCase.paciente.edad,
            sexo: simulation.clinicalCase.paciente.sexo,
            ocupacion: simulation.clinicalCase.paciente.ocupacion,
            contexto_ingreso: simulation.clinicalCase.paciente.contexto_ingreso,
          },
          especialidad: simulation.clinicalCase.especialidad,
          nivel_dificultad: simulation.clinicalCase.nivel_dificultad,
          createdAt: simulation.createdAt,
        },
      },
      { status: 200 }
    );
  } catch (err) {
    console.error("Error generando caso clínico:", err);
    return NextResponse.json(
      { error: "Error generando caso clínico" },
      { status: 500 }
    );
  }
}
