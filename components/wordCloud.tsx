"use client";

import cloud from "d3-cloud";
import { useEffect, useMemo, useRef, useState } from "react";

type WordFrequency = {
  text: string;
  value: number;
};

type PositionedWord = WordFrequency & {
  size?: number;
  x?: number;
  y?: number;
  rotate?: number;
};

type WordCloudProps = {
  texts: string[];
  excludedTerms: string[];
};

const CLOUD_HEIGHT = 320;
const WORD_COLORS = ["#0f172a", "#2563eb", "#059669", "#e11d48", "#d97706"];
const STOP_WORDS = new Set([
  "about", "after", "again", "against", "also", "and", "are", "because", "been", "before",
  "being", "between", "both", "but", "can", "could", "does", "doing", "dont", "each", "for",
  "from", "had", "has", "have", "here", "hers", "him", "his", "how", "into", "its", "just",
  "more", "most", "not", "now", "off", "our", "out", "over", "own", "said", "same", "she",
  "should", "some", "such", "than", "that", "the", "their", "them", "then", "there", "these",
  "they", "this", "those", "through", "too", "under", "very", "was", "were", "what", "when",
  "where", "which", "while", "who", "why", "will", "with", "would", "you", "your", "https",
  "bsky", "app", "com", "amp", "www", "org", "net", "kwa", "na", "ya", "wa", "ni", "katika", "hii", "hiyo", "sana",
]);

function seededRandom(seedText: string) {
  let seed = Array.from(seedText).reduce((value, character) => (
    Math.imul(value ^ character.charCodeAt(0), 16777619)
  ), 2166136261) >>> 0;

  return () => {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    return seed / 4294967296;
  };
}

export function buildWordCloudData(texts: string[], excludedTerms: string[]) {
  const excluded = new Set(Array.from(STOP_WORDS).concat(
    excludedTerms.flatMap((term) => term.toLowerCase().match(/[a-z]{3,}/g) ?? []),
  ));
  const counts = new Map<string, number>();

  texts.forEach((text) => {
    const words = text
      .toLowerCase()
      .replace(/(?:https?:\/\/|www\.)\S+/g, " ")
      .match(/[a-z][a-z']{2,}/g) ?? [];
    words.forEach((word) => {
      const normalized = word.replace(/^'+|'+$/g, "");
      if (normalized.length < 3 || excluded.has(normalized)) return;
      counts.set(normalized, (counts.get(normalized) ?? 0) + 1);
    });
  });

  const ranked = Array.from(counts.entries())
    .map(([text, value]) => ({ text, value }))
    .sort((a, b) => b.value - a.value || a.text.localeCompare(b.text));
  const repeatedWords = ranked.filter((word) => word.value > 1);

  return (repeatedWords.length >= 10 ? repeatedWords : ranked).slice(0, 38);
}

export default function WordCloud({ texts, excludedTerms }: WordCloudProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(640);
  const [positionedWords, setPositionedWords] = useState<PositionedWord[]>([]);
  const words = useMemo(
    () => buildWordCloudData(texts, excludedTerms),
    [excludedTerms, texts],
  );

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const updateWidth = () => setWidth(Math.max(280, Math.floor(container.getBoundingClientRect().width)));
    updateWidth();

    const observer = new ResizeObserver(updateWidth);
    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (words.length === 0) {
      setPositionedWords([]);
      return;
    }

    const minValue = Math.min(...words.map((word) => word.value));
    const maxValue = Math.max(...words.map((word) => word.value));
    const valueRange = Math.sqrt(maxValue) - Math.sqrt(minValue);
    const fontSize = (value: number) => (
      15 + ((Math.sqrt(value) - Math.sqrt(minValue)) / (valueRange || 1)) * 29
    );
    let active = true;

    const layout = cloud<PositionedWord>()
      .size([width, CLOUD_HEIGHT])
      .words(words.map((word) => ({ ...word })))
      .padding(5)
      .rotate((_, index) => (index % 11 === 0 ? -12 : index % 7 === 0 ? 12 : 0))
      .font("Arial")
      .fontWeight(600)
      .fontSize((word) => fontSize(word.value))
      .random(seededRandom(words.map((word) => `${word.text}:${word.value}`).join("|")))
      .on("end", (nextWords) => {
        if (active) setPositionedWords(nextWords);
      });

    layout.start();
    return () => {
      active = false;
      layout.stop();
    };
  }, [width, words]);

  return (
    <div ref={containerRef} className="relative h-80 min-w-0 overflow-hidden">
      {words.length === 0 ? (
        <div className="grid h-full place-items-center text-center text-sm text-slate-500">
          Words will appear when matching public posts are available.
        </div>
      ) : positionedWords.length === 0 ? (
        <div className="grid h-full place-items-center text-sm text-slate-500">Arranging conversation terms...</div>
      ) : (
        <svg
          className="h-full w-full"
          viewBox={`0 0 ${width} ${CLOUD_HEIGHT}`}
          role="img"
          aria-label="Word cloud of frequently used terms in the sampled posts"
          preserveAspectRatio="xMidYMid meet"
        >
          <g transform={`translate(${width / 2}, ${CLOUD_HEIGHT / 2})`}>
            {positionedWords.map((word, index) => (
              <text
                key={word.text}
                transform={`translate(${word.x ?? 0}, ${word.y ?? 0}) rotate(${word.rotate ?? 0})`}
                textAnchor="middle"
                dominantBaseline="central"
                fontFamily="Arial, sans-serif"
                fontSize={word.size}
                fontWeight={600}
                fill={WORD_COLORS[index % WORD_COLORS.length]}
                className="cursor-default transition-opacity hover:opacity-70"
              >
                <title>{`${word.text}: ${word.value} mentions`}</title>
                {word.text}
              </text>
            ))}
          </g>
        </svg>
      )}
    </div>
  );
}
