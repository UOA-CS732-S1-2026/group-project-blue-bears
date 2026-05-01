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
      socket.disconnect()
    }
  }, [])

  return { socket, connected }
}

export default useSocket
