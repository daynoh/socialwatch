import { PrismaClient } from '@prisma/client';
import prismadb from '@/lib/prismadb';
const prisma = prismadb

interface SentimentData {
  date: string;
  averageSentiment: number;
}

// Update the function signature to accept start and end dates
export async function getSentimentsByEntity(entityName: string, startDate: string, endDate: string): Promise<SentimentData[]> {
  const entityData = await prisma.entity.findUnique({
    where: { name: entityName },
    include: {
      SearchTerm: {
        include: {
          Tweet: {
            where: {
              // Filter tweets that fall within the start and end date range
              datetime: {
                gte: new Date(startDate),
                lte: new Date(endDate),
              },
            },
            select: {
              sentiment: true,
              datetime: true,
            },
          },
        },
      },
    },
  });

  if (!entityData) {
    throw new Error('Entity not found');
  }

  // Flatten the tweets and aggregate sentiment scores by date
  const tweets = entityData.SearchTerm.flatMap(st => st.Tweet);
  const aggregatedData: Record<string, { totalSentiment: number; count: number }> = {};

  tweets.forEach(tweet => {
    if (tweet.datetime && tweet.sentiment !== null) {
      const date = tweet.datetime.toISOString().split('T')[0];
      if (!aggregatedData[date]) {
        aggregatedData[date] = { totalSentiment: 0, count: 0 };
      }
      aggregatedData[date].totalSentiment += tweet.sentiment;
      aggregatedData[date].count += 1;
    }
  });

  // Convert the aggregated data into an array of SentimentData
  const sentimentData: SentimentData[] = Object.keys(aggregatedData).map(date => ({
    date,
    averageSentiment: aggregatedData[date].totalSentiment / aggregatedData[date].count,
  }));

  // Sort the sentiment data by date
  sentimentData.sort((a, b) => a.date.localeCompare(b.date));

  return sentimentData;
}