import { getLLMClient } from "@/utils/llm-client";
import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import { PromptTemplate } from "@langchain/core/prompts";

export async function POST(request) {
  const { message, model } = await request.json();
  const llm = getLLMClient(model);

  // Create system prompt template
  const systemPromptTemplate = PromptTemplate.fromTemplate(
    "You are a helpful assistant. Your name is Mari and you are {personality}."
  );

  // Create human prompt template
  const humanPromptTemplate = PromptTemplate.fromTemplate(
    `Analyze the following user input and return a structured JSON response with the following fields:
    - mbti: The user's MBTI personality type. Return null if you are unsure or cannot determine a valid MBTI type.
    - horoscope: The user's horoscope based on their birthdate. Return null if birthdate is not provided or invalid.
    - gifts: An array of {num_gifts} gift suggestions for the user.
    - note: A {note_style} note from Mari to the user, related to their personality analysis.

    User Input: {user_input}

    Return only the JSON object. Do not include any additional text or explanations.`
  );

  // Format the prompts with variables
  const systemPrompt = await systemPromptTemplate.format({
    personality: "playful and a little bit tsundere",
  });

  const humanPrompt = await humanPromptTemplate.format({
    num_gifts: 3,
    note_style: "short, playful and slightly tsundere",
    user_input: message,
  });

  // Create message objects
  const messages = [
    new SystemMessage(systemPrompt),
    new HumanMessage(humanPrompt),
  ];

  // Rest of your code remains the same...
  const validMBTI = [
    "ISTJ",
    "ISFJ",
    "INFJ",
    "INTJ",
    "ISTP",
    "ISFP",
    "INFP",
    "INTP",
    "ESTP",
    "ESFP",
    "ENFP",
    "ENTP",
    "ESTJ",
    "ESFJ",
    "ENFJ",
    "ENTJ",
  ];

  try {
    const response = await llm.invoke(messages);
    let responseText = response.content;

    // Your existing response processing code...
    if (responseText.startsWith("```json")) {
      responseText = responseText.substring(8);
    }
    if (responseText.endsWith("```")) {
      responseText = responseText.substring(0, responseText.length - 3);
    }

    let jsonResponse = JSON.parse(responseText);

    if (jsonResponse.mbti) {
      const mbtiUpper = jsonResponse.mbti.toUpperCase();
      if (!validMBTI.includes(mbtiUpper)) {
        console.warn(
          `MBTI "${jsonResponse.mbti}" is not a valid MBTI type. Setting mbti to null.`
        );
        jsonResponse.mbti = null;
      } else {
        jsonResponse.mbti = mbtiUpper;
      }
    }

    return new Response(JSON.stringify(jsonResponse), {
      headers: { "Content-Type": "application/json" },
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
