"use client"

import { BellIcon, CheckIcon } from "@radix-ui/react-icons"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar"

import { useEntityStoreOne } from "@/providers/entityStore"
import { useEffect } from "react"

type CardProps = React.ComponentProps<typeof Card>

interface InteractionCardProps extends CardProps{
  entityName: string
  positiveRetweets: number
  negativeRetweets: number
  positiveLikes: number
  negativeLikes: number
}

export function InteractionCard({ className,entityName,positiveRetweets, negativeRetweets, positiveLikes,negativeLikes,...props }: InteractionCardProps) {

 
   // Empty dependency array means this effect runs once on mount

  return (
    <Card className={cn("w-full", className)} {...props}>
      <CardHeader>
        
        <CardTitle className="flex items-center gap-2">
            <Avatar className="h-9 w-9">
                <AvatarImage src="/avatars/01.png" alt="Avatar" />
                <AvatarFallback>EN</AvatarFallback>
            </Avatar>
            {entityName} Statistics
        </CardTitle>

      </CardHeader>
      <CardContent className="grid gap-2 text-center">
        <div className=" flex items-center space-x-4 rounded-md border p-3">
          
          <div className="flex-1 space-y-1 justify-center">
            <p className="text-sm font-medium leading-none ">
              Retweets
            </p>
            <div className="flex justify-between">
                <div>
                    <p className="text-sm text-muted-foreground">
                        Postive retweets
                    </p>
                    <p>
                        {positiveRetweets}
                    </p>
                </div>
                <div>
                    <p className="text-sm text-muted-foreground">
                        Negative retweets
                    </p>
                    <p>
                        {negativeRetweets}
                    </p>
            </div>
            </div>
            
            
          </div>

          
         
        </div>
        <div className=" flex items-center space-x-4 rounded-md border p-3">
          
          <div className="flex-1 space-y-1 justify-center">
            <p className="text-sm font-medium leading-none ">
              Like counts
            </p>
            <div className="flex justify-between">
                <div>
                    <p className="text-sm text-muted-foreground">
                        Postive Tweets Like Count
                    </p>
                    <p>
                        {positiveLikes}
                    </p>
                </div>
                <div>
                    <p className="text-sm text-muted-foreground">
                        Negative Tweets Like Coun
                    </p>
                    <p>
                        {negativeLikes}
                    </p>
            </div>
            </div>
            
            
          </div>

          
         
        </div>
        
      </CardContent>
      
    </Card>
  )
}
