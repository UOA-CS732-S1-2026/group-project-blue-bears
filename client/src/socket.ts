/**
 * Exposes a singleton Socket.IO client instance for the app.
 * The connection is intentionally manual so components control when to connect.
 */
import { io } from 'socket.io-client'

const socketUrl = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000'

const socket = io(socketUrl, {
  autoConnect: false,
  // Read the token at connect-time (not module-load time) so login/logout is reflected
  auth: (cb) => { cb({ token: localStorage.getItem('token') ?? null }) },
})

// When the server detects another session for the same account, kick this tab out
socket.on('session_expired', () => {
  localStorage.removeItem('token')
  localStorage.removeItem('userId')
  localStorage.removeItem('email')
  localStorage.removeItem('username')
  // Clear lobby session state — React's useEffect cleanup does not run on a hard redirect,
  // so without this the stale room code would cause "No lobby found" after the next login.
  sessionStorage.removeItem('activeLobbyCode')
  sessionStorage.removeItem('activeLobbyUserId')
  sessionStorage.setItem('flash', 'You were signed out because your account was opened in another window.')
  window.location.href = '/'
})

export default socket
