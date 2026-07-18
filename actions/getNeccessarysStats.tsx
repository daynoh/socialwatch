import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

interface SentimentAnalysisResult {
  dailyAverageSentiments: { date: string; averageSentiment: number }[];
  totalTweets: number;
  retweetsPositivePosts: number;
  retweetsNegativePosts: number;
  likesPositivePosts: number;
  likesNegativePosts: number;
}

export async function getStatsByEntity(entityName: string, startDate: string, endDate: string): Promise<SentimentAnalysisResult> {
  // Fetch tweets related to the entity within the date range
  const tweets = await prisma.tweet.findMany({
    where: {
      SearchTerm: {
        some: {
          Entity: {
            some:{
                name: entityName,
            }
            
          },
        },
      },
      datetime: {
        gte: new Date(startDate),
        lte: new Date(endDate),
      },
    },
    select: {
      sentiment: true,
      likes: true,
      reposts: true,
      datetime: true,
    },
  });

  // console.log(tweets)

  // Initialize aggregation variables
  let retweetsPositivePosts = 0;
  let retweetsNegativePosts = 0;
  let likesPositivePosts = 0;
  let likesNegativePosts = 0;
  const dailyData: Record<string, { totalSentiment: number; count: number }> = {};

  // Aggregate data
  tweets.forEach(tweet => {
    const date = tweet.datetime?.toISOString().split('T')[0];
    if (!date) return;

    if (!dailyData[date]) {
      dailyData[date] = { totalSentiment: 0, count: 0 };
    }
    dailyData[date].totalSentiment += tweet.sentiment ?? 0;
    dailyData[date].count += 1;
    if (tweet.sentiment === null){
        retweetsPositivePosts += 0
    }
    else if (tweet.sentiment > 0) {
      retweetsPositivePosts += tweet.reposts;
      likesPositivePosts += tweet.likes;
    } else if (tweet.sentiment < 0) {
      retweetsNegativePosts += tweet.reposts;
      likesNegativePosts += tweet.likes;
    }
  });

  // Prepare daily average sentiments
  const dailyAverageSentiments = Object.keys(dailyData).map(date => ({
    date,
    averageSentiment: dailyData[date].totalSentiment / dailyData[date].count,
  })).sort((a, b) => a.date.localeCompare(b.date));

  return {
    dailyAverageSentiments,
    totalTweets: tweets.length,
    retweetsPositivePosts,
    retweetsNegativePosts,
    likesPositivePosts,
    likesNegativePosts,
  };
}
