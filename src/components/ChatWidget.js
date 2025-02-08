"use client";
import { useState, useRef, useEffect } from "react";

export default function ChatWidget() {
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([]);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleInputChange = (e) => {
    setInput(e.target.value);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    const newUserMessage = {
      role: "user",
      content: input,
      createdAt: new Date(),
    };

    const updatedMessages = [...messages, newUserMessage];
    setMessages(updatedMessages);
    setInput("");

    try {
      const response = await fetch("/api/chat-message", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: input,
          model: "gemini-streaming",
          conversationHistory: updatedMessages,
        }),
      });

      if (!response.ok) {
        console.error(
          "API request failed:",
          response.status,
          response.statusText
        );
        return;
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let assistantMessage = {
        role: "assistant",
        content: "",
        createdAt: new Date(),
      };

      setMessages([...updatedMessages, assistantMessage]);

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split("\n");

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const data = JSON.parse(line.slice(6));
            assistantMessage.content += data.content;
            setMessages([...updatedMessages, { ...assistantMessage }]);
          }
        }
      }
    } catch (error) {
      console.error("Error during API call or streaming:", error);
    }
  };

  return (
    <div className="fixed bottom-4 right-4">
      {isChatOpen && (
        <div className="fixed bottom-20 right-4 bg-white dark:bg-gray-800 shadow-lg rounded-lg w-96 h-[32rem] flex flex-col">
          <div className="p-4 border-b dark:border-gray-700 flex justify-between items-center">
            <h2 className="text-lg font-semibold">Chat with Gini</h2>
            <button
              onClick={() => setMessages([])}
              className="px-3 py-1 text-sm bg-red-500 text-white rounded hover:bg-red-600"
            >
              Clear Chat
            </button>
          </div>
          <div className="flex-1 p-4 overflow-y-auto">
            {messages.map((msg, index) => (
              <div
                key={index}
                className={`mb-4 ${
                  msg.role === "user" ? "text-right" : "text-left"
                }`}
              >
                <div
                  className={`inline-block p-2 rounded-lg ${
                    msg.role === "user"
                      ? "bg-blue-500 text-white"
                      : "bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  }`}
                >
                  {msg.content}
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
          <form
            onSubmit={handleSubmit}
            className="p-4 border-t dark:border-gray-700"
          >
            <input
              type="text"
              value={input}
              onChange={handleInputChange}
              placeholder="Type a message..."
              className="w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            />
          </form>
        </div>
      )}
      <button
        onClick={() => setIsChatOpen(!isChatOpen)}
        className="bg-blue-500 text-white p-4 rounded-full shadow-lg hover:bg-blue-600"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-6 w-6"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
          />
        </svg>
      </button>
    </div>
  );
}
