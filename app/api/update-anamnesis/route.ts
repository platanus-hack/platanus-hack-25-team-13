import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";

/**
 * Update Anamnesis API
 * Updates anamnesis with feedback data, completion status, and timing
 */
export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const {
      public_id,
      calificacion,
      tiempo_demora,
      is_completed,
      diagnostico_final,
      feedback_data,
    } = body as {
      public_id?: string;
      calificacion?: number;
      tiempo_demora?: number;
      is_completed?: boolean;
      diagnostico_final?: string;
      feedback_data?: any;
    };

    if (!public_id) {
      return NextResponse.json(
        { error: "public_id is required" },
        { status: 400 }
      );
    }

    // Get authenticated user from Authorization header
    const authHeader = req.headers.get("authorization");
    if (!authHeader) {
      return NextResponse.json(
        { error: "Authorization header required" },
        { status: 401 }
      );
    }

    const token = authHeader.replace("Bearer ", "");
    const supabase = createServerClient(token);

    // Build update object
    const updates: any = {};
    if (calificacion !== undefined) updates.calificacion = calificacion;
    if (tiempo_demora !== undefined) updates.tiempo_demora = tiempo_demora;
    if (is_completed !== undefined) updates.is_completed = is_completed;
    if (diagnostico_final !== undefined) updates.diagnostico_final = diagnostico_final;
    if (feedback_data !== undefined) updates.feedback_data = feedback_data;

    const { data, error } = await supabase
      .from("anamnesis")
      .update(updates)
      .eq("public_id", public_id)
      .select()
      .single();

    if (error) {
      console.error("Error updating anamnesis:", error);
      return NextResponse.json(
        { error: "Error updating anamnesis", details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        data,
      },
      { status: 200 }
    );
  } catch (err) {
    console.error("Error updating anamnesis:", err);
    return NextResponse.json(
      { error: "Error updating anamnesis" },
      { status: 500 }
    );
  }
}

