interface AuthHeaderProps {
  showAuth?: boolean
}

function AuthHeader({ showAuth = false }: AuthHeaderProps) {
  return (
    <header className="header">
      <span className="header-logo">TYPE-OF-WAR</span>
      {showAuth && (
        <div className="header-actions">
          <a href="/register">Sign Up</a>
          <a href="/login">Login</a>
        </div>
      )}
    </header>
  )
}

export default AuthHeader