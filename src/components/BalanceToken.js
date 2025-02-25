import React from 'react'
import styled from 'styled-components'
import { GU } from '@1hive/1hive-ui'

import { formatTokenAmount } from '@utils/token-utils'

const splitAmount = (amount, decimals) => {
  const [integer, fractional] = formatTokenAmount(amount, decimals).split('.')
  return (
    <span
      css={`
        margin-right: ${0.5 * GU}px;
      `}
    >
      <span>{integer}</span>
      {fractional && <span className="fractional">.{fractional}</span>}
    </span>
  )
}

const BalanceToken = ({ amount, color, decimals, icon, size, symbol }) => {
  return (
    <div
      css={`
        display: flex;
        align-items: center;
        color: ${color};
        ${size}
      `}
    >
      <TokenIcon src={icon} />
      {amount !== undefined && amount !== null
        ? splitAmount(amount, decimals)
        : ' - '}
      {symbol || ''}
    </div>
  )
}

const TokenIcon = styled.img.attrs({ alt: '', width: '24', height: '24' })`
  margin-right: ${1 * GU}px;
`

export default BalanceToken
