"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Activity,
  ArrowUpRight,
  Download,
  ExternalLink,
  Heart,
  Loader2,
  MessageCircle,
  Plus,
  Radio,
  RefreshCw,
  Repeat2,
  Search,
  X,
} from "lucide-react";
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import WordCloud from "@/components/wordCloud";

type Sentiment = "positive" | "negative" | "neutral";

type SocialPost = {
  id: string;
  text: string;
  createdAt: string;
  author: string;
  handle: string;
  avatar: string | null;
  url: string;
  likes: number;
  reposts: number;
  replies: number;
  quotes: number;
  sentiment: Sentiment;
  sentimentScore: number;
};

type TopicStats = {
  query: string;
  dataSource: "bluesky";
  fetchedAt: string;
  totalPosts: number;
  positivePosts: number;
  negativePosts: number;
  neutralPosts: number;
  likes: number;
  reposts: number;
  replies: number;
  quotes: number;
  totalEngagement: number;
  dailyAverageSentiments: Array<{
    date: string;
    averageSentiment: number;
    mentions: number;
  }>;
  recentPosts: SocialPost[];
};

const TOPIC_COLORS = ["#2563eb", "#059669", "#e11d48"];
const PERIODS = [
  { label: "24h", days: 1 },
  { label: "7d", days: 7 },
  { label: "30d", days: 30 },
];

const RETRYABLE_STATUSES = new Set([408, 425, 429, 500, 502, 503, 504]);

class TopicRequestError extends Error {
  retryable: boolean;

  constructor(message: string, retryable = false) {
    super(message);
    this.name = "TopicRequestError";
    this.retryable = retryable;
  }
}

function isTopicStats(value: unknown): value is TopicStats {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Partial<TopicStats>;
  return typeof candidate.query === "string"
    && typeof candidate.totalPosts === "number"
    && typeof candidate.fetchedAt === "string"
    && Array.isArray(candidate.dailyAverageSentiments)
    && Array.isArray(candidate.recentPosts);
}

function responseError(payload: unknown, fallback: string) {
  if (payload && typeof payload === "object" && "error" in payload) {
    const message = (payload as { error?: unknown }).error;
    if (typeof message === "string" && message.trim()) return message;
  }
  return fallback;
}

async function waitBeforeRetry(signal: AbortSignal) {
  await new Promise((resolve) => window.setTimeout(resolve, 650));
  if (signal.aborted) throw new DOMException("The request was cancelled.", "AbortError");
}

async function fetchTopicStats(params: URLSearchParams, signal: AbortSignal) {
  for (let attempt = 0; attempt < 2; attempt += 1) {
    try {
      const response = await fetch(`/api/entityStats?${params}`, {
        cache: "no-store",
        signal,
      });
      const contentType = response.headers.get("content-type")?.toLowerCase() ?? "";
      const body = await response.text();

      if (!contentType.includes("application/json")) {
        throw new TopicRequestError("The data service returned a temporary page. Use Refresh to try again.", true);
      }

      let payload: unknown;
      try {
        payload = JSON.parse(body);
      } catch {
        throw new TopicRequestError("The data service returned an invalid response. Use Refresh to try again.", true);
      }

      if (!response.ok) {
        throw new TopicRequestError(
          responseError(payload, "Live social data is temporarily unavailable."),
          RETRYABLE_STATUSES.has(response.status),
        );
      }

      if (!isTopicStats(payload)) {
        throw new TopicRequestError("The data service returned incomplete results. Use Refresh to try again.", true);
      }

      return payload;
    } catch (requestError) {
      if (requestError instanceof DOMException && requestError.name === "AbortError") throw requestError;

      const normalizedError = requestError instanceof TopicRequestError
        ? requestError
        : new TopicRequestError("The live data request was interrupted. Use Refresh to try again.", true);
      if (attempt === 0 && normalizedError.retryable) {
        await waitBeforeRetry(signal);
        continue;
      }
      throw normalizedError;
    }
  }

  throw new TopicRequestError("Live social data is temporarily unavailable.");
}

function formatNumber(value: number) {
  return new Intl.NumberFormat("en-KE", { notation: "compact", maximumFractionDigits: 1 }).format(value);
}

