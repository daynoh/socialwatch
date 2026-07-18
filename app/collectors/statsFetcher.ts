import React, { useEffect } from 'react'
import { useEntityStore } from '@/providers/entityStore'
export default function StatsFetcher( {entityName, startDate, endDate}:{
    entityName: string
    startDate: Date
    endDate : Date
} ) {
  
    const addEntity = useEntityStore((state) => state.addEntity)
    const addAverageTweet = useEntityStore((state) => state.addAverageTweet)
    const updatePositiveRetweets = useEntityStore((state) => state.updatePositiveRetweets);
    const updateNegativeRetweets = useEntityStore((state) => state.updateNegativeRetweets);
    const updatePositiveLikes = useEntityStore((state) => state.updatePositiveLikes)
    const updateNegativeLikes = useEntityStore((state) => state.updateNegativeLikes)
    const updateTweetTotal  = useEntityStore((state) => state.updateTweetTotal)
  // Add other actions as needed

  useEffect(() => {
    const fetchData = async() => {
    try {
        const data = fetch(`/api/entityStats?entityName=${entityName}&startDate=${startDate}&endDate=${endDate}`)
        .then(response => {
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
        })

        const results = await data
        console.log(results)
        addEntity(entityName,entityName)
        results.dailyAverageSentiments.forEach(({date, averageSentiment}:
            {date:Date
            averageSentiment: number}) =>{
            addAverageTweet(entityName,date,averageSentiment)
        })
        updatePositiveLikes(entityName,results.likesPositivePosts)
        updateNegativeLikes(entityName,results.likesNegativePosts)
        updatePositiveRetweets(entityName,results.retweetsPositivePosts)
        updateNegativeRetweets(entityName,results.retweetsNegativePosts)
        updateTweetTotal(entityName,results.totalTweets)
    
        
    } catch (error) {
        console.error("Error statistics:", error);
    }
    

    }
    fetchData()

  }, [
    addAverageTweet,
    addEntity,
    endDate,
    entityName,
    startDate,
    updateNegativeLikes,
    updateNegativeRetweets,
    updatePositiveLikes,
    updatePositiveRetweets,
    updateTweetTotal,
  ])

  return null
}
