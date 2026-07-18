import React from 'react'
import { Tag,TagInput } from './ui/tag/tag-input'
export default function TagInputs() {
    const [tags, setTags] = React.useState<Tag[]>([]);
  return (
    <TagInput
      tags={tags}
      placeholder='Enter a Tag/SearchTerm  associated with your Entity'
      className="sm:min-w-[450px]"
      setTags={setTags}
    />
  )
}
