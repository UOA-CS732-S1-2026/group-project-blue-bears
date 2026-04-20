import { useEffect, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import LobbyExitModal from '../components/LobbyExitModal'
import LobbyPlayerCard, { type LobbyPlayer } from '../components/LobbyPlayerCard'
import PageHeader from '../components/PageHeader'
import './LobbyPage.css'

const LOBBY_BASE_WIDTH = 1280
const LOBBY_BASE_HEIGHT = 832

function LobbyPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const viewportRef = useRef<HTMLDivElement | null>(null)
  const [showExitDialog, setShowExitDialog] = useState(false)
  const [scale, setScale] = useState(1)
  const [copied, setCopied] = useState(false)
  const [selfReady, setSelfReady] = useState(false)
  const [showVsOverlay, setShowVsOverlay] = useState(false)
  const [countdown, setCountdown] = useState(3)
  const [countdownActive, setCountdownActive] = useState(false)
  const [readyNotice, setReadyNotice] = useState<string | null>(null)
  const lobbyState = location.state as
    | {
        mode?: 'create' | 'join'
        roomCode?: string
        gameTitle?: string
        roundLabel?: string
        roundScore?: string
        players?: LobbyPlayer[]
      }
    | null
  const roomLink = lobbyState?.roomCode ?? 'ABC123'
  const gameTitle = 'TYPE-OF-WAR'
  const currentRound = lobbyState?.roundLabel ?? 'Round 1'
  const roundScore = lobbyState?.roundScore ?? '0-0'
  const defaultPlayers: LobbyPlayer[] = [
    {
      name: 'MARK-WENTER',
      code: '#00000',
      wins: '9999',
      initials: 'MW',
      side: 'left',
      avatarUrl: undefined,
      isReady: false,
    },
    {
      name: 'CALOB',
      code: '#00000',
      wins: '9999',
      initials: 'CB',
      side: 'right',
      avatarUrl: undefined,
      isReady: true,
    },
  ]
  const createLobbyPlayers: LobbyPlayer[] = [
    defaultPlayers[0],
    {
      name: '???',
      code: '',
      wins: '',
      initials: '',
      side: 'right',
      avatarUrl: undefined,
      isPlaceholder: true,
    },
  ]
  const players =
    lobbyState?.players ??
    ((lobbyState?.mode ?? 'join') === 'create' ? createLobbyPlayers : defaultPlayers)
  const currentUserSide: LobbyPlayer['side'] = 'left'
  const activePlayerCount = players.filter(player => !player.isPlaceholder).length
  const activePlayers = players.filter(player => !player.isPlaceholder)
  const opponentPlayer = activePlayers.find(player => player.side !== currentUserSide)
  const opponentReady = Boolean(opponentPlayer?.isReady)
  const bothPlayersReady = activePlayerCount > 1 && selfReady && opponentReady

  const handleExitConfirm = () => {
    setShowExitDialog(false)
    navigate('/')
  }

  const handleExitClick = () => {
    if (activePlayerCount <= 1) {
      navigate(-1)
      return
    }

    setShowExitDialog(true)
  }

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(roomLink)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1200)
    } catch {
      setCopied(false)
    }
  }

  const handleReadyClick = () => {
    if (showVsOverlay) {
      return
    }

    if (activePlayerCount <= 1) {
      setReadyNotice('No opponent yet')
      return
    }

    if (!selfReady) {
      setSelfReady(true)
    }

    if (!opponentReady) {
      setReadyNotice('Waiting for opponent')
      return
    }

    setReadyNotice(null)
    setCountdown(3)
    setCountdownActive(false)
    setShowVsOverlay(true)
  }

  const handleViewProfile = (player: LobbyPlayer) => {
    navigate('/profile&match_history', {
      state: {
        profileName: player.name,
        sessionUser: {
          name: player.name,
          rank: player.code,
          avatarUrl: player.avatarUrl,
        },
      },
    })
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

  useEffect(() => {
    if (!showVsOverlay) {
      return
    }

    const startTimer = window.setTimeout(() => {
      setCountdownActive(true)
    }, 80)

    return () => window.clearTimeout(startTimer)
  }, [showVsOverlay])

  useEffect(() => {
    if (!showVsOverlay || !countdownActive) {
      return
    }

    if (countdown <= 0) {
      const closeTimer = window.setTimeout(() => {
        setShowVsOverlay(false)
        setCountdownActive(false)
      }, 900)

      return () => window.clearTimeout(closeTimer)
    }

    const timer = window.setTimeout(() => {
      setCountdown(current => current - 1)
    }, 1000)

    return () => window.clearTimeout(timer)
  }, [countdown, countdownActive, showVsOverlay])

  useEffect(() => {
    if (!readyNotice) {
      return
    }

    const timer = window.setTimeout(() => {
      setReadyNotice(null)
    }, 1500)

    return () => window.clearTimeout(timer)
  }, [readyNotice])

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
              className={`lobby-page-header${showVsOverlay ? ' lobby-scene-hidden' : ''}`}
              titleClassName="lobby-page-title"
              leftContentClassName="lobby-page-header-left"
              rightContentClassName="lobby-page-header-right"
              leftContent={<div className="lobby-game-title">{lobbyState?.gameTitle ?? gameTitle}</div>}
              title={`Code: ${roomLink}`}
              rightContent={
                <button
                  className={`lobby-menu-button${showVsOverlay ? ' lobby-ui-hidden' : ''}`}
                  type="button"
                  onClick={handleExitClick}
                >
                  Exit
                </button>
              }
            />

            <button
              className={`lobby-header-copy-button lobby-copy-button${
                copied ? ' lobby-copy-button-copied' : ''
              }${showVsOverlay ? ' lobby-ui-hidden' : ''}`}
              type="button"
              onClick={handleCopyCode}
              aria-label={copied ? 'Copied' : 'Copy code'}
              title={copied ? 'Copied' : 'Copy code'}
            >
              <span className="lobby-copy-button-icon" aria-hidden="true" />
            </button>

            <main className="lobby-board">
              <section className="lobby-scoreboard">
                <p className="lobby-round">{currentRound}</p>
                <p className={`lobby-score${showVsOverlay ? ' lobby-ui-hidden' : ''}`}>{roundScore}</p>
              </section>

              <section className={`lobby-players${showVsOverlay ? ' lobby-scene-hidden' : ''}`}>
                {players.map(player => (
                  <LobbyPlayerCard
                    key={`${player.side}-${player.name}`}
                    player={player}
                    hideActions={showVsOverlay}
                    onViewProfile={
                      player.isPlaceholder
                        ? undefined
                        : () => handleViewProfile(player)
                    }
                  />
                ))}
              </section>

              <section className={`lobby-actions${showVsOverlay ? ' lobby-scene-hidden' : ''}`}>
                <button
                  className={`lobby-start${bothPlayersReady ? ' lobby-start-ready' : ''}${
                    showVsOverlay ? ' lobby-ui-hidden' : ''
                  }`}
                  type="button"
                  onClick={handleReadyClick}
                >
                  Ready
                </button>

                {readyNotice && (
                  <div className="lobby-ready-notice" aria-live="polite">
                    <span className="lobby-ready-notice-icon" aria-hidden="true">
                      !
                    </span>
                    <span>{readyNotice}</span>
                  </div>
                )}
              </section>
            </main>

            {showVsOverlay && activePlayers.length >= 2 && (
              <div className="lobby-vs-overlay" aria-live="polite">
                <div className="lobby-vs-stage">
                  <div className="lobby-vs-slice lobby-vs-slice-top" />
                  <div className="lobby-vs-slice lobby-vs-slice-bottom" />

                  <div className="lobby-vs-flash-container">
                    <div className="lobby-vs-flash-line" />
                  </div>

                  <div className="lobby-vs-player lobby-vs-player-left">
                    <div className="lobby-vs-avatar-shell lobby-vs-avatar-shell-left">
                      <div className="lobby-vs-avatar lobby-vs-avatar-left">
                        {activePlayers[0].avatarUrl ? (
                          <img
                            src={activePlayers[0].avatarUrl}
                            alt={`${activePlayers[0].name} avatar`}
                            className="lobby-vs-avatar-image"
                          />
                        ) : (
                          <span>{activePlayers[0].initials}</span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="lobby-vs-player lobby-vs-player-right">
                    <div className="lobby-vs-avatar-shell lobby-vs-avatar-shell-right">
                      <div className="lobby-vs-avatar lobby-vs-avatar-right">
                        {activePlayers[1].avatarUrl ? (
                          <img
                            src={activePlayers[1].avatarUrl}
                            alt={`${activePlayers[1].name} avatar`}
                            className="lobby-vs-avatar-image"
                          />
                        ) : (
                          <span>{activePlayers[1].initials}</span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="lobby-vs-mark">VS</div>
                  <div className="lobby-vs-countdown">
                    {countdown > 0 ? countdown : 'GO'}
                  </div>
                </div>
              </div>
            )}
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
