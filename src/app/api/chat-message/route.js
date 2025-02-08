import { getLLMClient } from "@/utils/llm-client";
import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import { PromptTemplate } from "@langchain/core/prompts";

export async function POST(request) {
  const { message, model, conversationHistory } = await request.json();
  const runnable = getLLMClient("gemini-stream");

  const systemPromptTemplate = PromptTemplate.fromTemplate(
    "You are a helpful MBTI and horoscope assistant. Don't do or say things outside the context of mbti and horoscope. Keep the reponses small. Your name is Gini and you are {personality}."
  );

  const humanPromptTemplate = PromptTemplate.fromTemplate(
    `Continue the conversation with the user based on the following context:

    Conversation History:
    {conversation_history}

    User Input: {user_input}

    Respond in a natural and conversational tone. Keep your response concise and relevant to the user's input.`
  );

  const systemPrompt = await systemPromptTemplate.format({
    personality:
      "playful and a little bit tsunder. Also always suggesting questions about mbti & horoscope if user doesn't say anything.",
  });

  const humanPrompt = await humanPromptTemplate.format({
    conversation_history: conversationHistory
      .map((msg) => `${msg.role}: ${msg.content}`)
      .join("\n"),
    user_input: message,
  });

  const messages = [
    new SystemMessage(systemPrompt),
    new HumanMessage(humanPrompt),
  ];

  const encoder = new TextEncoder();
  const stream = new TransformStream();
  const writer = stream.writable.getWriter();

  try {
    const messageStream = await runnable.stream(messages);
    (async () => {
      for await (const chunk of messageStream) {
        // Extract the actual content from the chunk
        const content = chunk.content || chunk.text || "";
        await writer.write(
          encoder.encode(`data: ${JSON.stringify({ content })}\n\n`)
        );
      }
      await writer.close();
    })();
    return new Response(stream.readable, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (error) {
    console.error("Error generating response:", error);
    return new Response(
      JSON.stringify({ error: "Failed to generate response" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}
