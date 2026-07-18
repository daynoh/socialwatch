"use client"

import React from 'react'
import AnalyticsCard from '../AnalyticsCards/analyicsCard'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card'
import { InteractionStatistics } from './interactionStatistics'
import { OverviewContent } from './overviewContent'
import { useEntityStore } from '@/providers/entityStore'

export default function Overview () {

  const entities = useEntityStore((state) => state.entities);
  const entityNames = Object.keys(entities)
  const entity1Mention = entities[entityNames[0]]?.tweetsTotal || 0
  const entity2Mention = entities[entityNames[1]]?.tweetsTotal || 0
 

  return (
    <>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <AnalyticsCard title={ `Total Tweets for ${entityNames[0]}`} totalMentions={entity1Mention} percentageChange={-25.3} purpose='totals'/>
                
                <AnalyticsCard title = 'Like to Dislike ratio' totalMentions = {0.3} percentageChange={30.44} purpose = 'likeDislike'/>
                <AnalyticsCard title = { `Total Tweets for ${entityNames[1]}`}  totalMentions = {entity2Mention} percentageChange={30.44} purpose = 'totals'/>
                <AnalyticsCard title = 'Like to Dislike ratio' totalMentions = {0.6} percentageChange={12.44} purpose = 'likeDislike'/>
        </div>
              
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                <Card className="col-span-4">
                  <CardHeader>
                    <CardTitle>Sentiment average</CardTitle>
                  </CardHeader>
                  <CardContent className="pl-2">
                    <OverviewContent />
                  </CardContent>
                </Card>
                <Card className="col-span-3">
                  <CardHeader>
                    <CardTitle>Interactions Details</CardTitle>
                    <CardDescription>
                      Some detailed interaction that have occured this month
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <InteractionStatistics/>
                  </CardContent>
                </Card>
        </div>
    </>
  )
}
