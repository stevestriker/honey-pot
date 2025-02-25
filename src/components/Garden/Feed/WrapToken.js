import React, { useCallback } from 'react'
import styled from 'styled-components'
import {
  Box,
  Button,
  GU,
  Help,
  LoadingRing,
  useLayout,
  textStyle,
  useTheme,
} from '@1hive/1hive-ui'

import { useGardenState } from '@providers/GardenState'
import useUnipoolRewards from '@/hooks/useUnipoolRewards'

import { formatTokenAmount } from '@utils/token-utils'

import wrappedIcon from '@assets/wrappedIcon.svg'
import unwrappedIcon from '@assets/unwrappedIcon.svg'

function WrapToken({ onClaimRewards, onUnwrapToken, onWrapToken }) {
  const { layoutName } = useLayout()
  const { token, wrappableToken } = useGardenState()
  const loading =
    token.accountBalance.eq(-1) || wrappableToken.accountBalance.eq(-1)

  const theme = useTheme()
  const compactMode = layoutName === 'small' || layoutName === 'medium'

  const [earnedRewards, rewardsLink] = useUnipoolRewards()

  const handleClaimRewards = useCallback(() => {
    if (rewardsLink) {
      window.open(rewardsLink)
      return
    }

    onClaimRewards()
  }, [onClaimRewards, rewardsLink])

  return (
    <Box
      css={`
        ${!compactMode && `margin-bottom: ${3 * GU}px;`}
      `}
    >
      <div
        css={`
          display: flex;
          flex-direction: row;
          justify-content: center;
        `}
      >
        <Token
          balance={wrappableToken.accountBalance}
          loading={loading}
          mode="wrap"
          onClick={onWrapToken}
          token={wrappableToken.data}
        />
        <LineSeparator border={theme.border} />
        <div>
          <Token
            balance={token.accountBalance}
            loading={loading}
            mode="unwrap"
            onClick={onUnwrapToken}
            token={token.data}
          />
          {earnedRewards.gt('0') && (
            <div
              css={`
                margin-top: ${3 * GU}px;
                padding-top: ${2 * GU}px;
                border-top: 1px solid ${theme.border};
              `}
            >
              Earned rewards:{' '}
              <span
                css={`
                  color: ${theme.positive};
                `}
              >
                {formatTokenAmount(earnedRewards, wrappableToken.data.decimals)}{' '}
                {wrappableToken.data.symbol}
              </span>{' '}
              <Button
                label="Claim"
                mode="strong"
                wide
                onClick={handleClaimRewards}
                css={`
                  margin-top: ${1.5 * GU}px;
                `}
              />
            </div>
          )}
        </div>
      </div>
    </Box>
  )
}

function Token({ balance, loading, mode, onClick, token }) {
  const wrapMode = mode === 'wrap'
  const icon = wrapMode ? unwrappedIcon : wrappedIcon
  const button = wrapMode
    ? { mode: 'strong', label: 'Wrap' }
    : { mode: 'normal', label: 'Unwrap' }

  return (
    <div
      css={`
        display: flex;
        flex-direction: column;
        align-items: center;
        width: 100%;
        ${textStyle('body2')};
      `}
    >
      <img src={icon} height="48" width="48" />
      {loading ? (
        <div
          css={`
            width: 100%;
            margin: ${1 * GU}px 0;
            height: ${3 * GU}px;
            display: flex;
            justify-content: center;
            align-items: center;
          `}
        >
          <LoadingRing />
        </div>
      ) : (
        <span
          css={`
            font-weight: 600;
            margin: ${1 * GU}px 0;
          `}
        >
          {formatTokenAmount(balance, token.decimals)}
        </span>
      )}
      <div
        css={`
          display: flex;
          align-items: center;
        `}
      >
        <span>{token.symbol}</span>
        {!wrapMode && (
          <div
            css={`
              margin-left: ${1 * GU}px;
            `}
          >
            <Help>
              This amount can be used to vote on proposals. It can be unwrapped
              at any time.
            </Help>
          </div>
        )}
      </div>
      <Button
        mode={button.mode}
        wide
        label={button.label}
        onClick={onClick}
        disabled={balance.lte(0)}
        css={`
          margin-top: ${3 * GU}px;
        `}
      />
    </div>
  )
}

const LineSeparator = styled.div`
  border-left: 1px solid ${({ border }) => border};
  margin: 0 ${3 * GU}px;
`

export default WrapToken
