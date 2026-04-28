import { Link } from "react-router-dom"


interface AuthHeaderProps {
  showAuth?: boolean
  center?: React.ReactNode
  exit?: () => void
}

function AuthHeader({ showAuth, center, exit }: AuthHeaderProps) {
  return (
    <header className="header">
      <span className="header-logo">TYPE-OF-WAR</span>

      <div className="header-center">
        {center}
      </div>

      <div className="header-right">
        {showAuth && (
          <>
            <Link to="/register">Sign Up</Link>
            <Link to="/login">Login</Link>
          </>
        )}
        {exit && (
          <button className="header-exit-btn" onClick={exit}>EXIT</button>
        )}
      </div>
    </header>
  )
}

export default AuthHeader