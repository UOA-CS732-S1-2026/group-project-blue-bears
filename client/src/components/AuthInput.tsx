interface AuthInputProps {
  label: string
  type?: string
  placeholder?: string
  value: string
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void
  autoFocus?: boolean
}

function AuthInput({ label, type = 'text', placeholder, value, onChange, onKeyDown, autoFocus }: AuthInputProps) {
  return (
    <div className="auth-field">
      <label className="auth-label">{label}</label>
      <input
        className="auth-input"
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        onKeyDown={onKeyDown}
        autoFocus={autoFocus}
      />
    </div>
  )
}

export default AuthInput