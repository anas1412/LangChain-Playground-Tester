"use client";
import { useState } from "react";
import ChatWidget from "@/components/ChatWidget";

export default function Home() {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([]);
  const [structuredData, setStructuredData] = useState(null);
  const [isLoading, setIsLoading] = useState(false); // Add loading state

  const handleInputChange = (e) => {
    setInput(e.target.value);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!input.trim()) return;

    setIsLoading(true); // Set loading state to true

    const newUserMessage = {
      role: "user",
      content: input,
      createdAt: new Date(),
    };

    const updatedMessages = [...messages, newUserMessage];
    setMessages(updatedMessages);
    setInput("");
    setStructuredData(null);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: input,
          model: "gemini",
        }),
      });

      if (!response.ok) {
        console.error(
          "API request failed:",
          response.status,
          response.statusText
        );
        throw new Error("API request failed");
      }

      const responseData = await response.json();

      // Create assistant message with the note or a default message
      const assistantMessage = {
        role: "assistant",
        content: responseData.note || "No response from the assistant.",
        createdAt: new Date(),
      };

      const finalMessages = [...updatedMessages, assistantMessage];
      setMessages(finalMessages);

      setStructuredData(responseData);
    } catch (error) {
      console.error("Error during API call or JSON parsing:", error);

      // Add an error message to the chat
      const errorMessage = {
        role: "assistant",
        content: "Sorry, something went wrong. Please try again.",
        createdAt: new Date(),
      };

      const finalMessages = [...updatedMessages, errorMessage];
      setMessages(finalMessages);
    } finally {
      setIsLoading(false); // Reset loading state
    }
  };

  return (
    <div className="container mx-auto p-4 bg-background text-foreground min-h-screen flex flex-col items-center">
      <h1 className="text-3xl font-bold mb-8 text-center">
        Personality Insights ✨
      </h1>
      <form onSubmit={handleSubmit} className="mb-8 w-full max-w-md">
        <textarea
          value={input}
          onChange={handleInputChange}
          placeholder="Tell me about yourself..."
          rows={4}
          className="w-full p-3 border rounded-md bg-gray-100 text-foreground dark:bg-gray-800 dark:border-gray-700 dark:text-white focus:ring-blue-500 focus:border-blue-500"
          disabled={isLoading} // Disable input while loading
        />
        <button
          type="submit"
          className="mt-4 p-3 bg-blue-500 text-white rounded-md hover:bg-blue-600 w-full"
          disabled={isLoading} // Disable button while loading
        >
          {isLoading ? "Processing..." : "Get Insights! ✨"}
        </button>
      </form>

      {structuredData && (
        <div className="mt-12 p-6 rounded-lg shadow-xl bg-gray-100 dark:bg-gray-800 dark:shadow-gray-700 w-full max-w-md">
          <h2 className="text-2xl font-bold mb-6 text-center">
            Your Personalized Insights ✨
          </h2>

          {structuredData.mbti && (
            <div className="mb-4">
              <p className="font-semibold text-lg">MBTI Personality Type:</p>
              <p className="text-gray-700 dark:text-gray-300">
                {structuredData.mbti}
              </p>
            </div>
          )}

          {structuredData.horoscope && (
            <div className="mb-4">
              <p className="font-semibold text-lg">Horoscope (Zodiac Sign):</p>
              <p className="text-gray-700 dark:text-gray-300">
                {structuredData.horoscope}
              </p>
            </div>
          )}

          {structuredData.gifts && structuredData.gifts.length > 0 && (
            <div className="mb-4">
              <p className="font-semibold text-lg mb-2">Gift Suggestions:</p>
              <ul className="list-disc list-inside text-gray-700 dark:text-gray-300">
                {structuredData.gifts.map((gift, index) => (
                  <li key={index} className="mb-1">
                    {gift}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {structuredData.note && (
            <div>
              <p className="font-semibold text-lg">Gini's Note:</p>
              <p className="text-gray-700 dark:text-gray-300 italic">
                {structuredData.note}
              </p>
            </div>
          )}
        </div>
      )}

      <ChatWidget />
    </div>
  );
}
