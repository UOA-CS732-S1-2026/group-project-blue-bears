import { useState } from 'react'
import { useNavigate, useLocation, Link } from 'react-router-dom'
import AuthHeader from '../components/AuthHeader'
import AuthInput from '../components/AuthInput'
import { loginUser } from '../services/authService'
import './AuthPages.css'

function LoginPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const successMessage = location.state?.message
  const title = location.state?.title ?? 'Sign In'
  const subtitle = location.state?.subtitle ?? 'Log in to your account to continue'

  const [emailOrUsername, setEmailOrUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleLogin = async () => {
    setError('')
    setLoading(true)

    try {
      const data = await loginUser({ emailOrUsername: emailOrUsername, password })
      localStorage.setItem('token', data.token)
      localStorage.setItem('userId', data.userId)
      localStorage.setItem('email', data.email)
      localStorage.setItem('username', data.username)
      navigate('/')
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-root">
      <AuthHeader back={() => navigate('/')}/>
      <main className="auth-main">
        <div className="auth-card">
          <h1 className="auth-title">{title}</h1>
          <p className="auth-subtitle">{subtitle}</p>

          {(error || successMessage) && (
            <p style={{ color: error ? 'var(--accent-red)' : 'var(--accent-green)', fontSize: '13px', margin: 0 }}>
              {error || successMessage}
            </p>
          )}

          <AuthInput
            label="Username or email"
            placeholder="Enter your username or email"
            value={emailOrUsername}
            onChange={e => setEmailOrUsername(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleLogin()}
            autoFocus
          />

          <AuthInput
            label="Password"
            type="password"
            showToggle
            placeholder="Enter your password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleLogin()}
          />

          <button className="auth-btn" onClick={handleLogin} disabled={loading}>
            {loading ? 'Logging in...' : 'Login'}
          </button>

          <p className="auth-switch">
            No account? <Link to="/register" className="auth-link">Sign up</Link>
          </p>
        </div>
      </main>
      <footer className="footer" />
    </div>
  )
}

export default LoginPage
