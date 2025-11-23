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

    const difficultyMap: Record<string, "easy" | "medium" | "hard"> = {
      facil: "easy",
      medio: "medium",
      dificil: "hard",
    };

    const response = await fetch(
      "https://api.elevenlabs.io/v1/single-use-token/realtime_scribe",
      {
        method: "POST",
        headers: {
          "xi-api-key": process.env.ELEVENLABS_API_KEY || "",
        },
      }
    );

    if (!response.ok) {
      console.error("❌ Error al generar token:", response.status, response.statusText);
      const errorData = await response.text();
      console.error("Detalles del error:", errorData);
      return NextResponse.json(
        { error: `Error al generar token de Eleven Labs: ${response.statusText}` },
        { status: response.status }
      );
    }

    const data = await response.json();
    const token = data.token;
    
    if (!token) {
      console.error("❌ No se recibió token en la respuesta");
      return NextResponse.json(
        { error: "Error generating token to ElevenLabs" },
        { status: 500 }
      );
    }

    console.log("✅ Token generado exitosamente");
    const difficulty = difficultyMap[nivel_dificultad] || "medium";
    const { simulation, initialMessage } =
      await SimulationEngine.createSimulation({
        difficulty,
        specialty: especialidad,
      });

    return NextResponse.json(
      {
        success: true,
        sut: token,
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
