import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import LobbyExitModal from '../components/LobbyExitModal'
import LobbyPlayerCard, { type LobbyPlayer } from '../components/LobbyPlayerCard'
import PageHeader from '../components/PageHeader'
import './LobbyPage.css'

const LOBBY_BASE_WIDTH = 1280
const LOBBY_BASE_HEIGHT = 832

function LobbyPage() {
  const navigate = useNavigate()
  const viewportRef = useRef<HTMLDivElement | null>(null)
  const [showExitDialog, setShowExitDialog] = useState(false)
  const [scale, setScale] = useState(1)
  const players: LobbyPlayer[] = [
    {
      name: 'MARK-WENTER',
      code: '#00000',
      wins: '9999',
      initials: 'MW',
      side: 'left',
    },
    {
      name: 'CALOB',
      code: '#00000',
      wins: '9999',
      initials: 'CB',
      side: 'right',
    },
  ]

  const handleExitConfirm = () => {
    setShowExitDialog(false)
    navigate('/')
  }

  useEffect(() => {
    const updateScale = () => {
      const viewport = viewportRef.current
      if (!viewport) {
        return
      }

      const nextScale = Math.min(
        viewport.clientWidth / LOBBY_BASE_WIDTH,
        viewport.clientHeight / LOBBY_BASE_HEIGHT,
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
    <div className="lobby-root">
      <div className="lobby-viewport" ref={viewportRef}>
        <div
          className="lobby-scale-layer"
          style={{
            width: `${LOBBY_BASE_WIDTH}px`,
            height: `${LOBBY_BASE_HEIGHT}px`,
            transform: `scale(${scale})`,
          }}
        >
          <div className="lobby-shell">
            <PageHeader
              title="Lobby: LOBBYNAME"
              onExit={() => setShowExitDialog(true)}
              className="lobby-header"
              titleClassName="lobby-title"
              rightContentClassName="lobby-header-right"
              guestBadge={{ topLabel: 'WINS: N/A', bottomLabel: 'LOGIN' }}
              guestBadgeClassName="lobby-user-badge"
            />

            <main className="lobby-board">
              <section className="lobby-scoreboard">
                <p className="lobby-round">Round 0</p>
                <p className="lobby-score">0 - 0</p>
              </section>

              <section className="lobby-players">
                {players.map(player => (
                  <LobbyPlayerCard
                    key={player.name}
                    player={player}
                    onViewProfile={() =>
                      navigate('/profile&match_history', {
                        state: {
                          profileName: player.name,
                        },
                      })
                    }
                  />
                ))}
              </section>

              <section className="lobby-actions">
                <button className="lobby-start">Start Game</button>
              </section>
            </main>
          </div>
        </div>
      </div>

      <LobbyExitModal
        isOpen={showExitDialog}
        onCancel={() => setShowExitDialog(false)}
        onConfirm={handleExitConfirm}
      />
    </div>
  )
}

export default LobbyPage