function escapeCsv(value: string | number) {
  const text = String(value).replace(/"/g, '""');
  return `"${text}"`;
}

function sentimentClasses(sentiment: Sentiment) {
  if (sentiment === "positive") return "bg-emerald-50 text-emerald-700 ring-emerald-600/20";
  if (sentiment === "negative") return "bg-rose-50 text-rose-700 ring-rose-600/20";
  return "bg-slate-100 text-slate-600 ring-slate-500/20";
}

export default function SocialWatchDashboard() {
  const [topics, setTopics] = useState(["Ruto", "Raila"]);
  const [newTopic, setNewTopic] = useState("");
  const [periodDays, setPeriodDays] = useState(7);
  const [stats, setStats] = useState<Record<string, TopicStats>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    const savedTopics = window.localStorage.getItem("socialwatch-topics");
    if (!savedTopics) return;

    try {
      const parsed = JSON.parse(savedTopics) as unknown;
      if (Array.isArray(parsed) && parsed.every((topic) => typeof topic === "string")) {
        setTopics(parsed.slice(0, 3));
      }
    } catch {
      window.localStorage.removeItem("socialwatch-topics");
    }
  }, []);

  useEffect(() => {
    window.localStorage.setItem("socialwatch-topics", JSON.stringify(topics));
  }, [topics]);

  useEffect(() => {
    const controller = new AbortController();

    async function loadTopics() {
      if (topics.length === 0) {
        setStats({});
        setLoading(false);
        return;
      }

      setLoading(true);
      setError("");
      const endDate = new Date();
      const startDate = new Date(endDate.getTime() - periodDays * 24 * 60 * 60 * 1000);

      const results = await Promise.allSettled(
        topics.map(async (topic) => {
          const params = new URLSearchParams({
            entityName: topic,
            startDate: startDate.toISOString(),
            endDate: endDate.toISOString(),
          });
          return fetchTopicStats(params, controller.signal);
        }),
      );

      if (controller.signal.aborted) return;

      const nextStats: Record<string, TopicStats> = {};
      const failures: Array<{ topic: string; message: string }> = [];
      results.forEach((result, index) => {
        if (result.status === "fulfilled") {
          nextStats[result.value.query] = result.value;
        } else {
          failures.push({
            topic: topics[index],
            message: result.reason instanceof Error ? result.reason.message : "Unavailable",
          });
        }
      });

      setStats(nextStats);
      const uniqueFailureMessages = Array.from(new Set(failures.map((failure) => failure.message)));
      setError(
        failures.length > 1 && uniqueFailureMessages.length === 1
          ? `All tracked topics: ${uniqueFailureMessages[0]}`
          : failures.map((failure) => `${failure.topic}: ${failure.message}`).join("  "),
      );
      setLoading(false);
    }

    loadTopics().catch((loadError: unknown) => {
      if (controller.signal.aborted) return;
      setError(loadError instanceof Error ? loadError.message : "Unable to load live data.");
      setLoading(false);
    });

    return () => controller.abort();
  }, [periodDays, refreshKey, topics]);

  const topicStats = useMemo(
    () => topics.map((topic) => stats[topic]).filter((item): item is TopicStats => Boolean(item)),
    [stats, topics],
  );

  const totals = useMemo(() => {
    return topicStats.reduce(
      (summary, topic) => ({
        posts: summary.posts + topic.totalPosts,
        positive: summary.positive + topic.positivePosts,
        engagement: summary.engagement + topic.totalEngagement,
      }),
      { posts: 0, positive: 0, engagement: 0 },
    );
  }, [topicStats]);

  const chartData = useMemo(() => {
    const rows = new Map<string, Record<string, string | number>>();
    topicStats.forEach((topic) => {
      topic.dailyAverageSentiments.forEach((point) => {
        const row = rows.get(point.date) ?? { date: point.date };
        row[topic.query] = Number(point.averageSentiment.toFixed(2));
        rows.set(point.date, row);
      });
    });
    return Array.from(rows.values()).sort((a, b) => String(a.date).localeCompare(String(b.date)));
  }, [topicStats]);

  const recentPosts = useMemo(
    () => topicStats
      .flatMap((topic) => topic.recentPosts.map((post) => ({ ...post, topic: topic.query })))
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 18),
    [topicStats],
  );

  const lastUpdated = topicStats
    .map((topic) => new Date(topic.fetchedAt).getTime())
    .sort((a, b) => b - a)[0];

  function addTopic(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const topic = newTopic.trim();
    if (!topic || topics.some((item) => item.toLowerCase() === topic.toLowerCase())) return;
    if (topics.length >= 3) {
      setError("You can compare up to three topics at a time.");
      return;
    }
    setTopics((current) => [...current, topic]);
    setNewTopic("");
  }

  function removeTopic(topic: string) {
    setTopics((current) => current.filter((item) => item !== topic));
    setStats((current) => {
      const next = { ...current };
      delete next[topic];
      return next;
    });
  }

  function exportCsv() {
    const header = ["topic", "author", "handle", "published_at", "sentiment", "likes", "reposts", "replies", "text", "url"];
    const rows = recentPosts.map((post) => [
      post.topic,
      post.author,
      post.handle,
      post.createdAt,
      post.sentiment,
      post.likes,
      post.reposts,
      post.replies,
      post.text,
      post.url,
    ]);
    const csv = [header, ...rows].map((row) => row.map(escapeCsv).join(",")).join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `socialwatch-${new Date().toISOString().slice(0, 10)}.csv`;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  return (
    <main className="min-h-screen bg-[#f7f8fa] text-slate-950">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-[1440px] items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-md bg-slate-950 text-white">
              <Radio className="h-5 w-5" aria-hidden="true" />
            </div>
            <div>
              <p className="text-base font-bold">SocialWatch</p>
              <p className="text-xs text-slate-500">Public conversation monitor</p>
            </div>
          </div>
          <Link
            href="https://musingila-portfolio-v2.vercel.app/"
            className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 transition-colors hover:text-slate-950"
            target="_blank"
            rel="noreferrer"
          >
            Portfolio
            <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </div>
      </header>

      <div className="mx-auto max-w-[1440px] px-4 py-8 sm:px-6 lg:px-8">
        <section className="flex flex-col justify-between gap-6 border-b border-slate-200 pb-7 lg:flex-row lg:items-end">
          <div>
            <div className="mb-3 inline-flex items-center gap-2 text-xs font-semibold uppercase text-emerald-700">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              Live Bluesky data
            </div>
            <h1 className="text-3xl font-bold sm:text-4xl">Conversation overview</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
              Compare public posts, sentiment signals, and engagement around the topics on your watchlist.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="flex rounded-md border border-slate-200 bg-white p-1" aria-label="Analysis period">
              {PERIODS.map((period) => (
                <button
                  key={period.days}
                  type="button"
                  onClick={() => setPeriodDays(period.days)}
                  className={`h-8 min-w-12 rounded px-3 text-sm font-medium transition-colors ${
                    periodDays === period.days ? "bg-slate-950 text-white" : "text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  {period.label}
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={() => setRefreshKey((value) => value + 1)}
              disabled={loading}
              className="inline-flex h-10 items-center gap-2 rounded-md border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
              Refresh
            </button>
            <button
              type="button"
              onClick={exportCsv}
              disabled={recentPosts.length === 0}
              className="inline-flex h-10 items-center gap-2 rounded-md bg-slate-950 px-3 text-sm font-semibold text-white transition-colors hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Download className="h-4 w-4" />
              Export
            </button>
          </div>
        </section>

        <section className="py-6">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-wrap items-center gap-2">
              <span className="mr-1 text-sm font-semibold text-slate-700">Watchlist</span>
              {topics.map((topic, index) => (
                <span
                  key={topic}
                  className="inline-flex h-9 items-center gap-2 rounded-md border border-slate-200 bg-white px-3 text-sm font-medium"
                >
                  <span className="h-2 w-2 rounded-full" style={{ backgroundColor: TOPIC_COLORS[index] }} />
                  {topic}
                  <button
                    type="button"
                    onClick={() => removeTopic(topic)}
                    className="text-slate-400 transition-colors hover:text-rose-600"
                    aria-label={`Remove ${topic}`}
                    title={`Remove ${topic}`}
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </span>
              ))}
            </div>

            <form onSubmit={addTopic} className="flex w-full max-w-md gap-2">
              <label htmlFor="topic" className="sr-only">Topic or keyword</label>
              <div className="relative min-w-0 flex-1">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  id="topic"
                  value={newTopic}
                  onChange={(event) => setNewTopic(event.target.value)}
                  placeholder="Topic or keyword"
                  maxLength={80}
                  className="h-10 w-full rounded-md border border-slate-200 bg-white pl-9 pr-3 text-sm outline-none transition-shadow focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
                />
              </div>
              <button
                type="submit"
                disabled={!newTopic.trim() || topics.length >= 3}
                className="inline-flex h-10 items-center gap-2 rounded-md bg-blue-600 px-3 text-sm font-semibold text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Plus className="h-4 w-4" />
                Track
              </button>
            </form>
          </div>

          {error && (
            <div className="mt-4 rounded-md border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700" role="alert">
              {error}
            </div>
          )}
        </section>

        <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {[
            { label: "Posts sampled", value: totals.posts, icon: MessageCircle, color: "text-blue-600", note: `Latest ${periodDays === 1 ? "24 hours" : `${periodDays} days`}` },
            { label: "Positive share", value: totals.posts ? `${Math.round((totals.positive / totals.posts) * 100)}%` : "0%", icon: Activity, color: "text-emerald-600", note: "Keyword sentiment" },
            { label: "Total engagement", value: totals.engagement, icon: Heart, color: "text-rose-600", note: "Likes, replies and reposts" },
            { label: "Topics tracked", value: topics.length, icon: Radio, color: "text-amber-600", note: "Saved in this browser" },
          ].map((item) => (
            <div key={item.label} className="rounded-md border border-slate-200 bg-white p-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-medium text-slate-500">{item.label}</p>
                  <p className="mt-2 text-3xl font-bold">{typeof item.value === "number" ? formatNumber(item.value) : item.value}</p>
                </div>
                <item.icon className={`h-5 w-5 ${item.color}`} />
              </div>
              <p className="mt-4 text-xs text-slate-500">{item.note}</p>
            </div>
          ))}
        </section>

        <section className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1.55fr)_minmax(320px,0.75fr)]">
          <div className="rounded-md border border-slate-200 bg-white p-4 sm:p-6">
            <div className="mb-6 flex items-start justify-between gap-4">
              <div>
                <h2 className="text-base font-bold">Sentiment trend</h2>
                <p className="mt-1 text-xs text-slate-500">Daily average from -1 negative to +1 positive</p>
              </div>
              {lastUpdated && <p className="text-xs text-slate-400">Updated {new Date(lastUpdated).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</p>}
            </div>
            <div className="h-80 min-w-0">
              {loading && chartData.length === 0 ? (
                <div className="grid h-full place-items-center text-sm text-slate-500">
                  <Loader2 className="mr-2 inline h-4 w-4 animate-spin" /> Loading live posts
                </div>
              ) : chartData.length === 0 ? (
                <div className="grid h-full place-items-center text-center text-sm text-slate-500">
                  No posts matched this watchlist in the selected period.
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData} margin={{ top: 8, right: 12, left: -18, bottom: 0 }}>
                    <CartesianGrid stroke="#e2e8f0" strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="date" tick={{ fontSize: 11, fill: "#64748b" }} tickLine={false} axisLine={false} />
                    <YAxis domain={[-1, 1]} tick={{ fontSize: 11, fill: "#64748b" }} tickLine={false} axisLine={false} />
                    <Tooltip contentStyle={{ borderRadius: 6, borderColor: "#e2e8f0", fontSize: 12 }} />
                    <Legend wrapperStyle={{ fontSize: 12, paddingTop: 12 }} />
                    {topics.map((topic, index) => (
                      <Line
                        key={topic}
                        type="monotone"
                        dataKey={topic}
                        connectNulls
                        stroke={TOPIC_COLORS[index]}
                        strokeWidth={2.5}
                        dot={{ r: 3, strokeWidth: 0, fill: TOPIC_COLORS[index] }}
                        activeDot={{ r: 5 }}
                      />
                    ))}
                  </LineChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          <div className="rounded-md border border-slate-200 bg-white p-4 sm:p-6">
            <h2 className="text-base font-bold">Topic comparison</h2>
            <p className="mt-1 text-xs text-slate-500">Latest public posts returned per topic</p>
            <div className="mt-5 divide-y divide-slate-100">
              {topics.map((topic, index) => {
                const topicData = stats[topic];
                const positiveShare = topicData?.totalPosts
                  ? Math.round((topicData.positivePosts / topicData.totalPosts) * 100)
                  : 0;
                return (
                  <div key={topic} className="py-4 first:pt-0 last:pb-0">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex min-w-0 items-center gap-2">
                        <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: TOPIC_COLORS[index] }} />
                        <p className="truncate text-sm font-semibold">{topic}</p>
                      </div>
                      <p className="text-sm font-bold">{formatNumber(topicData?.totalPosts ?? 0)} posts</p>
                    </div>
                    <div className="mt-3 grid grid-cols-2 gap-3 text-xs text-slate-500">
                      <p><span className="font-semibold text-emerald-700">{positiveShare}%</span> positive</p>
                      <p className="text-right"><span className="font-semibold text-slate-900">{formatNumber(topicData?.totalEngagement ?? 0)}</span> engagements</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        <section className="mt-6 rounded-md border border-slate-200 bg-white p-4 sm:p-6">
          <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-start">
            <div>
              <h2 className="text-base font-bold">Conversation word cloud</h2>
              <p className="mt-1 text-xs text-slate-500">Frequent terms across the latest sampled posts</p>
            </div>
            <p className="text-xs text-slate-400">Watchlist names and common words excluded</p>
          </div>
          <div className="mt-4 border-t border-slate-100 pt-2">
            <WordCloud texts={recentPosts.map((post) => post.text)} excludedTerms={topics} />
          </div>
        </section>

        <section className="mt-6 rounded-md border border-slate-200 bg-white">
          <div className="flex flex-col justify-between gap-2 border-b border-slate-200 px-4 py-4 sm:flex-row sm:items-center sm:px-6">
            <div>
              <h2 className="text-base font-bold">Recent public posts</h2>
              <p className="mt-1 text-xs text-slate-500">Open any result to verify the original Bluesky post</p>
            </div>
            <p className="text-xs font-medium text-slate-400">Showing {recentPosts.length} results</p>
          </div>

          <div className="divide-y divide-slate-100">
            {loading && recentPosts.length === 0 && (
              <div className="flex items-center justify-center gap-2 px-6 py-16 text-sm text-slate-500">
                <Loader2 className="h-4 w-4 animate-spin" /> Searching public posts
              </div>
            )}
            {!loading && recentPosts.length === 0 && (
              <div className="px-6 py-16 text-center text-sm text-slate-500">No recent posts found for this watchlist.</div>
            )}
            {recentPosts.map((post) => (
              <article key={`${post.topic}-${post.id}`} className="grid gap-4 px-4 py-5 sm:px-6 lg:grid-cols-[minmax(0,1fr)_auto]">
                <div className="flex min-w-0 gap-3">
                  {post.avatar ? (
                    <div
                      className="h-10 w-10 shrink-0 rounded-full bg-slate-100 bg-cover bg-center"
                      style={{ backgroundImage: `url(${post.avatar})` }}
                      role="img"
                      aria-label={`${post.author} avatar`}
                    />
                  ) : (
                    <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-slate-100 text-xs font-bold text-slate-600">
                      {post.author.slice(0, 2).toUpperCase()}
                    </div>
                  )}
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                      <p className="truncate text-sm font-semibold">{post.author}</p>
                      <p className="truncate text-xs text-slate-400">@{post.handle}</p>
                      <span className={`rounded px-2 py-0.5 text-[11px] font-semibold capitalize ring-1 ring-inset ${sentimentClasses(post.sentiment)}`}>
                        {post.sentiment}
                      </span>
                      <span className="rounded bg-blue-50 px-2 py-0.5 text-[11px] font-semibold text-blue-700">{post.topic}</span>
                    </div>
                    <p className="mt-2 max-w-4xl whitespace-pre-wrap text-sm leading-6 text-slate-700">{post.text || "Post without text"}</p>
                    <div className="mt-3 flex flex-wrap items-center gap-4 text-xs text-slate-400">
                      <span>{new Date(post.createdAt).toLocaleString([], { dateStyle: "medium", timeStyle: "short" })}</span>
                      <span className="inline-flex items-center gap-1"><Heart className="h-3.5 w-3.5" /> {post.likes}</span>
                      <span className="inline-flex items-center gap-1"><Repeat2 className="h-3.5 w-3.5" /> {post.reposts}</span>
                      <span className="inline-flex items-center gap-1"><MessageCircle className="h-3.5 w-3.5" /> {post.replies}</span>
                    </div>
                  </div>
                </div>
                <a
                  href={post.url}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex h-9 items-center justify-center gap-2 self-start rounded-md border border-slate-200 px-3 text-xs font-semibold text-slate-600 transition-colors hover:border-slate-300 hover:bg-slate-50 hover:text-slate-950"
                >
                  View post
                  <ExternalLink className="h-3.5 w-3.5" />
                </a>
              </article>
            ))}
          </div>
        </section>

        <footer className="flex flex-col justify-between gap-2 py-8 text-xs text-slate-400 sm:flex-row">
          <p>SocialWatch analyses a maximum of 50 recent public posts per topic.</p>
          <p>Sentiment is a keyword signal, not a statement of fact.</p>
        </footer>
      </div>
    </main>
  );
}
