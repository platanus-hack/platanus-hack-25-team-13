"use client";

import { supabase } from "@/lib/supabase";

export interface Anamnesis {
  id: number;
  user_id: string;
  title?: string;
  public_id?: string;
  created_at?: string;
  updated_at?: string;
  feedback_data?: {
    puntajes?: Record<string, number>;
    comentarios?: {
      fortalezas?: string[];
      debilidades?: string[];
      sugerencias?: string[];
    };
    diagnostico?: {
      estudiante?: string;
      correcto?: boolean;
      diagnostico_real?: string;
      comentario?: string;
    };
  };
  [key: string]: unknown;
}

export function useAnamnesis() {
  const createAnamnesis = async (
    userId: string,
    title?: string
  ): Promise<Anamnesis> => {
    const { data, error } = await supabase
      .from("anamnesis")
      .insert([{ user_id: userId, title }])
      .select()
      .single();

    if (error) throw error;
    return data;
  };

  const getAnamnesisById = async (id: number): Promise<Anamnesis | null> => {
    const { data, error } = await supabase
      .from("anamnesis")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      console.error("Error loading anamnesis:", error);
      return null;
    }

    return data;
  };

  const getAnamnesisByPublicId = async (
    publicId: string
  ): Promise<Anamnesis | null> => {
    const { data, error } = await supabase
      .from("anamnesis")
      .select("*")
      .eq("public_id", publicId)
      .single();

    if (error) {
      console.error("Error loading anamnesis by public_id:", error);
      return null;
    }

    return data;
  };

  const getUserAnamnesis = async (userId: string): Promise<Anamnesis[]> => {
    const { data, error } = await supabase
      .from("anamnesis")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error loading user anamnesis:", error);
      return [];
    }

    return data || [];
  };

  return {
    createAnamnesis,
    getAnamnesisById,
    getAnamnesisByPublicId,
    getUserAnamnesis,
  };
}

