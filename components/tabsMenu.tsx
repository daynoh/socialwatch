import React from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import AnalyticsCard from './AnalyticsCards/analyicsCard'
import Overview from './tabComponents/overviewTab'
import EditData from './tabComponents/editData'

export default function TabsMenu() {
  
  return (
    <>
      <Tabs defaultValue="overview" className="space-y-4">
            <TabsList>
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="analytics">
                Analytics
              </TabsTrigger>
              <TabsTrigger value="reports">
                Reports
              </TabsTrigger>
              <TabsTrigger value="editData">
                Edit Data
              </TabsTrigger>
            </TabsList>
            <TabsContent value="overview" className="space-y-4">
              <Overview/>
            </TabsContent>

            <TabsContent value = "editData" className='space-y-4'>
              <EditData/>
            </TabsContent>
          </Tabs>
    </>
  )
}
