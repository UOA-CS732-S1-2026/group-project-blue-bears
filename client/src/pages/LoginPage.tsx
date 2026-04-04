import AuthHeader from '../components/AuthHeader'
import AuthInput from '../components/AuthInput'

function LoginPage() {
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
            value=""
            onChange={() => { }}
          />

          <AuthInput
            label="Password"
            type="password"
            placeholder="Enter your password"
            value=""
            onChange={() => { }}
          />

          <div className="auth-row">
            <label className="auth-remember">
              <input type="checkbox" />
              <span>Remember Me</span>
            </label>
            <a href="#" className="auth-link">Forgot Your Password?</a>
          </div>

          <button className="auth-btn">Login</button>

          <p className="auth-switch">
            No account? <a href="/register" className="auth-link">Sign up</a>
          </p>
        </div>
      </main>
      <footer className="auth-footer" />
    </div>
  )
}

export default LoginPage