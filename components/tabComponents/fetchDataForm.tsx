'use client'
import * as React from "react"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import MultiSelect from "../ui/multiSelect"
import { DatePickerWithRange } from "../dateRangePicker"
import { Tag,TagInput } from "../ui/tag/tag-input"

export default function CardWithForm() {
  const [selectedItems, setSelectedItems] = React.useState<string[]>([]);
  const [tags, setTags] = React.useState<Tag[]>([]);

  const handleSelect = (value: string) => {
    setSelectedItems([...selectedItems, value]);
  };

  const handleRemove = (value: string) => {
    setSelectedItems(selectedItems.filter(item => item !== value));
  };
  
  return (
    <Card className="w-[350px]">
      <CardHeader>
        <CardTitle>Add Entity</CardTitle>
        <CardDescription>Add a new Entity to your analysis in one-click.</CardDescription>
      </CardHeader>
      <CardContent>
        <form>
          <div className="grid w-full items-center gap-4">
            <div className="flex flex-col space-y-1.5">
              <Label htmlFor="name">Name</Label>
              <Input id="name" placeholder="Name of your entity" />
            </div>

            <div className="flex flex-col space-y-1.5">
              <Label htmlFor="Tags">Associated Tags</Label>
              <TagInput       
              placeholder="Enter a AssociatedTag"
              tags={tags}
              
              setTags={(newTags) => {
                setTags(newTags);
                
              }}
            />

            </div>
            
            <div className="flex flex-col space-y-1.5">
              <Label htmlFor="platform">Social Platform</Label>
              <MultiSelect/>

            </div>

            <div className="flex flex-col space-y-1.5">
              <Label htmlFor="dateRange">Date Range</Label>
              <DatePickerWithRange/>

            </div>
          </div>
        </form>
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button variant="outline">Cancel</Button>
        <Button>Add Entity</Button>
      </CardFooter>
    </Card>
  )
}

