"use client";

import { useEffect, useState, useRef } from "react";
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

// Simple cache to avoid duplicate requests
const profileCache = new Map<string, { profile: Profile | null; timestamp: number }>();
const CACHE_DURATION = 60000; // 1 minute cache

export function useProfile(userId?: string) {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const lastUserIdRef = useRef<string | undefined>(undefined);
  const loadingRef = useRef(false);

  useEffect(() => {
    // Only reload if userId actually changed
    if (userId === lastUserIdRef.current) {
      return;
    }

    // Update ref immediately to prevent duplicate calls
    lastUserIdRef.current = userId;

    if (!userId) {
      setProfile(null);
      setLoading(false);
      return;
    }

    // Check cache first
    const cached = profileCache.get(userId);
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      setProfile(cached.profile);
      setLoading(false);
      return;
    }

    // Prevent concurrent requests for the same userId
    if (loadingRef.current) {
      return;
    }

    let mounted = true;
    loadingRef.current = true;
    setLoading(true);

    const loadProfile = async () => {
      try {
        // First get the profile
        const { data: profileData, error: profileError } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", userId)
          .single();

        if (!mounted) return;

        if (profileError) {
          // If profile doesn't exist, return null
          if (profileError.code === "PGRST116") {
            const result = null;
            setProfile(result);
            profileCache.set(userId, { profile: result, timestamp: Date.now() });
          } else {
            console.error("Error loading profile:", {
              message: profileError.message,
              details: profileError.details,
              hint: profileError.hint,
              code: profileError.code,
            });
            const result = null;
            setProfile(result);
            profileCache.set(userId, { profile: result, timestamp: Date.now() });
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
          profileCache.set(userId, { profile: combinedData, timestamp: Date.now() });
        }
      } catch (error) {
        if (!mounted) return;
        console.error("Error loading profile:", error);
        const result = null;
        setProfile(result);
        profileCache.set(userId, { profile: result, timestamp: Date.now() });
      } finally {
        if (mounted) {
          setLoading(false);
          loadingRef.current = false;
        }
      }
    };

    loadProfile();

    return () => {
      mounted = false;
      loadingRef.current = false;
    };
  }, [userId]);

  return { profile, loading };
}

