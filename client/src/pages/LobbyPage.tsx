import "./LobbyPage.css"
import LobbyHeader from "../components/LobbyHeader";
import LobbyCard from "../components/LobbyCard";


function LobbyPage() {

    return (
        <div className="lobby-container">
            <LobbyHeader />
            <div className="lobby-content">
                <LobbyCard name="MARK-WENTER" rank={1} wins={1} />
                <p>ROUND 0 (0-0)</p>
                <LobbyCard name="DAVID" rank={2} wins={1} />
            </div>
            <button className="lobby-start-button">START GAME</button>
        </div>
    )
}

export default LobbyPage;