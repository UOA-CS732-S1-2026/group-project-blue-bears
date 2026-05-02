import { Link } from "react-router-dom"


interface AuthHeaderProps {
  showAuth?: boolean
  center?: React.ReactNode
  exit?: () => void
  back?: () => void
}

function AuthHeader({ showAuth, center, exit, back }: AuthHeaderProps) {
  return (
    <header className="header">
      <Link to="/" className="header-logo">TYPE-OF-WAR</Link>

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
        {back && (
          <button className="header-exit-btn" onClick={back}>BACK</button>
        )}
      </div>
    </header>
  )
}

export default AuthHeader