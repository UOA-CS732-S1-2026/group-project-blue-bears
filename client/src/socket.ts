/**
 * Exposes a singleton Socket.IO client instance for the app.
 * The connection is intentionally manual so components control when to connect.
 */
import { io } from 'socket.io-client'

const socketUrl = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000'

const socket = io(socketUrl, {
  autoConnect: false,
})

export default socket
