import type { ReactNode } from 'react'

interface PageHeaderUserCard {
  name: string
  rank: string
  avatarUrl?: string
  onViewProfile?: () => void
}

interface PageHeaderGuestActions {
  signInHref: string
  signUpHref: string
}

interface PageHeaderGuestBadge {
  topLabel: string
  bottomLabel: string
}

interface PageHeaderProps {
  title?: string
  onExit?: () => void
  leftContent?: ReactNode
  rightContent?: ReactNode
  userCard?: PageHeaderUserCard
  guestActions?: PageHeaderGuestActions
  guestBadge?: PageHeaderGuestBadge
  className?: string
  titleClassName?: string
  leftContentClassName?: string
  rightContentClassName?: string
  userCardClassName?: string
  guestActionsClassName?: string
  guestBadgeClassName?: string
  exitLabel?: string
}

function PageHeader({
  title,
  onExit,
  leftContent,
  rightContent,
  userCard,
  guestActions,
  guestBadge,
  className,
  titleClassName,
  leftContentClassName,
  rightContentClassName,
  userCardClassName,
  guestActionsClassName,
  guestBadgeClassName,
  exitLabel = 'Exit',
}: PageHeaderProps) {
  const headerClassName = className ? `page-header ${className}` : 'page-header'
  const headingClassName = titleClassName
    ? `page-header-title ${titleClassName}`
    : 'page-header-title'
  const leftClassName = leftContentClassName
    ? `page-header-left ${leftContentClassName}`
    : 'page-header-left'
  const asideClassName = rightContentClassName
    ? `page-header-right ${rightContentClassName}`
    : 'page-header-right'
  const userCardRootClassName = userCardClassName
    ? `page-header-user-card ${userCardClassName}`
    : 'page-header-user-card'
  const guestActionsRootClassName = guestActionsClassName
    ? `page-header-auth-actions ${guestActionsClassName}`
    : 'page-header-auth-actions'
  const guestBadgeRootClassName = guestBadgeClassName
    ? `page-header-guest-badge ${guestBadgeClassName}`
    : 'page-header-guest-badge'
  const userInitial = userCard?.name?.slice(0, 1).toUpperCase() ?? 'U'

  let resolvedRightContent = rightContent

  if (!resolvedRightContent && userCard) {
    resolvedRightContent = (
      <div className={userCardRootClassName}>
        <div className="page-header-user-card-copy">
          <div className="page-header-user-card-name">{userCard.name}</div>
          <div className="page-header-user-card-rank">RANK: {userCard.rank}</div>
          <button
            className="page-header-user-card-button"
            type="button"
            onClick={userCard.onViewProfile}
          >
            VIEW PROFILE
          </button>
        </div>

        <div className="page-header-user-card-avatar" aria-hidden="true">
          {userCard.avatarUrl ? (
            <img
              src={userCard.avatarUrl}
              alt={`${userCard.name} avatar`}
              className="page-header-user-card-avatar-image"
            />
          ) : (
            <span>{userInitial}</span>
          )}
        </div>
      </div>
    )
  }

  if (!resolvedRightContent && guestActions) {
    resolvedRightContent = (
      <div className={guestActionsRootClassName}>
        <a href={guestActions.signUpHref}>Sign Up</a>
        <a href={guestActions.signInHref}>Sign In</a>
      </div>
    )
  }

  if (!resolvedRightContent && guestBadge) {
    resolvedRightContent = (
      <div className={guestBadgeRootClassName}>
        <div className="page-header-guest-badge-top">{guestBadge.topLabel}</div>
        <div className="page-header-guest-badge-bottom">{guestBadge.bottomLabel}</div>
      </div>
    )
  }

  return (
    <header className={headerClassName}>
      <div className={leftClassName}>
        {leftContent ?? (
          <button className="page-header-exit" onClick={onExit}>
            {exitLabel}
          </button>
        )}
      </div>
      <h1 className={headingClassName}>{title}</h1>
      <div className={asideClassName}>{resolvedRightContent}</div>
    </header>
  )
}

export default PageHeader
