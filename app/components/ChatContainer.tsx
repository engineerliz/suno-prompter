"use client";

import { useState, useRef, useEffect } from "react";
import ChatMessage from "./ChatMessage";
import ChatInput from "./ChatInput";
import PromptDisplay from "./PromptDisplay";
import { SunoPrompt } from "../types/suno";

interface Message {
  role: "user" | "assistant";
  content: string;
}

export default function ChatContainer() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [prompt, setPrompt] = useState<SunoPrompt>({});
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async (content: string) => {
    const userMessage: Message = { role: "user", content };
    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messages: [...messages, userMessage],
          currentPrompt: prompt,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Failed to get response (${response.status})`);
      }

      const data = await response.json();
      const assistantMessage: Message = {
        role: "assistant",
        content: data.content,
      };
      setMessages((prev) => [...prev, assistantMessage]);
      
      // Update prompt if provided - deep merge to handle nested objects and arrays
      if (data.prompt) {
        setPrompt((prev) => {
          const merged: SunoPrompt = { ...prev };
          
          // Merge top-level fields
          if (data.prompt.title !== undefined) merged.title = data.prompt.title;
          if (data.prompt.lyrics !== undefined) merged.lyrics = data.prompt.lyrics;
          
          // Merge style object
          if (data.prompt.style) {
            merged.style = {
              ...prev.style,
              ...data.prompt.style,
              // Merge arrays by replacing them (AI should provide complete arrays)
              genre: data.prompt.style.genre ?? prev.style?.genre,
              mood: data.prompt.style.mood ?? prev.style?.mood,
              instruments: data.prompt.style.instruments ?? prev.style?.instruments,
            };
          }
          
          // Merge structure object
          if (data.prompt.structure) {
            merged.structure = {
              ...prev.structure,
              sections: data.prompt.structure.sections ?? prev.structure?.sections,
            };
          }
          
          // Merge references object
          if (data.prompt.references) {
            merged.references = {
              ...prev.references,
              ...data.prompt.references,
              similar_to: data.prompt.references.similar_to ?? prev.references?.similar_to,
            };
          }
          
          // Merge production object
          if (data.prompt.production) {
            merged.production = {
              ...prev.production,
              ...data.prompt.production,
            };
          }
          
          return merged;
        });
      }
    } catch (error) {
      console.error("Error sending message:", error);
      const errorMessage: Message = {
        role: "assistant",
        content: error instanceof Error 
          ? `Error: ${error.message}` 
          : "Sorry, I encountered an error. Please try again.",
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex h-screen bg-white dark:bg-[#0a0a0a]">
      {/* Left Side - Chat */}
      <div className="flex flex-col flex-1 min-w-0">
        {/* Header */}
        <div className="border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-[#0a0a0a] px-4 py-3">
          <div className="mx-auto max-w-3xl">
            <h1 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              Suno Prompt Builder
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Build your song prompt through conversation
            </p>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto">
          {messages.length === 0 ? (
            <div className="flex h-full items-center justify-center">
              <div className="text-center">
                <div className="mb-4 inline-block rounded-full bg-purple-100 dark:bg-purple-900/30 p-4">
                  <svg
                    className="w-8 h-8 text-purple-600 dark:text-purple-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3"
                    />
                  </svg>
                </div>
                <h2 className="mb-2 text-xl font-semibold text-gray-900 dark:text-gray-100">
                  Let's Build Your Song
                </h2>
                <p className="text-gray-500 dark:text-gray-400">
                  Tell me about the song you want to create. I'll help you build a complete Suno prompt.
                </p>
              </div>
            </div>
          ) : (
            <>
              {messages.map((message, index) => (
                <ChatMessage
                  key={index}
                  role={message.role}
                  content={message.content}
                />
              ))}
              {isLoading && (
                <div className="flex w-full gap-4 px-4 py-6 bg-gray-50 dark:bg-[#171717]">
                  <div className="flex w-full max-w-3xl mx-auto gap-4">
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 rounded-full bg-purple-600 dark:bg-purple-500 flex items-center justify-center">
                        <svg
                          className="w-5 h-5 text-white"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3"
                          />
                        </svg>
                      </div>
                    </div>
                    <div className="flex-1 pt-1">
                      <div className="flex gap-1">
                        <div className="h-2 w-2 animate-bounce rounded-full bg-gray-400 dark:bg-gray-500 [animation-delay:-0.3s]"></div>
                        <div className="h-2 w-2 animate-bounce rounded-full bg-gray-400 dark:bg-gray-500 [animation-delay:-0.15s]"></div>
                        <div className="h-2 w-2 animate-bounce rounded-full bg-gray-400 dark:bg-gray-500"></div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </>
          )}
        </div>

        {/* Input */}
        <ChatInput onSendMessage={handleSendMessage} disabled={isLoading} />
      </div>

      {/* Right Side - Prompt Display */}
      <div className="w-96 flex-shrink-0">
        <PromptDisplay 
          prompt={prompt} 
          onReset={() => setPrompt({})}
        />
      </div>
    </div>
  );
}

