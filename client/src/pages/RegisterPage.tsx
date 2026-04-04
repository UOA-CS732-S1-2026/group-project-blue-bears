import { useState } from 'react'
import AuthHeader from '../components/AuthHeader'
import AuthInput from '../components/AuthInput'
import './AuthPages.css'

function RegisterPage() {
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('')

  const handleRegister = () => {
    // TODO: connect to backend
    console.log({ firstName, lastName, username, email, password })
  }

  return (
    <div className="auth-root">
      <AuthHeader />
      <main className="auth-main">
        <div className="auth-card">
          <div className="auth-field-row">
            <AuthInput
              label="First Name"
              placeholder="Enter your first name"
              value={firstName}
              onChange={e => setFirstName(e.target.value)}
            />
            <AuthInput
              label="Last Name"
              placeholder="Enter your last name"
              value={lastName}
              onChange={e => setLastName(e.target.value)}
            />
          </div>

          <AuthInput
            label="Username"
            placeholder="Enter your username"
            value={username}
            onChange={e => setUsername(e.target.value)}
          />

          <AuthInput
            label="Email"
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={e => setEmail(e.target.value)}
          />

          <AuthInput
            label="Password"
            type="password"
            placeholder="Enter your password"
            value={password}
            onChange={e => setPassword(e.target.value)}
          />

          <button className="auth-btn" onClick={handleRegister}>
            Create account
          </button>
        </div>
      </main>
      <footer className="footer" />
    </div>
  )
}
export default RegisterPage