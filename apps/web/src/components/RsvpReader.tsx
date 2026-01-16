"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";

interface RsvpReaderProps {
  text: string;
  initialWpm?: number;
  onBack?: () => void;
}

export default function RsvpReader({
  text,
  initialWpm = 300,
  onBack,
}: RsvpReaderProps) {
  const [words, setWords] = useState<string[]>([]);
  const [index, setIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [wpm, setWpm] = useState(initialWpm);
  const [showFullText, setShowFullText] = useState(false);

  // Refs for high-performance direct DOM updates
  const leftPartRef = useRef<HTMLSpanElement>(null);
  const centerCharRef = useRef<HTMLSpanElement>(null);
  const rightPartRef = useRef<HTMLSpanElement>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const activeWordRef = useRef<HTMLSpanElement | null>(null);
  const fullTextContainerRef = useRef<HTMLDivElement>(null);

  // Ref for the volatile reading state
  const indexRef = useRef(0);
  const isPlayingRef = useRef(false);
  const wordsRef = useRef<string[]>([]);

  const [paragraphs, setParagraphs] = useState<string[][]>([]);

  useEffect(() => {
    // Replace literal \n with actual newlines, then split into paragraphs
    const cleanedText = text.replace(/\\n/g, "\n");
    const paragraphTexts = cleanedText
      .split(/\n+/)
      .filter((p) => p.trim().length > 0);

    // Tokenize each paragraph separately
    const paragraphWords = paragraphTexts.map((p) =>
      p
        .trim()
        .split(/\s+/)
        .filter((w) => w.length > 0)
    );

    // Flatten for the word array
    const allWords = paragraphWords.flat();

    setWords(allWords);
    setParagraphs(paragraphWords);
    wordsRef.current = allWords;
  }, [text]);

  const getOrpIndex = (word: string) => {
    const len = word.length;
    // ORP positions (1-indexed from research):
    // 1-2 letters: position 1 (index 0)
    // 3-5 letters: position 2 (index 1)
    // 6-9 letters: position 3 (index 2)
    // 10-13 letters: position 4 (index 3)
    // 14+ letters: position 4-5 (index 3-4)

    if (len <= 2) return 0; // Position 1
    if (len <= 5) return 1; // Position 2
    if (len <= 9) return 2; // Position 3
    if (len <= 13) return 3; // Position 4
    return 4; // Position 5 for very long words
  };

  const updateDisplay = useCallback((idx: number) => {
    const word = wordsRef.current[idx];
    if (!word) return;

    const orp = getOrpIndex(word);
    const left = word.slice(0, orp);
    const center = word[orp];
    const right = word.slice(orp + 1);

    if (leftPartRef.current) leftPartRef.current.textContent = left;
    if (centerCharRef.current) centerCharRef.current.textContent = center;
    if (rightPartRef.current) rightPartRef.current.textContent = right;
  }, []);

  // Sync state index to ref
  useEffect(() => {
    indexRef.current = index;
    updateDisplay(index);
  }, [index, updateDisplay]);

  // Sync playing state to ref
  useEffect(() => {
    isPlayingRef.current = isPlaying;
  }, [isPlaying]);

  const togglePlay = useCallback(() => {
    setIsPlaying((prev) => !prev);
  }, []);

  // Throttled state sync for Progress Bar and Full Text highlight
  // This reduces React reconciliation overhead to a manageable frequency (10Hz)
  useEffect(() => {
    if (!isPlaying) return;

    const syncInterval = setInterval(() => {
      if (indexRef.current !== index) {
        setIndex(indexRef.current);
      }
    }, 100); // Sync 10 times per second

    return () => clearInterval(syncInterval);
  }, [isPlaying, index]);

  // High-frequency tick loop
  useEffect(() => {
    let lastTime = performance.now();
    let accumulatedTime = 0;

    const tick = () => {
      if (!isPlayingRef.current) return;

      const now = performance.now();
      const deltaTime = now - lastTime;
      lastTime = now;

      accumulatedTime += deltaTime;
      const msPerWord = 60000 / wpm;

      if (accumulatedTime >= msPerWord) {
        const nextIndex = indexRef.current + 1;
        if (nextIndex >= wordsRef.current.length) {
          setIsPlaying(false);
          setIndex(wordsRef.current.length - 1);
          return;
        }

        indexRef.current = nextIndex;
        updateDisplay(nextIndex);
        accumulatedTime -= msPerWord;
      }

      timerRef.current = setTimeout(
        tick,
        Math.max(0, msPerWord - accumulatedTime)
      );
    };

    if (isPlaying) {
      lastTime = performance.now();
      timerRef.current = setTimeout(tick, 0);
    }

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [isPlaying, wpm, updateDisplay]);

  // Scroll logic for Full Text
  useEffect(() => {
    if (showFullText && activeWordRef.current && fullTextContainerRef.current) {
      const container = fullTextContainerRef.current;
      const activeWord = activeWordRef.current;

      const containerRect = container.getBoundingClientRect();
      const activeRect = activeWord.getBoundingClientRect();

      const relativeTop =
        activeRect.top - containerRect.top + container.scrollTop;
      const targetScroll =
        relativeTop - container.clientHeight / 2 + activeRect.height / 2;

      container.scrollTo({
        top: targetScroll,
        behavior: "smooth",
      });
    }
  }, [index, showFullText]);

  const handleProgressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newIndex = parseInt(e.target.value, 10);
    setIndex(newIndex);
  };

  return (
    <div className="flex flex-col items-center w-full max-w-6xl mx-auto p-4 pt-24 space-y-12">
      {/* Article Info & Reader Display */}
      <div className="w-full max-w-4xl space-y-8 flex flex-col items-center">
        {/* Reader Display - Direct DOM Binding */}
        <div className="relative w-full h-44 flex items-center justify-center bg-gray-50 dark:bg-zinc-900/40 rounded-3xl shadow-2xl border border-gray-200 dark:border-zinc-800/50 overflow-hidden backdrop-blur-sm">
          {/* Guides */}
          <div className="absolute top-0 bottom-0 left-1/2 w-0.5 bg-gray-200 dark:bg-zinc-800/80 transform -translate-x-1/2"></div>
          <div className="absolute top-4 bottom-4 left-1/2 w-px bg-red-500/10 transform -translate-x-1/2 z-0"></div>

          {/* Word */}
          <div className="flex items-baseline text-4xl md:text-7xl font-mono relative z-10 leading-none tracking-tight select-none">
            <span
              ref={leftPartRef}
              className="text-gray-800 dark:text-gray-200 text-right w-[600px] pr-1"
            ></span>
            <span
              ref={centerCharRef}
              className="text-red-600 dark:text-red-500 font-black"
            ></span>
            <span
              ref={rightPartRef}
              className="text-gray-800 dark:text-gray-200 text-left w-[600px] pl-1"
            ></span>
          </div>
        </div>

        {/* Controls */}
        <div className="w-full max-w-2xl space-y-8">
          {/* Progress Bar */}
          <div className="space-y-3">
            <input
              type="range"
              min="0"
              max={words.length - 1}
              value={index}
              onChange={handleProgressChange}
              className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-zinc-800 accent-blue-600 hover:accent-blue-500 transition-all"
            />
            <div className="flex justify-between text-[10px] uppercase tracking-[0.2em] font-black text-gray-400 dark:text-zinc-600">
              <span>
                {Math.min(index + 1, words.length)} / {words.length}
              </span>
              <span>{Math.round(((index + 1) / words.length) * 100)}%</span>
            </div>
          </div>

          {/* Buttons */}
          <div className="flex items-center justify-center space-x-12">
            <button
              onClick={() => setIndex(Math.max(0, index - 10))}
              className="p-4 text-gray-400 hover:text-blue-600 dark:text-zinc-600 dark:hover:text-blue-400 transition-all hover:scale-110 active:scale-90"
              title="Back 10 words"
            >
              <svg
                className="w-8 h-8"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M11 19l-7-7 7-7m8 14l-7-7 7-7"
                />
              </svg>
            </button>

            <button
              onClick={togglePlay}
              className="w-24 h-24 flex items-center justify-center rounded-full bg-blue-600 hover:bg-blue-500 text-white shadow-[0_0_30px_rgba(37,99,235,0.3)] dark:shadow-[0_0_40px_rgba(37,99,235,0.15)] transition-all hover:scale-110 active:scale-95 group"
            >
              {isPlaying ? (
                <svg
                  className="w-10 h-10 transition-transform group-hover:scale-90"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
                </svg>
              ) : (
                <svg
                  className="w-10 h-10 ml-1 transition-transform group-hover:scale-90"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M8 5v14l11-7z" />
                </svg>
              )}
            </button>

            <button
              onClick={() => setIndex(Math.min(words.length - 1, index + 10))}
              className="p-4 text-gray-400 hover:text-blue-600 dark:text-zinc-600 dark:hover:text-blue-400 transition-all hover:scale-110 active:scale-90"
              title="Forward 10 words"
            >
              <svg
                className="w-8 h-8"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M13 5l7 7-7 7M5 5l7 7-7 7"
                />
              </svg>
            </button>
          </div>

          {/* WPM Control */}
          <div className="flex flex-col items-center space-y-4 pt-4">
            <label className="text-[11px] uppercase tracking-[0.3em] font-bold text-gray-500 dark:text-zinc-500">
              Reading Speed:{" "}
              <span className="text-blue-600 dark:text-blue-400 tabular-nums">
                {wpm}
              </span>{" "}
              WPM
            </label>
            <input
              type="range"
              min="100"
              max="1000"
              step="50"
              value={wpm}
              onChange={(e) => setWpm(parseInt(e.target.value))}
              className="w-56 h-1 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-zinc-800 accent-blue-600"
            />
          </div>

          {/* Full Text Toggle */}
          <div className="flex justify-center pt-6">
            <button
              onClick={() => setShowFullText(!showFullText)}
              className={`px-8 py-3 text-[11px] font-black uppercase tracking-[0.25em] transition-all rounded-full border shadow-xl ${
                showFullText
                  ? "bg-zinc-100 text-zinc-900 border-zinc-200"
                  : "bg-zinc-900 text-zinc-400 border-zinc-800 hover:text-white hover:bg-zinc-800"
              }`}
            >
              {showFullText ? "Hide Full Text" : "Show Full Text"}
            </button>
          </div>
        </div>
      </div>

      {/* Full Text View - Maximum Width */}
      {showFullText && (
        <div className="relative w-full max-w-6xl px-4 animate-in fade-in slide-in-from-top-4 duration-700">
          <style jsx>{`
            .custom-scrollbar::-webkit-scrollbar {
              width: 10px;
            }
            .custom-scrollbar::-webkit-scrollbar-track {
              background: transparent;
            }
            .custom-scrollbar::-webkit-scrollbar-thumb {
              background: #27272a;
              border-radius: 10px;
              border: 3px solid transparent;
              background-clip: content-box;
            }
            .custom-scrollbar::-webkit-scrollbar-thumb:hover {
              background: #3f3f46;
              background-clip: content-box;
            }
          `}</style>

          {/* Difuminated edges overlays */}
          <div className="absolute top-0 left-0 right-0 h-24 bg-gradient-to-b from-white dark:from-[#09090b] to-transparent z-10 pointer-events-none rounded-t-[3rem] mx-4"></div>
          <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-white dark:from-[#09090b] to-transparent z-10 pointer-events-none rounded-b-[3rem] mx-4"></div>

          <div
            ref={fullTextContainerRef}
            className="custom-scrollbar w-full h-[600px] overflow-y-auto p-16 bg-[#fafafa] dark:bg-zinc-950/50 rounded-[3rem] border border-zinc-200 dark:border-zinc-800/30 text-2xl leading-[1.8] text-zinc-400 selection:bg-blue-500/20 backdrop-blur-xl"
          >
            {paragraphs.map((paragraph, pIdx) => {
              // Calculate the starting index for this paragraph
              const startIdx = paragraphs
                .slice(0, pIdx)
                .reduce((sum, p) => sum + p.length, 0);

              return (
                <p key={pIdx} className="mb-6 last:mb-0">
                  {paragraph.map((word, wIdx) => {
                    const globalIdx = startIdx + wIdx;
                    return (
                      <WordSpan
                        key={globalIdx}
                        word={word}
                        isCurrent={globalIdx === index}
                        isPast={globalIdx < index}
                        activeRef={globalIdx === index ? activeWordRef : null}
                        onClick={() => {
                          setIndex(globalIdx);
                          setIsPlaying(false);
                        }}
                      />
                    );
                  })}
                </p>
              );
            })}
          </div>
        </div>
      )}

      {onBack && (
        <button
          onClick={onBack}
          className="text-[10px] font-black text-zinc-400 hover:text-blue-600 transition-all uppercase tracking-[0.4em] py-12"
        >
          &mdash; Read another article &mdash;
        </button>
      )}
    </div>
  );
}

// Memoized WordSpan to prevent unnecessary re-renders of the whole text block
const WordSpan = React.memo(
  ({
    word,
    isCurrent,
    isPast,
    activeRef,
    onClick,
  }: {
    word: string;
    isCurrent: boolean;
    isPast: boolean;
    activeRef: React.RefObject<HTMLSpanElement | null> | null;
    onClick: () => void;
  }) => {
    return (
      <span
        ref={activeRef}
        className={`inline-block mr-3 mb-2 px-2 py-0.5 rounded-xl transition-all duration-300 cursor-pointer ${
          isCurrent
            ? "text-blue-600 dark:text-blue-400 bg-blue-600/10 shadow-[0_0_30px_rgba(37,99,235,0.15)] font-black scale-110 transform z-20"
            : isPast
            ? "text-zinc-300 dark:text-zinc-800"
            : "text-zinc-500 dark:text-zinc-600 hover:text-zinc-800 dark:hover:text-zinc-300"
        }`}
        onClick={onClick}
      >
        {word}
      </span>
    );
  }
);

WordSpan.displayName = "WordSpan";
