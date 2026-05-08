/**
 * Provides a shared Socket.IO connection lifecycle and connection status for React components.
 * The hook connects when mounted and disconnects when unmounted.
 */
import { useEffect, useState } from 'react'
import socket from '../socket'

function useSocket() {
  const [connected, setConnected] = useState(socket.connected)

  useEffect(() => {
    const handleConnect = () => setConnected(true)
    const handleDisconnect = () => setConnected(false)

    socket.on('connect', handleConnect)
    socket.on('disconnect', handleDisconnect)

    if (!socket.connected) {
      socket.connect()
    }

    return () => {
      socket.off('connect', handleConnect)
      socket.off('disconnect', handleDisconnect)
      // Do NOT call socket.disconnect() here — the socket is a module-level singleton
      // shared across all pages. Disconnecting on unmount (e.g. when LobbyPage gives way
      // to GamePage) would drop the server-side room membership and kill all in-race events.
    }
  }, [])

  return { socket, connected }
}

export default useSocket
