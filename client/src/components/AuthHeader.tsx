import PageHeader from './PageHeader'

interface AuthHeaderProps {
  showAuth?: boolean
}

function AuthHeader({ showAuth = false }: AuthHeaderProps) {
  return (
    <PageHeader
      className="header"
      leftContentClassName="header-left"
      titleClassName="header-title"
      rightContentClassName="header-right"
      leftContent={<span className="header-logo">TYPE-OF-WAR</span>}
      guestActions={showAuth ? { signUpHref: '/register', signInHref: '/login' } : undefined}
      guestActionsClassName={showAuth ? 'header-actions' : undefined}
    />
  )
}

export default AuthHeader
