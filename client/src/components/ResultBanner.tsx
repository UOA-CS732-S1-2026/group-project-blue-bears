import React, { useEffect, useState } from "react";
import "./ResultBanner.css";

export type ResultOutcome = "victory" | "defeat" | "draw";

interface ResultBannerProps {
  outcome: ResultOutcome;
}

const OUTCOME_CONFIG: Record<
  ResultOutcome,
  { title: string; subtitle: string }
> = {
  victory: {
    title: "Victory",
    subtitle: "You pulled the rope to your side!",
  },
  defeat: {
    title: "Defeat",
    subtitle: "Your enemy typed faster. Better luck next time.",
  },
  draw: {
    title: "Draw",
    subtitle: "It's a tie! Both players performed equally well.",
  }
};

const ResultBanner: React.FC<ResultBannerProps> = ({ outcome }) => {
  const [visible, setVisible] = useState(false);
  const config = OUTCOME_CONFIG[outcome];

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 80);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className={`result-banner result-banner--${outcome} ${visible ? "result-banner--visible" : ""}`}>
      <div className="result-banner__glow" />
      <h1 className="result-banner__title">{config.title}</h1>
      <p className="result-banner__subtitle">{config.subtitle}</p>
    </div>
  );
};

export default ResultBanner;