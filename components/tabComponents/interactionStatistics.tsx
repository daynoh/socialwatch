

import { useEntityStore } from "@/providers/entityStore"
import { InteractionCard } from "./intercationsCard"
  
export function InteractionStatistics() {
  const entities = useEntityStore((state) => state.entities);
  const entityNames = Object.keys(entities)
  return (
    <div className="space-y-8">

      {entityNames.map((entityName, index) => (
      <InteractionCard key={index} 
      entityName={entityName} 
      positiveRetweets={entities[entityName].positiveRetweets}
      negativeRetweets={entities[entityName].negativeRetweets}
      positiveLikes={entities[entityName].positiveLikes}
      negativeLikes={entities[entityName].negativeLikes}/>
    ))}
      
    </div>
  )
}
  