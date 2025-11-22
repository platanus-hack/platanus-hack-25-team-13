import OpenAI from "openai";

let openaiInstance: OpenAI | null = null;

export function getOpenAIClient(): OpenAI {
  if (!openaiInstance) {
    const apiKey = process.env.OPENAI_API_KEY;

    if (!apiKey) {
      throw new Error(
        "OPENAI_API_KEY is not set in environment variables. " +
          "Please add it to your .env.local file."
      );
    }

    openaiInstance = new OpenAI({
      apiKey,
    });
  }

  return openaiInstance;
}

export function getModelName(): string {
  return process.env.OPENAI_MODEL || "gpt-4o";
}

export async function createChatCompletion(
  messages: OpenAI.Chat.ChatCompletionMessageParam[],
  options?: {
    temperature?: number;
    maxTokens?: number;
    responseFormat?: { type: "json_object" | "text" };
  }
): Promise<string> {
  const client = getOpenAIClient();
  const model = getModelName();

  const completion = await client.chat.completions.create({
    model,
    messages,
    temperature: options?.temperature ?? 0.7,
    max_tokens: options?.maxTokens ?? 2000,
    ...(options?.responseFormat && { response_format: options.responseFormat }),
  });

  return completion.choices[0]?.message?.content || "";
}
