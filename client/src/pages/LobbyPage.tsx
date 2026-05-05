import AuthHeader from '../components/AuthHeader'
import { useEffect, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import LobbyExitModal from '../components/LobbyExitModal'
import LobbyPlayerCard, { type LobbyPlayer } from '../components/LobbyPlayerCard'
import { getProfile } from '../services/profileService'
import useSocket from '../hooks/useSocket'
import './LobbyPage.css'

const ACTIVE_LOBBY_CODE_KEY = 'activeLobbyCode'
const ACTIVE_LOBBY_USER_KEY = 'activeLobbyUserId'

interface RoomPlayerPayload {
  userId: string
  displayName: string
  avatarKind: 'guest' | 'initials'
  ready: boolean
}

interface LobbyLocationState {
  code?: string
  userId?: string
  username?: string
}

interface RoomCreatedPayload {
  roomId: string
}

interface GameStartPayload {
  roomId: string
  passageText?: string
  totalSeconds?: number
  countdownSeconds?: number
  startAt?: number
}

function LobbyPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { socket, connected } = useSocket()
  const locationState = (location.state as LobbyLocationState | null) ?? {}
  const storedLobbyCode = sessionStorage.getItem(ACTIVE_LOBBY_CODE_KEY) || ''
  const initialRoomId = (locationState.code || storedLobbyCode).trim().toUpperCase()
  const [roomId, setRoomId] = useState(initialRoomId)
  const authToken = localStorage.getItem('token')
  const storedUserId = localStorage.getItem('userId')
  const storedLobbyUserId = sessionStorage.getItem(ACTIVE_LOBBY_USER_KEY)
  const userIdRef = useRef(storedUserId || locationState.userId || storedLobbyUserId || crypto.randomUUID())
  const requestedRoomRef = useRef(false)
  const [showExitDialog, setShowExitDialog] = useState(false)
  const [didCopyRoomCode, setDidCopyRoomCode] = useState(false)
  const [identityReady, setIdentityReady] = useState(!authToken)
  const [currentUserName, setCurrentUserName] = useState(authToken ? 'PLAYER' : 'GUEST')
  const [currentUserAvatarKind, setCurrentUserAvatarKind] = useState<'guest' | 'initials'>(
    authToken ? 'initials' : 'guest',
  )
  const [roomPlayers, setRoomPlayers] = useState<RoomPlayerPayload[]>([])
  const [statusMessage, setStatusMessage] = useState('Connecting to race server...')
  
  const [joinRetrying, setJoinRetrying] = useState(false)
  const probeIntervalRef = useRef<number | null>(null)

  const currentUserLabel = currentUserName.trim().toUpperCase() || 'PLAYER'
  const me = roomPlayers.find(player => player.userId === userIdRef.current)
  const opponent = roomPlayers.find(player => player.userId !== userIdRef.current)
  const roomReady = roomPlayers.length === 2
  const meReady = me?.ready ?? false

  // Build player cards. If the visitor is NOT a member of the room,
  // show the actual occupants in both slots (so a blocked 3rd can see who is in the room).
  let players: LobbyPlayer[]
  if (me) {
    const opponent = roomPlayers.find(player => player.userId !== userIdRef.current)
    players = [
      {
        name: currentUserLabel,
        initials: currentUserLabel.slice(0, 2) || 'PL',
        avatarKind: currentUserAvatarKind,
        side: 'left',
      },
      {
        name: opponent?.displayName || '?',
        initials: opponent ? opponent.displayName.slice(0, 2).toUpperCase() : '??',
        avatarKind: opponent ? opponent.avatarKind : 'question',
        side: 'right',
      },
    ]
  } else {
    // Not a member — show roomPlayers[0] as left slot, roomPlayers[1] as right slot
    const p1 = roomPlayers[0]
    const p2 = roomPlayers[1]
    players = [
      {
        name: p1?.displayName || '?',
        initials: p1 ? p1.displayName.slice(0, 2).toUpperCase() : '??',
        avatarKind: p1 ? p1.avatarKind : 'question',
        side: 'left',
      },
      {
        name: p2?.displayName || '?',
        initials: p2 ? p2.displayName.slice(0, 2).toUpperCase() : '??',
        avatarKind: p2 ? p2.avatarKind : 'question',
        side: 'right',
      },
    ]
  }

  const handleExitConfirm = () => {
    setShowExitDialog(false)
    sessionStorage.removeItem(ACTIVE_LOBBY_CODE_KEY)
    sessionStorage.removeItem(ACTIVE_LOBBY_USER_KEY)
    navigate('/')
  }

  const handleCopyRoomCode = async () => {
    if (!roomId) {
      return
    }

    try {
      await navigator.clipboard.writeText(roomId)
      setDidCopyRoomCode(true)
      window.setTimeout(() => setDidCopyRoomCode(false), 1400)
    } catch {
      setStatusMessage('Unable to copy the room code right now.')
    }
  }

  const handleReady = () => {
    if (!roomId) {
      return
    }

    socket.emit('ready_up', {
      roomId,
      userId: userIdRef.current,
    })

    setStatusMessage('You are ready. Waiting for the other player...')
  }

  useEffect(() => {
    if (!authToken) {
      setIdentityReady(true)
      return
    }

    let cancelled = false

    const loadIdentity = async () => {
      try {
        const profile = await getProfile(authToken)
        if (cancelled) {
          return
        }

        setCurrentUserName(profile.username.trim().toUpperCase() || 'PLAYER')
        setCurrentUserAvatarKind('initials')
      } catch {
        if (cancelled) {
          return
        }

        const fallbackName = (localStorage.getItem('email') || 'player').split('@')[0]
        setCurrentUserName(fallbackName.trim().toUpperCase() || 'PLAYER')
        setCurrentUserAvatarKind('initials')
      } finally {
        if (!cancelled) {
          setIdentityReady(true)
        }
      }
    }

    void loadIdentity()

    return () => {
      cancelled = true
    }
  }, [authToken])

  useEffect(() => {
    sessionStorage.setItem(ACTIVE_LOBBY_USER_KEY, userIdRef.current)
  }, [])

  useEffect(() => {
    if (!roomId) {
      return
    }

    sessionStorage.setItem(ACTIVE_LOBBY_CODE_KEY, roomId)
  }, [roomId])

  useEffect(() => {
    if (!connected) {
      setStatusMessage('Connecting to race server...')
      return
    }

    if (!identityReady) {
      setStatusMessage('Loading profile...')
      return
    }

    if (!requestedRoomRef.current) {
      requestedRoomRef.current = true

      if (initialRoomId) {
        socket.emit('join_room', {
          roomId: initialRoomId,
          userId: userIdRef.current,
          displayName: currentUserLabel,
          avatarKind: currentUserAvatarKind,
        })
        setStatusMessage('Waiting for opponent...')
      } else {
        socket.emit('create_room', {
          userId: userIdRef.current,
          displayName: currentUserLabel,
          avatarKind: currentUserAvatarKind,
        })
      }
    }

    const handleRoomState = (payload: { players: RoomPlayerPayload[] }) => {
      setRoomPlayers(payload.players)
      setJoinRetrying(false)

      const currentPlayer = payload.players.find(player => player.userId === userIdRef.current)
      const opponentPlayer = payload.players.find(player => player.userId !== userIdRef.current)

      if (!currentPlayer) {
        if (initialRoomId) {
          // We are not a member of the room and it was a join attempt — show full state
          setStatusMessage('Room is full. Once there is space, you will be placed into lobby automatically.')
        } else {
          setStatusMessage('Waiting for a slot in this room...')
        }
        return
      }

      if (probeIntervalRef.current) {
        window.clearInterval(probeIntervalRef.current)
        probeIntervalRef.current = null
      }

      if (currentPlayer.ready && opponentPlayer?.ready) {
        setStatusMessage('Both players are ready. Starting game...')
        return
      }

      if (currentPlayer.ready) {
        setStatusMessage('You are ready. Waiting for the other player...')
        return
      }

      if (opponentPlayer) {
        setStatusMessage('Press Ready when you are set.')
        return
      }

      setStatusMessage('Waiting for opponent...')
    }

    const handleRoomCreated = (payload: RoomCreatedPayload) => {
      setRoomId(payload.roomId)
      setJoinRetrying(false)
      setStatusMessage('Waiting for opponent...')
    }

    const handleRoomFull = (payload: { roomId: string; players: RoomPlayerPayload[] }) => {
      setRoomId(payload.roomId)
      setRoomPlayers(payload.players)
      setJoinRetrying(false)
      setStatusMessage('Room is full. Once there is space, you will be placed into lobby automatically.')

      // start probing for availability every 3s
      if (probeIntervalRef.current) {
        window.clearInterval(probeIntervalRef.current)
      }
      probeIntervalRef.current = window.setInterval(() => {
        socket.emit('probe_room', { roomId: payload.roomId })
      }, 3000)
    }

    const handleRoomProbe = (payload: { roomId: string; players: RoomPlayerPayload[] }) => {
      setRoomPlayers(payload.players)

      if (payload.players.length < 2) {
        const targetRoomId = (payload.roomId || roomId || initialRoomId).trim().toUpperCase()

        if (!joinRetrying && targetRoomId && connected && identityReady) {
          setJoinRetrying(true)
          setStatusMessage('Space found. Joining lobby...')
          socket.emit('join_room', {
            roomId: targetRoomId,
            userId: userIdRef.current,
            displayName: currentUserLabel,
            avatarKind: currentUserAvatarKind,
          })
        }
      } else {
        setJoinRetrying(false)
        setStatusMessage('Room is full. Once there is space, you will be placed into lobby automatically.')
      }
    }

    const handleGameStart = (payload: GameStartPayload) => {
      navigate('/game', {
        state: {
          roomId: payload.roomId,
          userId: userIdRef.current,
          username: currentUserLabel,
          passageText: payload.passageText,
          totalSeconds: payload.totalSeconds,
          countdownSeconds: payload.countdownSeconds,
          startAt: payload.startAt,
        },
      })
    }

    const handleOpponentDisconnected = () => {
      setStatusMessage('Opponent disconnected. Waiting for another player...')
    }

    const handleSocketError = (payload: { message?: string }) => {
      const message = payload.message || 'A socket error occurred.'

      if (message === 'Room is full') {
        setJoinRetrying(false)
        setStatusMessage('Room is full. Once there is space, you will be placed into lobby automatically.')
        return
      }

      setStatusMessage(message)
    }

    socket.on('room_state', handleRoomState)
    socket.on('room_created', handleRoomCreated)
    socket.on('game_start', handleGameStart)
    socket.on('room_full', handleRoomFull)
    socket.on('room_probe', handleRoomProbe)
    socket.on('opponent_disconnected', handleOpponentDisconnected)
    socket.on('error', handleSocketError)

    return () => {
      socket.off('room_state', handleRoomState)
      socket.off('room_created', handleRoomCreated)
      socket.off('game_start', handleGameStart)
      socket.off('room_full', handleRoomFull)
      socket.off('room_probe', handleRoomProbe)
      socket.off('opponent_disconnected', handleOpponentDisconnected)
      socket.off('error', handleSocketError)
      if (probeIntervalRef.current) {
        window.clearInterval(probeIntervalRef.current)
        probeIntervalRef.current = null
      }
    }
  }, [connected, currentUserAvatarKind, currentUserLabel, identityReady, initialRoomId, navigate, socket])

  return (
    <div className="lobby-root">
      <div className="lobby-viewport">
        <div className="lobby-scale-layer">
          <div className="lobby-shell">
            <AuthHeader
              center={
                <div className="lobby-room-code-wrap">
                  <span className="lobby-room-code">CODE: {roomId || '------'}</span>
                  <button
                    className="lobby-copy-code"
                    onClick={handleCopyRoomCode}
                    type="button"
                    aria-label="Copy lobby code"
                    title="Copy lobby code"
                  >
                    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                      <path d="M16 1H6a2 2 0 0 0-2 2v12h2V3h10V1Zm3 4H10a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h9a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2Zm0 16h-9V7h9v14Z" />
                    </svg>
                  </button>
                  {didCopyRoomCode && <span className="lobby-copy-toast">Copied</span>}
                </div>
              }
              exit={() => setShowExitDialog(true)}
            />

            <main className="lobby-board">
              <section className="lobby-players">
                {players.map(player => (
                  <LobbyPlayerCard key={player.side} player={player} />
                ))}
              </section>

              <section className="lobby-actions">
                <p className="lobby-race-status">{statusMessage}</p>
                {me && (
                  <button
                    className="lobby-start"
                    onClick={handleReady}
                    disabled={!roomId || roomPlayers.length < 2 || meReady}
                  >
                    {meReady ? 'Ready' : 'Ready'}
                  </button>
                )}
                {me && roomReady && (
                  <p className="lobby-race-status">{opponent?.ready ? 'Waiting for game to load...' : 'Both players joined. Ready up.'}</p>
                )}
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