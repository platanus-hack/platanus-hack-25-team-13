import { createClient } from "@supabase/supabase-js";

export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// Server-side Supabase client for API routes
export function createServerClient(accessToken?: string) {
  const options: any = {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  };
  
  if (accessToken) {
    // Set auth header for RLS - this is the key for server-side auth
    options.global = {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    };
  }
  
  const client = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    options
  );
  
  return client;
}

