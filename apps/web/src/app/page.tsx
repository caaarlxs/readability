"use client";

import RsvpReader from "@/components/RsvpReader";
import UrlInput from "@/components/UrlInput";
import { useState } from "react";

interface ExtractionResult {
  url: string;
  title?: string;
  text?: string;
  error?: string;
}

export default function Home() {
  const [step, setStep] = useState<"input" | "reading">("input");
  const [data, setData] = useState<ExtractionResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleExtract = async (url: string) => {
    setLoading(true);
    setError(null);
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      const res = await fetch(`${apiUrl}/extract`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });

      if (!res.ok) {
        throw new Error(`Extraction failed: ${res.statusText}`);
      }

      const result = await res.json();
      if (result.error) {
        throw new Error(result.error);
      }

      if (!result.text || result.text.length < 50) {
        throw new Error("Not enough text found to read.");
      }

      setData(result);
      setStep("reading");
    } catch (err: any) {
      setError(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const handleTextSubmit = (text: string) => {
    // Direct text input - no API call needed
    setData({
      url: "",
      title: "Custom Text",
      text: text,
    });
    setStep("reading");
  };

  return (
    <div className="w-full max-w-4xl mx-auto">
      {step === "input" && (
        <UrlInput
          onSubmit={handleExtract}
          onTextSubmit={handleTextSubmit}
          isLoading={loading}
          error={error}
        />
      )}

      {step === "reading" && data && data.text && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          {data.url && (
            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-2">
                {data.title || "Untitled Article"}
              </h2>
              <div className="text-sm text-gray-500 truncate max-w-md mx-auto">
                {data.url}
              </div>
            </div>
          )}

          <RsvpReader text={data.text} onBack={() => setStep("input")} />
        </div>
      )}
    </div>
  );
}
