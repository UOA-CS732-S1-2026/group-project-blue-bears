export interface LobbyPlayer {
  name: string
  side: 'left' | 'right'
  avatarKind: 'guest' | 'question' | 'initials'
  initials?: string
  avatarUrl?: string
}

interface LobbyPlayerCardProps {
  player: LobbyPlayer
}

function LobbyPlayerCard({ player }: LobbyPlayerCardProps) {
  const avatarContent = () => {
    if (player.avatarUrl) {
      return (
        <img
          src={player.avatarUrl}
          alt={`${player.name} avatar`}
          className="lobby-avatar-image"
        />
      )
    }

    if (player.avatarKind === 'guest') {
      return (
        <span className="lobby-guest-icon" aria-hidden="true">
          <span className="lobby-guest-head" />
          <span className="lobby-guest-body" />
        </span>
      )
    }

    if (player.avatarKind === 'question') {
      return <span className="lobby-avatar-question">?</span>
    }

    return <span className="lobby-avatar-initials">{player.initials || '??'}</span>
  }

  return (
    <article
      className={`lobby-card ${player.side === 'left' ? 'lobby-card-left' : 'lobby-card-right'}`}
    >
      {player.side === 'left' && (
        <div className="lobby-card-meta">
          <p className="lobby-player-name">{player.name}</p>
        </div>
      )}

      <div className={`lobby-portrait lobby-portrait-${player.side}`}>
        {avatarContent()}
      </div>

      {player.side === 'right' && (
        <div className="lobby-card-meta">
          <p className="lobby-player-name">{player.name}</p>
        </div>
      )}
    </article>
  )
}

export default LobbyPlayerCard