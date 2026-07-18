# SocialWatch

SocialWatch is a live public-conversation dashboard for comparing topics, measuring engagement, and reviewing lightweight sentiment signals from Bluesky posts.

## Features

- Track and compare up to three topics
- Search real public Bluesky posts without private API credentials
- Switch between 24-hour, 7-day, and 30-day analysis periods
- Review sentiment trends and topic-level engagement
- Open every result on its original Bluesky post
- Save the watchlist in the browser
- Export recent results as CSV

## Live app

[socialwatch-omega.vercel.app](https://socialwatch-omega.vercel.app/)

## Stack

- Next.js 14
- React and TypeScript
- Tailwind CSS
- Recharts
- Bluesky public AppView API
- Vercel

## Local development

```bash
npm install
npm run dev
```

Create a production build with:

```bash
npm run build
```

The live Bluesky reader does not require an API key. The sentiment score is a transparent keyword signal and should not be treated as a factual classification.
