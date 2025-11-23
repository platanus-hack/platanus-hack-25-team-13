"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export interface Profile {
  id: string;
  first_name?: string;
  last_name?: string;
  favorite_category_id?: number;
  favorite_category?: {
    id: number;
    name: string;
    description?: string;
  };
  metadata?: Record<string, unknown>;
  created_at?: string;
  [key: string]: unknown;
}

export function useProfile(userId?: string) {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }

    const loadProfile = async () => {
      try {
        // First get the profile
        const { data: profileData, error: profileError } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", userId)
          .single();

        if (profileError) {
          // If profile doesn't exist, return null (will trigger redirect)
          if (profileError.code === "PGRST116") {
            console.log("Profile not found");
            setProfile(null);
          } else {
            console.error("Error loading profile:", {
              message: profileError.message,
              details: profileError.details,
              hint: profileError.hint,
              code: profileError.code,
            });
            setProfile(null);
          }
        } else {
          // If there's a favorite_category_id, fetch the category
          let favoriteCategory = null;
          if (profileData.favorite_category_id) {
            const { data: categoryData, error: categoryError } = await supabase
              .from("categories")
              .select("id, name, description")
              .eq("id", profileData.favorite_category_id)
              .single();

            if (!categoryError && categoryData) {
              favoriteCategory = categoryData;
            }
          }

          // Combine profile and category data
          const combinedData = {
            ...profileData,
            favorite_category: favoriteCategory,
          };
          setProfile(combinedData);
        }
      } catch (error) {
        console.error("Error loading profile:", error);
        setProfile(null);
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, [userId]);

  return { profile, loading };
}

