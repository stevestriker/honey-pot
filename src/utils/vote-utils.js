import { addressesEqual } from './web3-utils'
import {
  VOTE_ABSENT,
  VOTE_NAY,
  VOTE_YEA,
  VOTE_STATUS_ACCEPTED,
  VOTE_STATUS_CANCELLED,
  VOTE_STATUS_CHALLENGED,
  VOTE_STATUS_DISPUTED,
  VOTE_STATUS_ENACTED,
  VOTE_STATUS_ONGOING,
  VOTE_STATUS_PENDING_ENACTMENT,
  VOTE_STATUS_REJECTED,
  VOTE_STATUS_SETTLED,
  PROPOSAL_STATUS_ACTIVE_STRING,
  PROPOSAL_STATUS_EXECUTED_STRING,
  PROPOSAL_STATUS_CANCELLED_STRING,
  PROPOSAL_STATUS_SETTLED_STRING,
  PROPOSAL_STATUS_CHALLENGED_STRING,
  PROPOSAL_STATUS_DISPUTED_STRING,
  PROPOSAL_STATUS_REJECTED_STRING,
} from '../constants'

const EMPTY_SCRIPT = '0x00000001'

export function isVoteAction(vote) {
  return vote.script && vote.data.script !== EMPTY_SCRIPT
}

export function getAccountCastStake(vote, account) {
  const userCast = vote.casts.find(cast =>
    addressesEqual(cast.entity.id, account)
  )

  return userCast?.stake || 0
}

export function getConnectedAccountVote(vote, account) {
  const userCast = vote.casts.find(cast =>
    addressesEqual(cast.entity.id, account)
  )

  if (userCast) {
    return userCast.supports ? VOTE_YEA : VOTE_NAY
  }
  return VOTE_ABSENT
}

export function hasVoteEnded(status, endDate, challengeEndDate) {
  return (
    status === PROPOSAL_STATUS_CANCELLED_STRING ||
    status === PROPOSAL_STATUS_SETTLED_STRING ||
    status === PROPOSAL_STATUS_REJECTED_STRING ||
    (status !== PROPOSAL_STATUS_CHALLENGED_STRING &&
      status !== PROPOSAL_STATUS_DISPUTED_STRING &&
      Date.now() >= endDate) ||
    (status === PROPOSAL_STATUS_CHALLENGED_STRING &&
      Date.now() > challengeEndDate)
  )
}

export function getVoteEndDate(vote) {
  const baseVoteEndDate = vote.startDate + vote.voteTime
  const endDateAfterPause = baseVoteEndDate + vote.pauseDuration
  const lastComputedEndDate =
    endDateAfterPause + vote.quietEndingExtensionDuration

  // The last computed end date is correct if we have not passed it yet or if no flip was detected in the last extension
  const currentTimestamp = Date.now()
  if (currentTimestamp < lastComputedEndDate || !wasVoteFlipped(vote)) {
    return lastComputedEndDate
  }

  // Otherwise, since the last computed end date was reached and included a flip, we need to extend the end date by one more period
  return lastComputedEndDate + vote.quietEndingExtension
}

function wasVoteFlipped(vote) {
  // If there was no snapshot taken, it means no one voted during the quiet ending period. Thus, it cannot have been flipped.
  if (vote.quietEndingSnapshotSupport === 'Absent') {
    return false
  }

  // Otherwise, we calculate if the vote was flipped by comparing its current acceptance state to its last state at the start of the extension period
  const wasInitiallyAccepted = vote.quietEndingSnapshotSupport === 'Yea'
  const currentExtensions =
    vote.quietEndingExtensionDuration / vote.quietEndingExtension

  const wasAcceptedBeforeLastFlip =
    wasInitiallyAccepted === (currentExtensions % 2 === 0)
  return wasAcceptedBeforeLastFlip !== vote.isAccepted
}

export const getQuorumProgress = ({ yea, votingPower }) => yea.div(votingPower)

export function getVoteSuccess(vote, pctBase) {
  const { yea, minAcceptQuorum, nay, supportRequiredPct, votingPower } = vote

  const totalVotes = yea.plus(nay)
  if (totalVotes.isZero()) {
    return false
  }
  const yeaPct = yea.times(pctBase).div(totalVotes)
  const yeaOfTotalPowerPct = yea.times(pctBase).div(votingPower)

  // Mirror on-chain calculation
  // yea / votingPower > supportRequired ||
  //   (yea / totalVotes > supportRequired &&
  //    yea / votingPower > minAcceptQuorum)
  return (
    yeaOfTotalPowerPct.gt(supportRequiredPct) ||
    (yeaPct.gt(supportRequiredPct) && yeaOfTotalPowerPct.gt(minAcceptQuorum))
  )
}

export function getVoteStatus(vote, hasEnded, pctBase) {
  if (!hasEnded) {
    if (vote.status === PROPOSAL_STATUS_ACTIVE_STRING) {
      return VOTE_STATUS_ONGOING
    }

    return vote.status === PROPOSAL_STATUS_DISPUTED_STRING
      ? VOTE_STATUS_DISPUTED
      : VOTE_STATUS_CHALLENGED
  }

  // If it is challenged and has ended means it was settled because submitter didn't respond.
  if (vote.status === PROPOSAL_STATUS_CHALLENGED_STRING) {
    return VOTE_STATUS_SETTLED
  }

  if (vote.status === PROPOSAL_STATUS_SETTLED_STRING) {
    return VOTE_STATUS_SETTLED
  }

  if (
    vote.status === PROPOSAL_STATUS_REJECTED_STRING ||
    !getVoteSuccess(vote, pctBase)
  ) {
    return VOTE_STATUS_REJECTED
  }

  if (vote.status === PROPOSAL_STATUS_CANCELLED_STRING) {
    return VOTE_STATUS_CANCELLED
  }

  // Only if the vote has an action do we consider it possible for enactment
  const hasAction = isVoteAction(vote)
  return hasAction
    ? vote.status === PROPOSAL_STATUS_EXECUTED_STRING
      ? VOTE_STATUS_ENACTED
      : VOTE_STATUS_PENDING_ENACTMENT
    : VOTE_STATUS_ACCEPTED
}

export async function getCanUserVote(votingContract, voteId, account) {
  if (!votingContract || !account) {
    return false
  }

  return votingContract.canVote(voteId, account)
}
