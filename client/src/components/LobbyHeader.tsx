interface LobbyHeaderProps {
  title: string
  userWins: string
  userName: string
  onExit: () => void
}

function LobbyHeader({ title, userWins, userName, onExit }: LobbyHeaderProps) {
  return (
    <header className="lobby-header">
      <button className="lobby-exit" onClick={onExit}>
        Exit
      </button>
      <h1 className="lobby-title">{title}</h1>
      <div className="lobby-user-badge">
        <span className="lobby-user-wins">Wins: {userWins}</span>
        <span className="lobby-user-name">{userName}</span>
      </div>
    </header>
  )
}

export default LobbyHeader
