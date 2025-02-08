import { getLLMClient } from "@/utils/llm-client";
import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import { PromptTemplate } from "@langchain/core/prompts";

export async function POST(request) {
  const { message, model } = await request.json();
  const llm = getLLMClient(model);

  // Create system prompt template
  const systemPromptTemplate = PromptTemplate.fromTemplate(
    "You are a helpful MBTI and horoscope assistant. Your name is Gini and you are {personality}."
  );

  // Create human prompt template
  const humanPromptTemplate = PromptTemplate.fromTemplate(
    `Analyze the following user input and return a structured JSON response with the following fields:
    - mbti: The user's MBTI personality type. Return null if you are unsure or cannot determine a valid MBTI type.
    - horoscope: The user's horoscope based on their birthdate. Return null if birthdate is not provided or invalid.
    - gifts: An array of {num_gifts} gift suggestions for the user.
    - note: A {note_style} note from Gini to the user, related to their personality analysis.

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

    console.log("Raw LLM response:", responseText); // Log raw response

    // Clean up the response text
    responseText = responseText.replace(/^```json\s*/, ""); // Remove starting JSON markers
    responseText = responseText.replace(/```$/, ""); // Remove ending JSON markers
    responseText = responseText.trim(); // Remove any extra whitespace

    console.log("Processed response text:", responseText); // Log processed text

    // Validate JSON structure
    if (!responseText.startsWith("{") || !responseText.endsWith("}")) {
      throw new Error("Invalid JSON format in LLM response");
    }

    // Parse the cleaned response
    let jsonResponse = JSON.parse(responseText);
    console.log("Parsed JSON response:", jsonResponse); // Log parsed JSON

    // Validate MBTI
    if (jsonResponse.mbti) {
      const mbtiUpper = jsonResponse.mbti.toUpperCase();
      console.log(`Validating MBTI type: ${mbtiUpper}`);
      if (!validMBTI.includes(mbtiUpper)) {
        console.warn(`Invalid MBTI type detected: ${mbtiUpper}`);
        jsonResponse.mbti = null;
      } else {
        jsonResponse.mbti = mbtiUpper;
      }
    }

    return new Response(JSON.stringify(jsonResponse), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error details:", {
      name: error.name,
      message: error.message,
      stack: error.stack,
      cause: error.cause,
    });
    return new Response(
      JSON.stringify({
        error: "Failed to generate response",
        details: error.message,
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}
