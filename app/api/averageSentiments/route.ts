// app/api/sentiments.tsx
import { getSentimentsByEntity } from '@/actions/getSentimentsByEntity';
import { PrismaClient } from '@prisma/client';
import type { NextRequest } from 'next/server';

const prisma = new PrismaClient();

export async function GET(req: NextRequest) {
  const url = req.nextUrl;
  const entityName = url.searchParams.get('entityName');
  const startDate = url.searchParams.get('startDate');
  const endDate = url.searchParams.get('endDate');

  if (!entityName || !startDate || !endDate) {
    return new Response(JSON.stringify({ error: 'Missing parameters' }), {
      status: 400,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }

  try {
    // Your existing logic to fetch and process data
    const sentiments = await getSentimentsByEntity(entityName, startDate, endDate);
    return new Response(JSON.stringify(sentiments), {
      headers: {
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Failed to fetch data' }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }
}
