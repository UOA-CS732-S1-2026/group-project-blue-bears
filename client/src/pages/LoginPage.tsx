import { useState } from 'react'
import AuthHeader from '../components/AuthHeader'
import AuthInput from '../components/AuthInput'
import './AuthPages.css'

function LoginPage() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [rememberMe, setRememberMe] = useState(false)

  const handleLogin = () => {
    // TODO: connect to backend
    console.log({ username, password, rememberMe })
  }

  return (
    <div className="auth-root">
      <AuthHeader />
      <main className="auth-main">
        <div className="auth-card">
          <h1 className="auth-title">Welcome Back</h1>
          <p className="auth-subtitle">Log in to your account to continue</p>

          <AuthInput
            label="Username or email"
            placeholder="Enter your username"
            value={username}
            onChange={e => setUsername(e.target.value)}
          />

          <AuthInput
            label="Password"
            type="password"
            placeholder="Enter your password"
            value={password}
            onChange={e => setPassword(e.target.value)}
          />

          <div className="auth-row">
            <label className="auth-remember">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={e => setRememberMe(e.target.checked)}
              />
              <span>Remember Me</span>
            </label>
            <a href="#" className="auth-link">Forgot Your Password?</a>
          </div>

          <button className="auth-btn" onClick={handleLogin}>Login</button>

          <p className="auth-switch">
            No account? <a href="/register" className="auth-link">Sign up</a>
          </p>
        </div>
      </main>
      <footer className="footer" />
    </div>
  )
}

export default LoginPage