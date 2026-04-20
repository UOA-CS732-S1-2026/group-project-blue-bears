export interface LobbyPlayer {
  name: string
  code: string
  wins: string
  initials: string
  side: 'left' | 'right'
  avatarUrl?: string
  isPlaceholder?: boolean
  isReady?: boolean
}

interface LobbyPlayerCardProps {
  player: LobbyPlayer
  onViewProfile?: () => void
  hideActions?: boolean
}

function LobbyPlayerCard({ player, onViewProfile, hideActions = false }: LobbyPlayerCardProps) {
  const isPlaceholder = Boolean(player.isPlaceholder)

  return (
    <article
      className={`lobby-card ${player.side === 'left' ? 'lobby-card-left' : 'lobby-card-right'}${
        isPlaceholder ? ' lobby-card-placeholder' : ''
      }`}
    >
      {player.side === 'left' && (
        <div className="lobby-card-meta">
          <p className="lobby-player-name">{player.name}</p>
          {!isPlaceholder && (
            <>
              <p className="lobby-player-code">{player.code}</p>
              <p className="lobby-player-wins">Wins: {player.wins}</p>
              {!hideActions && (
                <button className="lobby-profile-link" onClick={onViewProfile}>
                  View Profile
                </button>
              )}
            </>
          )}
        </div>
      )}

      <div
        className={`lobby-portrait lobby-portrait-${player.side}${
          isPlaceholder ? ' lobby-portrait-placeholder' : ''
        }`}
      >
        {player.avatarUrl ? (
          <img
            src={player.avatarUrl}
            alt={`${player.name} avatar`}
            className="lobby-avatar-image"
          />
        ) : !isPlaceholder ? (
          <span>{player.initials}</span>
        ) : null}
      </div>

      {player.side === 'right' && (
        <div className="lobby-card-meta">
          <p className="lobby-player-name">{player.name}</p>
          {!isPlaceholder && (
            <>
              <p className="lobby-player-code">{player.code}</p>
              <p className="lobby-player-wins">Wins: {player.wins}</p>
              {!hideActions && (
                <button className="lobby-profile-link" onClick={onViewProfile}>
                  View Profile
                </button>
              )}
            </>
          )}
        </div>
      )}
    </article>
  )
}

export default LobbyPlayerCard
