import { Link } from "react-router-dom"


interface AuthHeaderProps {
  showAuth?: boolean
  center?: React.ReactNode
  exit?: () => void
  back?: () => void
}

function getUsernameFromToken(): string | null {
  const token = localStorage.getItem('token')
  if (!token) return null
  try {
    const payload = JSON.parse(atob(token.split('.')[1]))
    return payload.username ?? null
  } catch {
    return null
  }
}

function AuthHeader({ showAuth, center, exit, back }: AuthHeaderProps) {
  const isLoggedIn = !!localStorage.getItem('token')
  const username = localStorage.getItem('username') ?? getUsernameFromToken()

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('userId')
    localStorage.removeItem('email')
    localStorage.removeItem('username')
    globalThis.location.href = '/'
  }

  return (
    <header className="header">
      <Link to="/" className="header-logo">TYPE-OF-WAR</Link>

      <div className="header-center">
        {center}
      </div>

      <div className="header-right">
        {showAuth && (
          isLoggedIn ? (
            <>
              {username && <span className="header-username">{username}</span>}
              <button className="header-logout-btn" onClick={handleLogout}>Log Out</button>
            </>
          ) : (
            <>
              <Link to="/register">Sign Up</Link>
              <Link to="/login">Login</Link>
            </>
          )
        )}
        {exit && (
          <button className="header-exit-btn" onClick={exit}>EXIT</button>
        )}
        {back && (
          <button className="header-exit-btn" onClick={back}>BACK</button>
        )}
      </div>
    </header>
  )
}

export default AuthHeader