import { ChatOpenAI } from "@langchain/openai";
import { ChatAnthropic } from "@langchain/anthropic";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";

export const getLLMClient = (model) => {
  switch (model) {
    case "gemini-stream":
      const llm = new ChatGoogleGenerativeAI({
        apiKey: process.env.GEMINI_API_KEY,
        modelName: "gemini-2.0-flash-lite-preview-02-05",
        temperature: 0.2,
        streaming: true,
        convertSystemMessageToHuman: true,
      });

      return llm;

    case "openai":
      return new ChatOpenAI({
        openAIApiKey: process.env.OPENAI_API_KEY,
        modelName: "gpt-4o",
        temperature: 0.7,
      });
    case "claude":
      return new ChatAnthropic({
        anthropicApiKey: process.env.ANTHROPIC_API_KEY,
        modelName: "claude-3-5-sonnet-latest",
      });
    case "gemini":
      return new ChatGoogleGenerativeAI({
        apiKey: process.env.GEMINI_API_KEY,
        modelName: "gemini-2.0-flash-lite-preview-02-05",
      });
    default:
      throw new Error("Invalid model selected");
  }
};
