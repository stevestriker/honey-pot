import React, { useCallback } from 'react'
import { GU, useTheme } from '@1hive/1hive-ui'
import HelpTip from '@components/HelpTip'

function ListFilter({ items, selected, onChange }) {
  return (
    <div>
      {items.map((item, index) => (
        <ListItem
          key={index}
          index={index}
          item={item}
          onSelect={onChange}
          selected={selected}
          helptip={item.toLowerCase()}
        />
      ))}
    </div>
  )
}

function ListItem({ index, item, onSelect, selected, helptip }) {
  const theme = useTheme()

  const handleOnClick = useCallback(() => {
    onSelect(index)
  }, [index, onSelect])

  return (
    <div
      css={`
        margin-bottom: ${1 * GU}px;
        color: ${theme[selected === index ? 'content' : 'contentSecondary']};
      `}
    >
      <span css="cursor:pointer" onClick={handleOnClick}>
        {item}
      </span>
      <span
        css={`
          margin-left: ${1 * GU}px;
          display: inline-block;
        `}
      >
        <HelpTip type={helptip} />
      </span>
    </div>
  )
}

export default ListFilter
