import React, { useEffect, useState } from "react";
import "./StatsTable.css";

export interface PlayerStats {
  wpm: number;
}

interface StatsTableProps {
  playerStats: PlayerStats;
  opponentStats: PlayerStats;
  duration: string;
}

interface StatRowProps {
  label: string;
  playerValue: string;
  opponentValue: string;
  visible: boolean;
}

const StatRow: React.FC<StatRowProps> = ({ label, playerValue, opponentValue, visible }) => (
  <tr className={`stats-table__row ${visible ? "stats-table__row--visible" : ""}`}>
    <td className="stats-table__metric">{label}</td>
    <td className="stats-table__you">{playerValue}</td>
    <td className="stats-table__opponent">{opponentValue}</td>
  </tr>
);

const StatsTable: React.FC<StatsTableProps> = ({ playerStats, opponentStats, duration }) => {
  const [headingVisible, setHeadingVisible] = useState(false);
  const [rowsVisible, setRowsVisible] = useState([false]);

  useEffect(() => {
    const headingTimer = setTimeout(() => setHeadingVisible(true), 200);
    const row1Timer = setTimeout(() => {
      setRowsVisible([true]);
    }, 400);

    return () => {
      clearTimeout(headingTimer);
      clearTimeout(row1Timer);
    };
  }, []);

  return (
    <div className="stats-table__wrapper">
      <h2 className={`stats-table__heading ${headingVisible ? "stats-table__heading--visible" : ""}`}>
        Battle Statistics
      </h2>

      <table className="stats-table">
        <thead>
          <tr>
            <th className="stats-table__th stats-table__th--metric">Metric</th>
            <th className="stats-table__th stats-table__th--you">You</th>
            <th className="stats-table__th stats-table__th--opponent">Opponent</th>
          </tr>
        </thead>
        <tbody>
          <StatRow
            label="WPM"
            playerValue={String(playerStats.wpm)}
            opponentValue={String(opponentStats.wpm)}
            visible={rowsVisible[0]}
          />
        </tbody>
      </table>

      <div className="stats-table__duration">
        Duration: <span className="stats-table__duration-value">{duration}</span>
      </div>
    </div>
  );
};

export default StatsTable;