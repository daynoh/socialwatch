"use client"
import { getSentimentsByEntity } from '@/actions/getSentimentsByEntity';
import { useEffect, useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

import { useEntityStore, useEntityStoreOne } from '@/providers/entityStore';
import { useDateStore } from '@/providers/dateRangeStore';
import StatsFetcher from '@/app/collectors/statsFetcher';

interface SentimentData {
  date: string;
  averageSentiment: number;
}

interface ChartData {
  date: string;
  [entityName: string]: string | number; // Dynamic keys for each entity's sentiment
}
const entityNames = ["ruto", "raila"]; // Example entity names
export function OverviewContent() {
  const {startDate, endDate} = useDateStore()

  entityNames.forEach((entityName) =>{
    StatsFetcher({entityName, startDate, endDate})
  })
  const [chartData, setChartData] = useState<ChartData[]>([]);
  const entities = useEntityStore((state) => state.entities);

  useEffect(() => {
    const combinedData: Record<string, ChartData> = {};

    Object.values(entities).forEach((entity) => {
      entity.averageTweets.forEach(({ date, averageSentiment }) => {
        const dateKey = date instanceof Date
          ? date.toISOString().slice(0, 10)
          : String(date).slice(0, 10);

        if (!combinedData[dateKey]) {
          combinedData[dateKey] = { date: dateKey };
        }
        // Use entity name as key for sentiment
        combinedData[dateKey][entity.entityName] = averageSentiment;
      });
    });

    setChartData(Object.values(combinedData).sort((a, b) => a.date.localeCompare(b.date)));
  }, [entities]); // Dependency on entities to re-calculate when entities change

  return (

    <ResponsiveContainer width="100%" height={500}>
    <LineChart
      data={chartData}
      margin={{
        top: 5,
        right: 30,
        left: 20,
        bottom: 5,
      }}
    >
      <CartesianGrid strokeDasharray="3 3" />
      <XAxis dataKey="date" />
      <YAxis />
      <Tooltip />
      <Legend />
      {Object.keys(entities).map((entityId, index) => {
          const entity = entities[entityId];
          return (
            <Line
              key={entityId}
              type="monotone"
              dataKey={entity.entityName}
              stroke={index % 2 === 0 ? "#8884d8" : "#82ca9d"}
              activeDot={{ r: 8 }}
            />
          );
        })}
    </LineChart>
  </ResponsiveContainer>  )
}
