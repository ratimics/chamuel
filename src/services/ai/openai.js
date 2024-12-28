import { OpenAI } from "openai";

export function createOpenAIClient() {
  return new OpenAI({
    baseURL: process.env.OPENAI_API_URL,
    apiKey: process.env.OPENAI_API_KEY,
    defaultHeaders: {
      "HTTP-Referer": process.env.YOUR_SITE_URL,
      "X-Title": process.env.YOUR_SITE_NAME,
    },
  });
}
