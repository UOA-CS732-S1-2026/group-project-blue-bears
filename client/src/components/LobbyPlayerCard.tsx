export interface LobbyPlayer {
  name: string
  code: string
  wins: string
  initials: string
  side: 'left' | 'right'
  avatarUrl?: string
}

interface LobbyPlayerCardProps {
  player: LobbyPlayer
  onViewProfile: () => void
}

function LobbyPlayerCard({ player, onViewProfile }: LobbyPlayerCardProps) {
  return (
    <article
      className={`lobby-card ${player.side === 'left' ? 'lobby-card-left' : 'lobby-card-right'}`}
    >
      {player.side === 'left' && (
        <div className="lobby-card-meta">
          <p className="lobby-player-name">{player.name}</p>
          <p className="lobby-player-code">{player.code}</p>
          <p className="lobby-player-wins">Wins: {player.wins}</p>
          <button className="lobby-profile-link" onClick={onViewProfile}>
            View Profile
          </button>
        </div>
      )}

      <div className={`lobby-portrait lobby-portrait-${player.side}`}>
        {player.avatarUrl ? (
          <img
            src={player.avatarUrl}
            alt={`${player.name} avatar`}
            className="lobby-avatar-image"
          />
        ) : (
          <span>{player.initials}</span>
        )}
      </div>

      {player.side === 'right' && (
        <div className="lobby-card-meta">
          <p className="lobby-player-name">{player.name}</p>
          <p className="lobby-player-code">{player.code}</p>
          <p className="lobby-player-wins">Wins: {player.wins}</p>
          <button className="lobby-profile-link" onClick={onViewProfile}>
            View Profile
          </button>
        </div>
      )}
    </article>
  )
}

export default LobbyPlayerCard
