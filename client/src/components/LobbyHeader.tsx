import ExitButton from "./ExitButton";

function LobbyHeader() {
    return (
    <header className="header">
        <ExitButton />
        <div>LOBBY: LOBBYNAME</div>
        <div>NAMECARD</div>
    </header>
  )
}

export default LobbyHeader;