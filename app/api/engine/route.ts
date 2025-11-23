import { NextResponse } from "next/server";
import { SimulationEngine } from "@/lib/orchestator/simulationEngine";

/**
 * INTELLIGENT ENGINE API ROUTE
 *
 * This endpoint processes messages for existing simulations.
 * To create a simulation, use /api/generar-caso first.
 *
 * The Decision Agent (LLM) automatically decides what to do with each message:
 * - Patient interaction → Talk to patient
 * - Submit diagnosis → Generate feedback automatically
 * - End simulation → Mark as abandoned
 *
 * Flow:
 * 1. POST /api/generar-caso { especialidad, nivel_dificultad }
 *    → Returns simulationId + initial greeting
 * 2. POST /api/engine { simulationId, message }
 *    → Processes message intelligently
 */

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { simulationId, message } = body;

    if (!simulationId || typeof simulationId !== "string") {
      return NextResponse.json(
        {
          error:
            "simulationId is required. Create a simulation first using /api/generar-caso",
        },
        { status: 400 }
      );
    }

    if (!message || typeof message !== "string" || message.trim() === "") {
      return NextResponse.json(
        { error: "message is required and must be a non-empty string" },
        { status: 400 }
      );
    }

    try {
      const result = await SimulationEngine.processMessage(
        simulationId,
        message
      );

      // Get updated simulation to include requested exams
      const updatedSimulation = SimulationEngine.getSimulation(simulationId, false);

      return NextResponse.json({
        success: true,
        data: {
          actionTaken: result.actionTaken,
          reasoning: result.reasoning,
          response: result.response,
          feedback: result.feedback,
          examResult: result.examResult,
          requestedExams: updatedSimulation?.requestedExams || [],
          timestamp: result.timestamp,
        },
      });
    } catch (error) {
      console.error("Error processing message:", error);

      if (error instanceof Error) {
        if (error.message.includes("not found")) {
          return NextResponse.json(
            {
              error:
                "Simulation not found. It may have expired or been deleted.",
              message: error.message,
            },
            { status: 404 }
          );
        }

        if (error.message.includes("not active")) {
          return NextResponse.json(
            {
              error: "This simulation is no longer active.",
              message: error.message,
            },
            { status: 400 }
          );
        }
      }

      throw error;
    }
  } catch (error) {
    console.error("Engine error:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
