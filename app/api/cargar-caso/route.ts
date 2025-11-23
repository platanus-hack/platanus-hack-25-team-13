import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";

/**
 * Load Case API
 * Loads a case by public_id from Supabase
 */
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const publicId = searchParams.get("public_id");

    if (!publicId) {
      return NextResponse.json(
        { error: "public_id is required" },
        { status: 400 }
      );
    }

    const supabase = createServerClient();
    const { data: anamnesisData, error } = await supabase
      .from("anamnesis")
      .select("summary, title, created_at")
      .eq("public_id", publicId)
      .single();

    if (error || !anamnesisData) {
      return NextResponse.json(
        { error: "Case not found" },
        { status: 404 }
      );
    }

    // Parse the summary JSON
    let caseData;
    try {
      caseData = JSON.parse(anamnesisData.summary || "{}");
    } catch (parseError) {
      return NextResponse.json(
        { error: "Invalid case data" },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        data: {
          ...caseData,
          publicId,
          title: anamnesisData.title,
          createdAt: anamnesisData.created_at,
        },
      },
      { status: 200 }
    );
  } catch (err) {
    console.error("Error loading case:", err);
    return NextResponse.json(
      { error: "Error loading case" },
      { status: 500 }
    );
  }
}

