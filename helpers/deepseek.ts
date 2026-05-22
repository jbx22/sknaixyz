/**
 * DeepSeek V4 Flash API client for SKNAI.
 * Uses the OpenAI-compatible API format.
 */

import "../loadEnv.js";

const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY;
const DEEPSEEK_BASE_URL = "https://api.deepseek.com";
const MODEL = "deepseek-v4-flash";

interface DeepSeekMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

interface DeepSeekRequest {
  model: string;
  messages: DeepSeekMessage[];
  temperature?: number;
  max_tokens?: number;
  response_format?: { type: "json_object" };
}

interface DeepSeekResponse {
  id: string;
  choices: {
    index: number;
    message: {
      role: string;
      content: string;
    };
    finish_reason: string;
  }[];
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

/**
 * Validates that the DeepSeek API key is configured.
 * Throws a descriptive error if not found.
 */
function validateApiKey(): void {
  if (!DEEPSEEK_API_KEY) {
    throw new Error(
      "DEEPSEEK_API_KEY is not configured. Please add it to env.json:\n" +
        '  "DEEPSEEK_API_KEY": "sk-your-api-key-here"\n' +
        "You can get your key from https://platform.deepseek.com/api_keys"
    );
  }
}

/**
 * Calls DeepSeek V4 Flash with a structured JSON prompt.
 * Uses the OpenAI-compatible chat completions API.
 */
export async function callDeepSeek(
  systemPrompt: string,
  userPrompt: string,
  options: {
    temperature?: number;
    maxTokens?: number;
    jsonMode?: boolean;
  } = {}
): Promise<string> {
  validateApiKey();

  const { temperature = 0.3, maxTokens = 4096, jsonMode = true } = options;

  const requestBody: DeepSeekRequest = {
    model: MODEL,
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
    temperature,
    max_tokens: maxTokens,
  };

  // DeepSeek supports JSON mode via response_format
  if (jsonMode) {
    requestBody.response_format = { type: "json_object" };
  }

  try {
    const response = await fetch(`${DEEPSEEK_BASE_URL}/v1/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${DEEPSEEK_API_KEY}`,
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `DeepSeek API error (${response.status}): ${errorText}`
      );
    }

    const data: DeepSeekResponse = await response.json();

    if (!data.choices || data.choices.length === 0) {
      throw new Error("DeepSeek API returned no choices");
    }

    const content = data.choices[0].message.content;
    if (!content) {
      throw new Error("DeepSeek API returned empty content");
    }

    return content;
  } catch (error) {
    if (error instanceof TypeError && error.message.includes("fetch")) {
      throw new Error(
        `Network error calling DeepSeek API: ${error.message}. Check your internet connection.`
      );
    }
    throw error;
  }
}
