"use client";

import { supabase } from "@/lib/supabase";

interface AnamnesisMessage {
  id: number;
  anamnesis_id: number;
  role: "user" | "assistant" | "system";
  message: string;
  created_at?: string;
  [key: string]: unknown;
}

export function useAnamnesisMessages() {
  const addMessage = async (
    anamnesisId: number,
    role: "user" | "assistant" | "system",
    message: string
  ): Promise<AnamnesisMessage> => {
    const { data, error } = await supabase
      .from("anamnesis_messages")
      .insert([{ anamnesis_id: anamnesisId, role, message }])
      .select()
      .single();

    if (error) throw error;
    return data;
  };

  const getMessages = async (
    anamnesisId: number
  ): Promise<AnamnesisMessage[]> => {
    const { data, error } = await supabase
      .from("anamnesis_messages")
      .select("*")
      .eq("anamnesis_id", anamnesisId)
      .order("created_at", { ascending: true });

    if (error) {
      console.error("Error loading messages:", error);
      return [];
    }

    return data || [];
  };

  return { addMessage, getMessages };
}

