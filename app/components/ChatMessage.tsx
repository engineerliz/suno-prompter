"use client";

import { useEffect, useRef } from "react";

interface ChatMessageProps {
  role: "user" | "assistant";
  content: string;
}

export default function ChatMessage({ role, content }: ChatMessageProps) {
  const messageRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Auto-scroll to bottom when new message is added
    messageRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [content]);

  const isUser = role === "user";

  return (
    <div
      ref={messageRef}
      className={`flex w-full gap-4 px-4 py-6 ${
        isUser ? "bg-white dark:bg-[#0a0a0a]" : "bg-gray-50 dark:bg-[#171717]"
      }`}
    >
      <div className="flex w-full max-w-3xl mx-auto gap-4">
        {/* Avatar */}
        <div className="flex-shrink-0">
          {isUser ? (
            <div className="w-8 h-8 rounded-full bg-gray-300 dark:bg-gray-700 flex items-center justify-center text-sm font-medium">
              U
            </div>
          ) : (
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
                  d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                />
              </svg>
            </div>
          )}
        </div>

        {/* Message Content */}
        <div className="flex-1 pt-1">
          <div className="prose prose-sm dark:prose-invert max-w-none">
            <div className="whitespace-pre-wrap break-words text-gray-900 dark:text-gray-100">
              {content}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

