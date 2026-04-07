import React, { useEffect, useState } from "react";
import "./StatsTable.css";

export interface PlayerStats {
  wpm: number;
  accuracy: number;
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
  delay: number;
}

const StatRow: React.FC<StatRowProps> = ({ label, playerValue, opponentValue, delay }) => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), delay);
    return () => clearTimeout(t);
  }, [delay]);

  return (
    <tr className={`stats-table__row ${visible ? "stats-table__row--visible" : ""}`}>
      <td className="stats-table__metric">{label}</td>
      <td className="stats-table__you">{playerValue}</td>
      <td className="stats-table__opponent">{opponentValue}</td>
    </tr>
  );
};

const StatsTable: React.FC<StatsTableProps> = ({ playerStats, opponentStats, duration }) => {
  const [headerVisible, setHeaderVisible] = useState(false);
  const [durationVisible, setDurationVisible] = useState(false);

  useEffect(() => {
    const t1 = setTimeout(() => setHeaderVisible(true), 300);
    const t2 = setTimeout(() => setDurationVisible(true), 700);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  return (
    <div className="stats-table__wrapper">
      <h2 className={`stats-table__heading ${headerVisible ? "stats-table__heading--visible" : ""}`}>
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
            delay={400}
          />
          <StatRow
            label="Accuracy"
            playerValue={`${playerStats.accuracy}%`}
            opponentValue={`${opponentStats.accuracy}%`}
            delay={520}
          />
        </tbody>
      </table>

      <div className={`stats-table__duration ${durationVisible ? "stats-table__duration--visible" : ""}`}>
        Duration: <span className="stats-table__duration-value">{duration}</span>
      </div>
    </div>
  );
};

export default StatsTable;