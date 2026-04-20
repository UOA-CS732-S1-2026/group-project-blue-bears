import PageHeader from './PageHeader'

interface ProfileMatchHistoryProps {
  onExit: () => void
  profileName: string
  sessionUser?: {
    name: string
    rank: string
    avatarUrl?: string
  } | null
  onViewSessionProfile?: () => void
}

function ProfileMatchHistory({
  onExit,
  profileName,
  sessionUser,
  onViewSessionProfile,
}: ProfileMatchHistoryProps) {
  const placeholderRows = Array.from({ length: 10 }, (_, index) => index)

  return (
    <div className="profile-history-shell">
      <PageHeader
        title={`PROFILE: ${profileName}`}
        onExit={onExit}
        className="profile-page-header"
        titleClassName="profile-page-title"
        rightContentClassName="profile-page-header-right"
        guestBadge={!sessionUser ? { topLabel: 'WINS: N/A', bottomLabel: 'LOGIN' } : undefined}
        guestBadgeClassName={!sessionUser ? 'profile-page-banner' : undefined}
        userCard={
          sessionUser
            ? {
                name: sessionUser.name,
                rank: sessionUser.rank,
                avatarUrl: sessionUser.avatarUrl,
                onViewProfile: onViewSessionProfile,
              }
            : undefined
        }
        userCardClassName={sessionUser ? 'profile-page-session-card' : undefined}
      />

      <main className="profile-history-board">
        <section className="profile-left-card">
          <div className="profile-left-frame" />
          <div className="profile-left-card-body" />

          <div className="profile-avatar-rect" />

          <div className="profile-info-stack">
            <div className="profile-name">{profileName}</div>
            <div className="profile-id">#0001(id)</div>

            <div className="profile-records-row">
              <div className="profile-record-card">
                <div className="profile-record-card-bar" />
                <div className="profile-record-card-label">Wins</div>
                <div className="profile-record-card-value">102</div>
              </div>

              <div className="profile-record-card">
                <div className="profile-record-card-bar" />
                <div className="profile-record-card-label">Losses</div>
                <div className="profile-record-card-value">48</div>
              </div>
            </div>

            <div className="profile-total-card">
              <div className="profile-total-card-bar" />
              <div className="profile-total-card-label">Total Match</div>
              <div className="profile-total-card-value">150</div>
            </div>
          </div>

          <div className="profile-bottom-stats">
            <div className="profile-bottom-card">
              <div className="profile-bottom-card-bar" />
              <div className="profile-bottom-card-label">Win Rate</div>
              <div className="profile-bottom-card-value">68%</div>
            </div>

            <div className="profile-bottom-card">
              <div className="profile-bottom-card-bar" />
              <div className="profile-bottom-card-label">Avg WPM</div>
              <div className="profile-bottom-card-value">74</div>
            </div>

            <div className="profile-bottom-card">
              <div className="profile-bottom-card-bar" />
              <div className="profile-bottom-card-label">Accuracy</div>
              <div className="profile-bottom-card-value">96%</div>
            </div>
          </div>
        </section>

        <section className="match-history-panel">
          <div className="match-history-title">MATCH HISTORY</div>

          <div className="match-history-scroll">
            <div className="match-row">
              <div className="match-row-bg match-row-bg-win" />
              <div className="match-row-tag match-row-tag-win">[WIN]</div>
              <div className="match-row-text">vs MARK 78 WPM Ac 96% 2026-3-25</div>
            </div>

            <div className="match-row">
              <div className="match-row-bg match-row-bg-loss" />
              <div className="match-row-tag match-row-tag-loss">[LOSS]</div>
              <div className="match-row-text">vs MARK 65 WPM Ac 91% 2026-3-25</div>
            </div>

            {placeholderRows.map(row => (
              <div className="match-row-empty" key={row} />
            ))}
          </div>
        </section>
      </main>
    </div>
  )
}

export default ProfileMatchHistory
