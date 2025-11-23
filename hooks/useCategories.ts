"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export interface Category {
  id: number;
  name: string;
  description?: string;
}

export function useCategories() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadCategories = async () => {
      try {
        const { data, error } = await supabase
          .from("categories")
          .select("*")
          .order("name", { ascending: true });

        if (error) {
          console.error("Error loading categories:", error);
          setCategories([]);
        } else {
          setCategories(data || []);
        }
      } catch (error) {
        console.error("Error loading categories:", error);
        setCategories([]);
      } finally {
        setLoading(false);
      }
    };

    loadCategories();
  }, []);

  return { categories, loading };
}


