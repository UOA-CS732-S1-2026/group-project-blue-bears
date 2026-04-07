
interface LobbyCardProps {
    name: string;
    rank: number;
    wins: number;
}

function LobbyCard({ name, rank, wins }: LobbyCardProps) {

    return (
        <div className="lobby-card">
            <div className="lobby-player-stats">
                <p>{name}</p>
                <div id="rank">{`#${rank}`}</div>
                <div id="wins">{`WINS: ${wins}`}</div>
                <div id="view-profile">VIEW PROFILE</div>
            </div>
            <div className="lobby-card-profile">
                <div>test1</div>
            </div>
        </div>
    )
}


export default LobbyCard;