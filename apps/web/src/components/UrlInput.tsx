"use client";

import React, { useState } from "react";

interface UrlInputProps {
  onSubmit: (url: string) => void;
  onTextSubmit?: (text: string) => void;
  isLoading: boolean;
  error?: string | null;
}

export default function UrlInput({
  onSubmit,
  onTextSubmit,
  isLoading,
  error,
}: UrlInputProps) {
  const [url, setUrl] = useState("");
  const [text, setText] = useState("");
  const [mode, setMode] = useState<"url" | "text">("url");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (mode === "url" && url.trim()) {
      onSubmit(url.trim());
    } else if (mode === "text" && text.trim() && onTextSubmit) {
      onTextSubmit(text.trim());
    }
  };

  return (
    <div className="flex flex-col items-center w-full max-w-lg mx-auto space-y-8">
      {/* Header with more breathing room */}
      <div className="text-center space-y-4">
        <h1 className="text-5xl font-extrabold tracking-tight text-gray-900 dark:text-white">
          RSVP Reader
        </h1>
        <p className="text-xl text-gray-600 dark:text-gray-400">
          Read anything, one word at a time ⚡
        </p>
      </div>

      {/* Form with improved spacing */}
      <form onSubmit={handleSubmit} className="w-full space-y-5">
        <div className="space-y-2">
          {mode === "url" ? (
            <>
              <input
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="Paste a link to an article..."
                required
                className="w-full px-5 py-4 text-lg border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-zinc-800 dark:border-zinc-700 dark:text-white transition-all placeholder:text-gray-400 dark:placeholder:text-zinc-500"
              />
              <p className="text-xs text-gray-500 dark:text-zinc-600 text-center">
                Works best with articles and long posts
              </p>
            </>
          ) : (
            <>
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Paste your text here..."
                required
                rows={8}
                className="w-full px-5 py-4 text-lg border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-zinc-800 dark:border-zinc-700 dark:text-white transition-all placeholder:text-gray-400 dark:placeholder:text-zinc-500 resize-none"
              />
              <p className="text-xs text-gray-500 dark:text-zinc-600 text-center">
                Paste any text you want to read
              </p>
            </>
          )}
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className={`w-full px-6 py-4 text-lg font-semibold text-white rounded-xl transition-all duration-200 ${
            isLoading
              ? "bg-blue-400 cursor-not-allowed"
              : "bg-blue-600 hover:bg-blue-700 hover:-translate-y-0.5 hover:shadow-lg active:translate-y-0"
          }`}
        >
          {isLoading ? "Processing..." : "Start reading →"}
        </button>

        {/* Mode toggle button */}
        <div className="flex justify-center pt-2">
          <button
            type="button"
            onClick={() => setMode(mode === "url" ? "text" : "url")}
            className="text-sm text-gray-500 hover:text-gray-700 dark:text-zinc-600 dark:hover:text-zinc-400 transition-colors underline-offset-4 hover:underline"
          >
            {mode === "url"
              ? "Or paste your own text..."
              : "Or use a URL instead"}
          </button>
        </div>

        {error && (
          <div className="p-4 text-sm text-red-600 bg-red-50 rounded-xl dark:bg-red-900/20 dark:text-red-400">
            {error}
          </div>
        )}
      </form>
    </div>
  );
}
