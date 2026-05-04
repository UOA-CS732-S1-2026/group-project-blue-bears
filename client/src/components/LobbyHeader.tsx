interface LobbyHeaderProps {
  roomCode: string
  onExit: () => void
}

function LobbyHeader({ roomCode, onExit }: LobbyHeaderProps) {
  return (
    <header className="lobby-header">
      <button className="lobby-exit" onClick={onExit}>
        Exit
      </button>
      <h1 className="lobby-title">TYPE-OF-WAR</h1>
      <p className="lobby-room-code">CODE: {roomCode || '------'}</p>
    </header>
  )
}

export default LobbyHeader
