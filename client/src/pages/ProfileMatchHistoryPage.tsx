import { useEffect, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import ProfileMatchHistory from '../components/ProfileMatchHistory'
import './ProfileMatchHistoryPage.css'

const PROFILE_BASE_WIDTH = 1280
const PROFILE_BASE_HEIGHT = 832

function ProfileMatchHistoryPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const viewportRef = useRef<HTMLDivElement | null>(null)
  const [scale, setScale] = useState(1)
  const state = location.state as {
    profileName?: string
    sessionUser?: {
      name?: string
      rank?: string
      avatarUrl?: string
    }
  } | null
  const profileName = state?.profileName?.toUpperCase() ?? 'DAVID'
  const sessionUser = state?.sessionUser
    ? {
        name: (state.sessionUser.name ?? 'ANDREW').toUpperCase(),
        rank: state.sessionUser.rank ?? '#00000',
        avatarUrl: state.sessionUser.avatarUrl,
      }
    : null

  useEffect(() => {
    const updateScale = () => {
      const viewport = viewportRef.current
      if (!viewport) {
        return
      }

      const nextScale = Math.min(
        viewport.clientWidth / PROFILE_BASE_WIDTH,
        viewport.clientHeight / PROFILE_BASE_HEIGHT,
      )

      setScale(nextScale)
    }

    updateScale()
    window.addEventListener('resize', updateScale)

    return () => {
      window.removeEventListener('resize', updateScale)
    }
  }, [])

  return (
    <div className="profile-history-root">
      <div className="profile-history-viewport" ref={viewportRef}>
        <div
          className="profile-history-scale-layer"
          style={{
            width: `${PROFILE_BASE_WIDTH}px`,
            height: `${PROFILE_BASE_HEIGHT}px`,
            transform: `scale(${scale})`,
          }}
        >
          <ProfileMatchHistory
            onExit={() => navigate(-1)}
            profileName={profileName}
            sessionUser={sessionUser}
            onViewSessionProfile={
              sessionUser
                ? () =>
                    navigate('/profile&match_history', {
                      state: {
                        profileName: sessionUser.name,
                        sessionUser,
                      },
                    })
                : undefined
            }
          />
        </div>
      </div>
    </div>
  )
}

export default ProfileMatchHistoryPage
