import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import AuthHeader from '../components/AuthHeader'
import AuthInput from '../components/AuthInput'
import { registerUser } from '../services/authService'
import './AuthPages.css'

function RegisterPage() {
  const navigate = useNavigate()
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleRegister = async () => {
    setError('')
    setLoading(true)

    try {
      await registerUser({ firstName, lastName, username, email, password })
      navigate('/login', { state: { message: 'Account created! Please log in.' } })
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

          <p style={{ color: 'var(--accent-red)', fontSize: '13px', minHeight: '18px' }}>{error}</p>

          <div className="auth-field-row">
            <AuthInput
              label="First Name"
              placeholder="Enter your first name"
              value={firstName}
              onChange={e => setFirstName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleRegister()}
              autoFocus
            />
            <AuthInput
              label="Last Name"
              placeholder="Enter your last name"
              value={lastName}
              onChange={e => setLastName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleRegister()}
            />
          </div>

          <AuthInput
            label="Username"
            placeholder="Enter your username"
            value={username}
            onChange={e => setUsername(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleRegister()}
          />

          <AuthInput
            label="Email"
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleRegister()}
          />

          <AuthInput
            label="Password"
            type="password"
            placeholder="Enter your password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleRegister()}
          />

          <button className="auth-btn" onClick={handleRegister} disabled={loading}>
            {loading ? 'Creating account...' : 'Create account'}
          </button>

          <p className="auth-switch">
            Already have an account? <a href="/login" className="auth-link">Login</a>
          </p>
        </div>
      </main>
      <footer className="footer" />
    </div>
  )
}

export default RegisterPage