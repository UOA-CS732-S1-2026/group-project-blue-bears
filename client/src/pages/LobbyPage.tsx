import { useEffect, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import LobbyExitModal from '../components/LobbyExitModal'
import LobbyHeader from '../components/LobbyHeader'
import LobbyPlayerCard, { type LobbyPlayer } from '../components/LobbyPlayerCard'
import useSocket from '../hooks/useSocket'
import './LobbyPage.css'

const LOBBY_BASE_WIDTH = 1280
const LOBBY_BASE_HEIGHT = 832

interface RoomPlayerPayload {
  userId: string
  username: string
}

interface RaceResultPayload {
  userId: string
  username: string
  wpm: number
  accuracy: number
  finished: boolean
}

interface LobbyLocationState {
  code?: string
  guestName?: string
  userId?: string
  username?: string
}

const formatDuration = (totalSeconds: number) => {
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return `${minutes}:${String(seconds).padStart(2, '0')}`
}

const getContiguousMatchLength = (typed: string, passage: string) => {
  const max = Math.min(typed.length, passage.length)
  for (let index = 0; index < max; index += 1) {
    if (typed[index] !== passage[index]) {
      return index
    }
  }

  return max
}

function LobbyPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { socket, connected } = useSocket()
  const viewportRef = useRef<HTMLDivElement | null>(null)
  const raceStartAtRef = useRef<number | null>(null)
  const locationState = (location.state as LobbyLocationState | null) ?? {}
  const roomId = (locationState.code || 'public-room').trim().toUpperCase()
  const username = (locationState.guestName || locationState.username || 'Player').trim().toUpperCase()
  const userIdRef = useRef(locationState.userId || crypto.randomUUID())
  const [showExitDialog, setShowExitDialog] = useState(false)
  const [scale, setScale] = useState(1)
  const [roomPlayers, setRoomPlayers] = useState<RoomPlayerPayload[]>([
    { userId: userIdRef.current, username },
  ])
  const [roomReady, setRoomReady] = useState(false)
  const [statusMessage, setStatusMessage] = useState('Connecting to race server...')
  const [countdown, setCountdown] = useState<number | null>(null)
  const [passageText, setPassageText] = useState('')
  const [typedText, setTypedText] = useState('')
  const [raceStarted, setRaceStarted] = useState(false)
  const [myProgress, setMyProgress] = useState(0)
  const [opponentProgress, setOpponentProgress] = useState(0)
  const [didFinish, setDidFinish] = useState(false)
  const [opponentFinished, setOpponentFinished] = useState(false)

  const opponent = roomPlayers.find(player => player.userId !== userIdRef.current)
  const players: LobbyPlayer[] = [
    {
      name: username,
      code: `#${roomId}`,
      wins: `${Math.round(myProgress)}%`,
      initials: username.slice(0, 2) || 'P1',
      side: 'left',
    },
    {
      name: opponent?.username || 'WAITING',
      code: `#${roomId}`,
      wins: `${Math.round(opponentProgress)}%`,
      initials: (opponent?.username || 'P2').slice(0, 2),
      side: 'right',
    },
  ]

  const handleExitConfirm = () => {
    setShowExitDialog(false)
    navigate('/')
  }

  const handleStartRace = () => {
    if (!roomReady) {
      setStatusMessage('Waiting for an opponent to join this room.')
      return
    }

    socket.emit('start_race', { roomId })
  }

  const handleTypingChange = (nextTypedText: string) => {
    if (!raceStarted || !passageText || didFinish) {
      return
    }

    setTypedText(nextTypedText)
    const matchedChars = getContiguousMatchLength(nextTypedText, passageText)
    const progress = Math.round((matchedChars / passageText.length) * 100)

    if (progress > myProgress) {
      setMyProgress(progress)
      socket.emit('progress_update', {
        roomId,
        userId: userIdRef.current,
        progress,
      })
    }

    if (matchedChars === passageText.length) {
      const startedAt = raceStartAtRef.current || Date.now()
      const elapsedMinutes = Math.max((Date.now() - startedAt) / 60000, 1 / 60)
      const wordCount = passageText.trim().split(/\s+/).length
      const calculatedWpm = Math.max(1, Math.round(wordCount / elapsedMinutes))
      const calculatedAccuracy = Math.max(
        0,
        Math.min(100, Math.round((matchedChars / Math.max(nextTypedText.length, 1)) * 100)),
      )

      setMyProgress(100)
      setDidFinish(true)
      setRaceStarted(false)
      setStatusMessage('You finished. Waiting for race results...')

      socket.emit('race_complete', {
        roomId,
        userId: userIdRef.current,
        wpm: calculatedWpm,
        accuracy: calculatedAccuracy,
      })
    }
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
    if (!connected) {
      setStatusMessage('Connecting to race server...')
      return
    }

    const handleRoomReady = (payload: { players: RoomPlayerPayload[] }) => {
      setRoomPlayers(payload.players)
      setRoomReady(true)
      setStatusMessage('Room ready. Start the race when both players are prepared.')
    }

    const handleRaceCountdown = (payload: { count: number }) => {
      setCountdown(payload.count)
      setStatusMessage(`Race begins in ${payload.count}...`)
    }

    const handleRaceStart = (payload: { passageText: string }) => {
      raceStartAtRef.current = Date.now()
      setCountdown(null)
      setPassageText(payload.passageText)
      setTypedText('')
      setMyProgress(0)
      setOpponentProgress(0)
      setDidFinish(false)
      setOpponentFinished(false)
      setRaceStarted(true)
      setStatusMessage('Race started. Type as fast and accurately as you can!')
    }

    const handleOpponentProgress = (payload: { progress: number }) => {
      setOpponentProgress(payload.progress)
    }

    const handleOpponentFinished = () => {
      setOpponentFinished(true)
      setStatusMessage('Opponent finished first. Keep typing before timeout to submit your result.')
    }

    const handleRaceResults = (payload: { results: RaceResultPayload[] }) => {
      const myResult = payload.results.find(result => result.userId === userIdRef.current)
      const opponentResult = payload.results.find(result => result.userId !== userIdRef.current)

      const playerStats = {
        wpm: myResult?.wpm ?? 0,
        accuracy: myResult?.accuracy ?? 0,
      }
      const opponentStats = {
        wpm: opponentResult?.wpm ?? 0,
        accuracy: opponentResult?.accuracy ?? 0,
      }

      let outcome: 'victory' | 'defeat' | 'draw' = 'draw'
      if (playerStats.wpm > opponentStats.wpm) {
        outcome = 'victory'
      } else if (playerStats.wpm < opponentStats.wpm) {
        outcome = 'defeat'
      }

      const durationInSeconds = raceStartAtRef.current
        ? Math.max(1, Math.round((Date.now() - raceStartAtRef.current) / 1000))
        : 0

      navigate('/result', {
        state: {
          outcome,
          playerStats,
          opponentStats,
          duration: formatDuration(durationInSeconds),
        },
      })
    }

    const handleOpponentDisconnected = (payload: { message?: string }) => {
      setRaceStarted(false)
      setCountdown(null)
      setRoomReady(false)
      setStatusMessage(payload.message || 'Opponent disconnected. Return to menu or rejoin a room.')
    }

    const handleSocketError = (payload: { message?: string }) => {
      setStatusMessage(payload.message || 'A socket error occurred.')
    }

    socket.on('room_ready', handleRoomReady)
    socket.on('race_countdown', handleRaceCountdown)
    socket.on('race_start', handleRaceStart)
    socket.on('opponent_progress', handleOpponentProgress)
    socket.on('opponent_finished', handleOpponentFinished)
    socket.on('race_results', handleRaceResults)
    socket.on('opponent_disconnected', handleOpponentDisconnected)
    socket.on('error', handleSocketError)

    socket.emit('join_room', {
      roomId,
      userId: userIdRef.current,
      username,
    })
    setStatusMessage('Waiting for opponent...')

    return () => {
      socket.off('room_ready', handleRoomReady)
      socket.off('race_countdown', handleRaceCountdown)
      socket.off('race_start', handleRaceStart)
      socket.off('opponent_progress', handleOpponentProgress)
      socket.off('opponent_finished', handleOpponentFinished)
      socket.off('race_results', handleRaceResults)
      socket.off('opponent_disconnected', handleOpponentDisconnected)
      socket.off('error', handleSocketError)
    }
  }, [connected, navigate, roomId, socket, username])

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
            <LobbyHeader
              title={`Lobby: ${roomId}`}
              userWins={`${Math.round(myProgress)}%`}
              userName={username}
              onExit={() => setShowExitDialog(true)}
            />

            <main className="lobby-board">
              <section className="lobby-scoreboard">
                <p className="lobby-round">Connection: {connected ? 'ONLINE' : 'OFFLINE'}</p>
                <p className="lobby-score">Rope: {Math.round(myProgress - opponentProgress)}</p>
              </section>

              <section className="lobby-players">
                {players.map(player => (
                  <LobbyPlayerCard
                    key={player.name}
                    player={player}
                    onViewProfile={() => navigate('/profile&match_history')}
                  />
                ))}
              </section>

              <section className="lobby-actions">
                <p className="lobby-race-status">{statusMessage}</p>
                {countdown !== null && <p className="lobby-race-countdown">{countdown}</p>}

                {(passageText || raceStarted) && (
                  <div className="lobby-race-panel">
                    <p className="lobby-passage">{passageText}</p>
                    <textarea
                      className="lobby-race-input"
                      value={typedText}
                      onChange={event => handleTypingChange(event.target.value)}
                      disabled={!raceStarted || didFinish}
                      placeholder="Type the passage here when the race starts"
                    />
                    <p className="lobby-progress-line">
                      You: {Math.round(myProgress)}% | Opponent: {Math.round(opponentProgress)}%
                    </p>
                    {opponentFinished && !didFinish && (
                      <p className="lobby-opponent-finished">Opponent finished. Submit your run before timeout.</p>
                    )}
                  </div>
                )}

                <button
                  className="lobby-start"
                  onClick={handleStartRace}
                  disabled={!roomReady || raceStarted || countdown !== null}
                >
                  Start Game
                </button>
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
