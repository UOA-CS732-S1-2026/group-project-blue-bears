import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import AuthHeader from '../components/AuthHeader'
import useSocket from '../hooks/useSocket'
import './AuthPages.css'
import './JoinLobbyPage.css'

interface RoomProbePayload {
  roomId?: string
  exists?: boolean
  isFull?: boolean
  players: unknown[]
}

function JoinLobbyCodePage() {
  const navigate = useNavigate()
  const { socket, connected } = useSocket()
  const [code, setCode] = useState('')
  const [message, setMessage] = useState('')
  const [checking, setChecking] = useState(false)
  const pendingCodeRef = useRef('')
  const timeoutRef = useRef<number | null>(null)

  const handleJoin = () => {
    const roomCode = code.trim().toUpperCase()

    if (!roomCode || checking) return

    if (!connected) {
      setMessage('Connecting to race server...')
      return
    }

    pendingCodeRef.current = roomCode
    setChecking(true)
    setMessage('')
    socket.emit('probe_room', { roomId: roomCode })

    if (timeoutRef.current) {
      window.clearTimeout(timeoutRef.current)
    }

    timeoutRef.current = window.setTimeout(() => {
      pendingCodeRef.current = ''
      setChecking(false)
      setMessage('Unable to check that code right now.')
    }, 5000)
  }

  useEffect(() => {
    const handleRoomProbe = (payload: RoomProbePayload) => {
      const roomCode = pendingCodeRef.current
      const probedRoomId = (payload.roomId || '').trim().toUpperCase()

      if (!roomCode || probedRoomId !== roomCode) {
        return
      }

      if (timeoutRef.current) {
        window.clearTimeout(timeoutRef.current)
        timeoutRef.current = null
      }

      setChecking(false)
      pendingCodeRef.current = ''

      if (payload.players.length === 0) {
        setMessage('No lobby found for that code.')
        return
      }

      if (payload.isFull === true || payload.players.length >= 2) {
        setMessage('Lobby is full. Please try another code.')
        return
      }

      navigate('/lobby', { state: { code: roomCode } })
    }

    socket.on('room_probe', handleRoomProbe)

    return () => {
      socket.off('room_probe', handleRoomProbe)
      if (timeoutRef.current) {
        window.clearTimeout(timeoutRef.current)
      }
    }
  }, [navigate, socket])

  return (
    <div className="auth-root">
      <AuthHeader back={() => navigate('/')}/>

      <main className="auth-main">
        <div className="join-card">
          <input
            className="join-input"
            type="text"
            placeholder="ENTER CODE"
            value={code}
            onChange={e => {
              setCode(e.target.value.toUpperCase())
              setMessage('')
            }}
            onKeyDown={e => e.key === 'Enter' && handleJoin()}
            autoFocus
            spellCheck={false}
          />
          <button
            className="join-btn"
            onClick={handleJoin}
            disabled={!code.trim() || checking || !connected}
          >
            {!connected ? 'CONNECTING' : checking ? 'CHECKING' : 'JOIN'}
          </button>
          {message && <p className="join-message">{message}</p>}
        </div>
      </main>

      <footer className="footer" />
    </div>
  )
}

export default JoinLobbyCodePage
