// Setup type definitions for built-in Supabase Runtime APIs
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";
import { ElevenLabsClient } from "npm:@elevenlabs/elevenlabs-js";
import * as hash from "npm:object-hash";

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
);

const apiKey = Deno.env.get("ELEVENLABS_API_KEY");
if (!apiKey) throw new Error("Missing ELEVENLABS_API_KEY");

const elevenlabs = new ElevenLabsClient({ apiKey });

async function uploadAudioToStorage(
  stream: ReadableStream,
  requestHash: string,
) {
  const { data, error } = await supabase.storage
    .from("audio")
    .upload(`${requestHash}.mp3`, stream, {
      contentType: "audio/mpeg",
      cacheControl: "3600",
      upsert: false,
    });

  console.log("Storage upload result", { data, error });
}

Deno.serve(async (req) => {
  const corsHeaders = {
    "Access-Control-Allow-Origin": "*", // o "http://localhost:3000"
    "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
    "Access-Control-Allow-Headers":
      "authorization, apikey, content-type, x-client-info, accept, origin, user-agent",
  };
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }
  const url = new URL(req.url);
  const text = url.searchParams.get("text");
  const voiceId = url.searchParams.get("voiceId") ?? "JBFqnCBsd6RMkjVDRZzb";

  if (!text || text.trim() === "") {
    return new Response(JSON.stringify({ error: "text is required" }), {
      status: 400,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }

  const requestHash = hash.MD5({ text, voiceId });

  // 1) cache-first: si ya existe en storage, lo devuelves
  const { data: signed } = await supabase.storage
    .from("audio")
    .createSignedUrl(`${requestHash}.mp3`, 60);

  if (signed?.signedUrl) {
    const storageRes = await fetch(signed.signedUrl);
    if (storageRes.ok) return storageRes;
  }

  try {
    // 2) pedir stream a ElevenLabs (SDK edge compatible)
    const audioStream = await elevenlabs.textToSpeech.stream(voiceId, {
      text,
      modelId: "eleven_multilingual_v2",
      outputFormat: "mp3_44100_128",
      // esto baja “time-to-first-byte”
      optimizeStreamingLatency: 3,
    });

    // audioStream es un ReadableStream<Uint8Array>
    const [browserStream, storageStream] = audioStream.tee();

    // subes en background mientras el usuario escucha
    EdgeRuntime.waitUntil(uploadAudioToStorage(storageStream, requestHash));

    return new Response(browserStream, {
      headers: {
        "Content-Type": "audio/mpeg",
        "Cache-Control": "no-store",
        ...corsHeaders,
      },
    });
  } catch (error) {
    console.log("ElevenLabs error", error);
    return new Response(
      JSON.stringify({ error: String(error?.message ?? error) }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      },
    );
  }
});
