import React, { useCallback, useEffect, useState } from 'react'
import { useHistory } from 'react-router-dom'
import { IdentityBadge as Badge } from '@1hive/1hive-ui'

import { getNetwork } from '@/networks'
import { getProfileForAccount } from '@lib/profile'

const addressCache = new Map()

const IdentityBadge = React.memo(function IdentityBadge({ entity, ...props }) {
  const [profileName, setProfileName] = useState(null)
  const history = useHistory()

  const { explorer, type } = getNetwork()

  const handleViewProfile = useCallback(() => {
    history.push(`/profile?account=${entity}`)
  }, [entity, history])

  useEffect(() => {
    let cancelled = false
    async function fetchProfile() {
      if (addressCache.get(entity)) {
        setProfileName(addressCache.get(entity))
        return
      }
      const profile = await getProfileForAccount(entity)
      if (profile && !cancelled) {
        setProfileName(profile.name)
        addressCache.set(entity, profile.name)
      }
    }

    fetchProfile()
    return () => {
      cancelled = true
    }
  }, [entity])

  return (
    <Badge
      label={profileName}
      entity={entity}
      explorerProvider={explorer}
      networkType={type}
      popoverAction={{ label: 'View profile', onClick: handleViewProfile }}
      {...props}
    />
  )
})

export default IdentityBadge
