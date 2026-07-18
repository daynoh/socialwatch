import React, { useState } from 'react'
import { MultiSelect as MS} from 'react-multi-select-component'


export default function MultiSelect() {
    const options = [
        {label: 'X' ,value: 'twitter'},
        {label: 'FB', value: 'FaceBook'}
    ]
    const [selected, setSelected] = useState([])
  return (
    <MS
        options={options}
        value={selected}
        onChange={setSelected}
        labelledBy="Select"
      />
  )
}
