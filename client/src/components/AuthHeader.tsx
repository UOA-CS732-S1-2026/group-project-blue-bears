import { Link } from "react-router-dom"


interface AuthHeaderProps {
  showAuth?: boolean
}

function AuthHeader({ showAuth = false }: AuthHeaderProps) {
  return (
    <header className="header">
      <span className="header-logo">TYPE-OF-WAR</span>
      {showAuth && (
        <div className="header-actions">
          <Link to="/register">Sign Up</Link>
          <Link to="/login">Login</Link>
        </div>
      )}
    </header>
  )
}

export default AuthHeader