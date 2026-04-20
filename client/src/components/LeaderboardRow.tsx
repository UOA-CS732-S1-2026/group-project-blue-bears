export interface Player {
  rank: number
  name: string
  code: string
  avgWpm: number
  accuracy: number
  wins: number
  totalMatch: number
  avatarUrl?: string
  isMe?: boolean
}

function getRankStyle(rank: number): string {
  if (rank === 1) return 'rank-badge rank-badge--gold'
  if (rank === 2) return 'rank-badge rank-badge--silver'
  if (rank === 3) return 'rank-badge rank-badge--bronze'
  return 'rank-badge rank-badge--blue'
}

function LeaderboardRow({ player }: { player: Player }) {
  return (
    <div className={`lb-row ${player.isMe ? 'lb-row--me' : ''}`}>
      <div className="lb-col lb-col--player">
        <span className={getRankStyle(player.rank)}>{player.rank}</span>
        <div className="lb-avatar">
          {player.avatarUrl
            ? <img src={player.avatarUrl} alt={player.name} />
            : <span className="lb-avatar-placeholder" />
          }
        </div>
        <div className="lb-player-info">
          <span className="lb-player-name">{player.name}</span>
          <span className="lb-player-code">{player.code}</span>
        </div>
      </div>
      <span className="lb-col lb-col--wpm lb-wpm-value">{player.avgWpm}</span>
      <span className="lb-col lb-col--accuracy">{player.accuracy}%</span>
      <span className="lb-col lb-col--wins">{player.wins}</span>
      <span className="lb-col lb-col--total">{player.totalMatch}</span>
    </div>
  )
}

export default LeaderboardRow