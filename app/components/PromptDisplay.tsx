"use client";

import { useState } from "react";
import { SunoPrompt } from "../types/suno";

interface PromptDisplayProps {
  prompt: SunoPrompt;
  onReset?: () => void;
}

export default function PromptDisplay({ prompt, onReset }: PromptDisplayProps) {
  const hasContent = Object.keys(prompt).length > 0;
  const [copied, setCopied] = useState(false);

  return (
    <div className="h-full flex flex-col bg-gray-50 dark:bg-[#171717] border-l border-gray-200 dark:border-gray-800">
      {/* Header */}
      <div className="border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-[#0a0a0a] px-6 py-4">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
          Suno Prompt
        </h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Building your song prompt...
        </p>
      </div>

      {/* JSON Display */}
      <div className="flex-1 overflow-y-auto p-6">
        {hasContent ? (
          <div className="bg-white dark:bg-[#0a0a0a] rounded-lg border border-gray-200 dark:border-gray-800 p-4">
            <pre className="text-xs text-gray-800 dark:text-gray-200 font-mono whitespace-pre-wrap break-words overflow-x-auto">
              {JSON.stringify(prompt, null, 2)}
            </pre>
          </div>
        ) : (
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
              <h3 className="mb-2 text-lg font-semibold text-gray-900 dark:text-gray-100">
                Start Building Your Song
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 max-w-xs">
                Your Suno prompt will appear here as you chat with the AI
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      {hasContent && (
        <div className="border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-[#0a0a0a] px-6 py-4 space-y-2">
          <button
            onClick={() => {
              navigator.clipboard.writeText(JSON.stringify(prompt, null, 2));
              setCopied(true);
              setTimeout(() => setCopied(false), 2000);
            }}
            className="w-full rounded-lg bg-purple-600 dark:bg-purple-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-purple-700 dark:hover:bg-purple-600"
          >
            {copied ? "✓ Copied!" : "Copy JSON"}
          </button>
          {onReset && (
            <button
              onClick={onReset}
              className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-[#171717] px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 transition-colors hover:bg-gray-50 dark:hover:bg-[#0a0a0a]"
            >
              Reset Prompt
            </button>
          )}
        </div>
      )}
    </div>
  );
}

