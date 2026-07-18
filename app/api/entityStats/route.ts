import type { NextRequest } from "next/server";

export const dynamic = "force-dynamic";

const POSITIVE_WORDS = new Set([
  "amazing", "awesome", "best", "better", "brilliant", "clean", "excellent",
  "excited", "fair", "fast", "good", "great", "happy", "helpful", "hope",
  "improve", "improved", "innovation", "love", "progress", "safe", "success",
  "support", "win", "winning", "asante", "bora", "hongera", "maendeleo", "nzuri",
]);

const NEGATIVE_WORDS = new Set([
  "angry", "awful", "bad", "broken", "corrupt", "corruption", "crisis", "delay",
  "disappointed", "expensive", "fail", "failed", "failure", "fraud", "hate",
  "poor", "problem", "risk", "scam", "slow", "terrible", "unsafe", "worse",
  "worst", "chuki", "hasara", "mbaya", "shida", "ufisadi",
]);

type BlueskyPost = {
  uri: string;
  author: {
    handle: string;
    displayName?: string;
    avatar?: string;
  };
  record: {
    text?: string;
    createdAt?: string;
  };
  indexedAt?: string;
  likeCount?: number;
  repostCount?: number;
  replyCount?: number;
  quoteCount?: number;
};

function scoreSentiment(text: string) {
  const tokens = text.toLowerCase().match(/[a-z]+/g) ?? [];
  let score = 0;

  for (const token of tokens) {
    if (POSITIVE_WORDS.has(token)) score += 1;
    if (NEGATIVE_WORDS.has(token)) score -= 1;
  }

  return Math.max(-1, Math.min(1, score));
}

function postUrl(post: BlueskyPost) {
  const recordKey = post.uri.split("/").pop();
  return `https://bsky.app/profile/${post.author.handle}/post/${recordKey}`;
}

function jsonResponse(data: unknown, status = 200) {
  return Response.json(data, {
    status,
    headers: {
      "Cache-Control": "no-store",
    },
  });
}

export async function GET(req: NextRequest) {
  const entityName = req.nextUrl.searchParams.get("entityName")?.trim();
  const startDate = req.nextUrl.searchParams.get("startDate");
  const endDate = req.nextUrl.searchParams.get("endDate");

  if (!entityName || entityName.length > 80 || !startDate || !endDate) {
    return jsonResponse({ error: "Provide a topic and a valid date range." }, 400);
  }

  const since = new Date(startDate);
  const until = new Date(endDate);

  if (Number.isNaN(since.getTime()) || Number.isNaN(until.getTime()) || since >= until) {
    return jsonResponse({ error: "The selected date range is invalid." }, 400);
  }

  const searchUrl = new URL("https://api.bsky.app/xrpc/app.bsky.feed.searchPosts");
  searchUrl.searchParams.set("q", entityName);
  searchUrl.searchParams.set("limit", "50");
  searchUrl.searchParams.set("sort", "latest");
  searchUrl.searchParams.set("since", since.toISOString());
  searchUrl.searchParams.set("until", until.toISOString());

  try {
    const response = await fetch(searchUrl, {
      cache: "no-store",
      headers: {
        Accept: "application/json",
        "User-Agent": "SocialWatch/1.0",
      },
      signal: AbortSignal.timeout(10_000),
    });

    if (!response.ok) {
      throw new Error(`Bluesky returned ${response.status}`);
    }

    const payload = (await response.json()) as { posts?: BlueskyPost[] };
    const posts = payload.posts ?? [];
    const dailyScores = new Map<string, number[]>();

    const recentPosts = posts.map((post) => {
      const text = post.record.text?.trim() ?? "";
      const createdAt = post.record.createdAt ?? post.indexedAt ?? new Date().toISOString();
      const sentimentScore = scoreSentiment(text);
      const day = createdAt.slice(0, 10);
      const dayScores = dailyScores.get(day) ?? [];
      dayScores.push(sentimentScore);
      dailyScores.set(day, dayScores);

      return {
        id: post.uri,
        text,
        createdAt,
        author: post.author.displayName || post.author.handle,
        handle: post.author.handle,
        avatar: post.author.avatar ?? null,
        url: postUrl(post),
        likes: post.likeCount ?? 0,
        reposts: post.repostCount ?? 0,
        replies: post.replyCount ?? 0,
        quotes: post.quoteCount ?? 0,
        sentiment: sentimentScore > 0 ? "positive" : sentimentScore < 0 ? "negative" : "neutral",
        sentimentScore,
      };
    });

    const dailyAverageSentiments = Array.from(dailyScores.entries())
      .map(([date, scores]) => ({
        date,
        averageSentiment: scores.reduce((sum, score) => sum + score, 0) / scores.length,
        mentions: scores.length,
      }))
      .sort((a, b) => a.date.localeCompare(b.date));

    const positivePosts = recentPosts.filter((post) => post.sentiment === "positive").length;
    const negativePosts = recentPosts.filter((post) => post.sentiment === "negative").length;
    const neutralPosts = recentPosts.length - positivePosts - negativePosts;
    const likes = recentPosts.reduce((sum, post) => sum + post.likes, 0);
    const reposts = recentPosts.reduce((sum, post) => sum + post.reposts, 0);
    const replies = recentPosts.reduce((sum, post) => sum + post.replies, 0);
    const quotes = recentPosts.reduce((sum, post) => sum + post.quotes, 0);

    return jsonResponse({
      query: entityName,
      dataSource: "bluesky",
      fetchedAt: new Date().toISOString(),
      totalPosts: recentPosts.length,
      positivePosts,
      negativePosts,
      neutralPosts,
      likes,
      reposts,
      replies,
      quotes,
      totalEngagement: likes + reposts + replies + quotes,
      dailyAverageSentiments,
      recentPosts,
    });
  } catch (error) {
    console.error("Unable to fetch Bluesky posts", error);
    return jsonResponse(
      { error: "Live social data is temporarily unavailable. Please refresh in a moment." },
      502,
    );
  }
}
