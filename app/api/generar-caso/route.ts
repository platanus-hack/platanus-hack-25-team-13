import { NextResponse } from "next/server";
import { SimulationEngine } from "@/lib/orchestator/simulationEngine";
import { createServerClient } from "@/lib/supabase";

/**
 * Generate Case API
 * Creates a complete simulation with clinical case and initial patient greeting
 * Saves the case to Supabase with a public_id for sharing
 */
export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const { especialidad = "medicina_interna", nivel_dificultad = "medio" } =
      body as {
        especialidad?: string;
        nivel_dificultad?: "facil" | "medio" | "dificil";
      };

    // Get authenticated user from Authorization header or body
    const authHeader = req.headers.get("authorization");
    let userId: string | null = null;
    
    if (authHeader) {
      try {
        const supabase = createServerClient();
        const token = authHeader.replace("Bearer ", "");
        const { data: { user }, error } = await supabase.auth.getUser(token);
        if (!error && user) {
          userId = user.id;
        }
      } catch (authError) {
        console.error("Error getting user from token:", authError);
        // Continue without user_id if auth fails
      }
    }
    
    // Also check if user_id is provided in body (fallback)
    if (!userId && body.user_id) {
      userId = body.user_id;
    }

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

    const startTime = new Date().toISOString();
    const caseData = {
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
      startTime, // Guardar tiempo de inicio para calcular duración
    };

    // Save to Supabase if user is authenticated
    let publicId: string | null = null;
    if (userId && authHeader) {
      try {
        // Create Supabase client with user's token for RLS
        const token = authHeader.replace("Bearer ", "");
        const supabase = createServerClient(token);
        
        const title = `${simulation.clinicalCase.especialidad} - ${simulation.clinicalCase.nivel_dificultad}`;
        const summary = JSON.stringify(caseData);
        
        console.log("Attempting to save case to database for user:", userId);
        
        const { data: anamnesisData, error: dbError } = await supabase
          .from("anamnesis")
          .insert([
            {
              user_id: userId,
              title,
              summary,
              is_completed: false, // Inicialmente no completada
              created_at: new Date().toISOString(), // Guardar tiempo de inicio
            },
          ])
          .select("public_id, id, created_at")
          .single();

        if (!dbError && anamnesisData) {
          publicId = anamnesisData.public_id;
          console.log("Case saved successfully with public_id:", publicId);
        } else {
          console.error("Error saving case to database:", dbError);
          // Log more details about the error
          if (dbError) {
            console.error("Error details:", {
              code: dbError.code,
              message: dbError.message,
              details: dbError.details,
              hint: dbError.hint,
            });
          }
        }
      } catch (dbErr) {
        console.error("Error saving case to database:", dbErr);
        // Continue even if database save fails
      }
    } else {
      console.log("Skipping database save - userId:", userId, "authHeader:", !!authHeader);
    }

    return NextResponse.json(
      {
        success: true,
        data: {
          ...caseData,
          publicId, // Include public_id for sharing
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
