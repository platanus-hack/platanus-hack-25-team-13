"use client";

import { useEffect, useState } from "react";
import { User } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Helper function to update profile from user metadata (only called when needed)
  const updateProfileFromMetadata = async (userId: string, userMetadata: any) => {
    try {
      // Wait a bit for the profile to be created by trigger if it doesn't exist
      await new Promise((resolve) => setTimeout(resolve, 500));
      
      // Check current profile
      const { data: profileData } = await supabase
        .from("profiles")
        .select("first_name, last_name, favorite_category_id")
        .eq("id", userId)
        .single();
      
      // If profile is empty, try to update from user metadata or Google profile
      if (profileData && !profileData.first_name && !profileData.last_name) {
        const fullName = userMetadata?.full_name || userMetadata?.name || "";
        const firstName = userMetadata?.first_name || userMetadata?.given_name || "";
        const lastName = userMetadata?.last_name || userMetadata?.family_name || "";
        
        // Try to split full_name if first/last are not available
        let finalFirstName = firstName;
        let finalLastName = lastName;
        
        if (!finalFirstName && !finalLastName && fullName) {
          const nameParts = fullName.trim().split(" ");
          finalFirstName = nameParts[0] || null;
          finalLastName = nameParts.slice(1).join(" ") || null;
        }
        
        if (finalFirstName || finalLastName || userMetadata?.favorite_category_id) {
          await supabase
            .from("profiles")
            .update({
              first_name: finalFirstName || null,
              last_name: finalLastName || null,
              favorite_category_id: userMetadata?.favorite_category_id || profileData.favorite_category_id || null,
            })
            .eq("id", userId);
        }
      }
    } catch (error) {
      console.error("Error updating profile from metadata:", error);
    }
  };

  // Get current user
  useEffect(() => {
    let mounted = true;
    let updateTimeout: NodeJS.Timeout | null = null;
    const processedUsers = new Set<string>(); // Track which users we've already processed

    const getSession = async () => {
      const { data } = await supabase.auth.getSession();
      const currentUser = data.session?.user ?? null;
      if (mounted) {
        setUser(currentUser);
        setLoading(false);
        
        // If user is authenticated and we haven't processed this user yet, try to update profile from metadata
        if (currentUser && !processedUsers.has(currentUser.id)) {
          processedUsers.add(currentUser.id);
          if (updateTimeout) clearTimeout(updateTimeout);
          updateTimeout = setTimeout(() => {
            updateProfileFromMetadata(currentUser.id, currentUser.user_metadata);
          }, 2000); // Debounce to avoid excessive calls
        }
      }
    };

    getSession();

    // Listen for auth state changes (login/logout)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (!mounted) return;
      
      const currentUser = session?.user ?? null;
      setUser(currentUser);
      setLoading(false);
      
      // If user is authenticated and we haven't processed this user yet, try to update profile from metadata
      if (currentUser && !processedUsers.has(currentUser.id)) {
        processedUsers.add(currentUser.id);
        if (updateTimeout) clearTimeout(updateTimeout);
        updateTimeout = setTimeout(() => {
          updateProfileFromMetadata(currentUser.id, currentUser.user_metadata);
        }, 2000); // Debounce to avoid excessive calls
      } else if (!currentUser) {
        // Clear processed users when logged out
        processedUsers.clear();
      }
    });

    return () => {
      mounted = false;
      if (updateTimeout) clearTimeout(updateTimeout);
      subscription.unsubscribe();
    };
  }, []);

  // Auth methods
  const login = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    
    // If login successful, check if profile needs to be updated
    if (!error && data.user) {
      // Wait a bit for the profile to be created by trigger if it doesn't exist
      await new Promise((resolve) => setTimeout(resolve, 500));
      
      // Check if profile exists and is empty
      const { data: profileData } = await supabase
        .from("profiles")
        .select("first_name, last_name, favorite_category_id")
        .eq("id", data.user.id)
        .single();
      
      // If profile is empty, try to update from user_metadata
      if (profileData && !profileData.first_name && !profileData.last_name) {
        const userMetadata = data.user.user_metadata;
        if (userMetadata?.first_name || userMetadata?.last_name) {
          await supabase
            .from("profiles")
            .update({
              first_name: userMetadata.first_name || null,
              last_name: userMetadata.last_name || null,
              favorite_category_id: userMetadata.favorite_category_id || null,
            })
            .eq("id", data.user.id);
        }
      }
    }
    
    return { data, error };
  };

  const signup = async (
    email: string,
    password: string,
    firstName: string,
    lastName: string,
    favoriteCategoryId?: number
  ) => {
    // First, create the auth user
    // The trigger will automatically create the profile with just the id
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          first_name: firstName,
          last_name: lastName,
          favorite_category_id: favoriteCategoryId || null,
        },
      },
    });

    if (authError || !authData.user) {
      return { data: null, error: authError };
    }

    // Check if email confirmation is required (no session after signup)
    if (!authData.session) {
      // Email confirmation required - return success but no session
      // The trigger will still create the profile
      // The profile data is saved in user_metadata and will be used after email confirmation
      return { data: authData, error: null };
    }

    // Wait for session to be established
    // Supabase signUp sometimes doesn't immediately establish a session
    let sessionEstablished = false;
    let attempts = 0;
    const maxAttempts = 10;

    while (!sessionEstablished && attempts < maxAttempts) {
      const { data: sessionData } = await supabase.auth.getSession();
      if (sessionData.session) {
        sessionEstablished = true;
        break;
      }
      await new Promise((resolve) => setTimeout(resolve, 200));
      attempts++;
    }

    if (!sessionEstablished) {
      console.warn("Session not established after signUp, signing in...");
      // Try to sign in with the credentials to establish session
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (signInError) {
        console.error("Failed to establish session:", signInError);
        // User is created but we can't update profile without session
        // This might be due to email confirmation requirement
        return { data: authData, error: null };
      }
    }

    // Wait a bit more for the trigger to complete
    await new Promise((resolve) => setTimeout(resolve, 300));

    // Update the profile with additional information
    // The profile was already created by the trigger, we just update it
    const { data: profileData, error: profileError } = await supabase
      .from("profiles")
      .update({
        first_name: firstName,
        last_name: lastName,
        favorite_category_id: favoriteCategoryId || null,
      })
      .eq("id", authData.user.id)
      .select()
      .single();

    if (profileError) {
      console.error("Error updating profile:", {
        message: profileError.message,
        details: profileError.details,
        hint: profileError.hint,
        code: profileError.code,
      });
      
      // Profile might not exist yet, wait a bit more and retry
      await new Promise((resolve) => setTimeout(resolve, 500));
      const { error: retryError } = await supabase
        .from("profiles")
        .update({
          first_name: firstName,
          last_name: lastName,
          favorite_category_id: favoriteCategoryId || null,
        })
        .eq("id", authData.user.id);

      if (retryError) {
        console.error("Error updating profile after retry:", retryError);
        // User is created, profile will be updated on next login
        return { data: authData, error: null };
      }
    }

    return { data: authData, error: null };
  };

  const loginWithGoogle = () =>
    supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/`,
      },
    });

  const logout = () => supabase.auth.signOut();

  return { user, loading, login, signup, loginWithGoogle, logout };
}

