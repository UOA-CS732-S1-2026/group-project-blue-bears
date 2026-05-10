import React, { useEffect, useState } from "react";
import "./ActionButtons.css";

interface ActionButtonsProps {
  onPlayAgain: () => void;
  onMainMenu: () => void;
  isPlayerReady?: boolean;
  isOpponentReady?: boolean;
  hasOpponentLeft?: boolean;
}

const ActionButtons: React.FC<ActionButtonsProps> = ({ 
  onPlayAgain, 
  onMainMenu,
  isPlayerReady = false,
  isOpponentReady = false,
  hasOpponentLeft = false,
}) => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 750);
    return () => clearTimeout(t);
  }, []);

  const isPlayAgainDisabled = isPlayerReady || hasOpponentLeft;
  const getPlayAgainTitle = () => {
    if (hasOpponentLeft) return "Opponent has left";
    if (isPlayerReady) {
      return isOpponentReady ? "Starting new race..." : "Waiting for opponent...";
    }
    return "Ready to play again";
  };

  const getPlayAgainLabel = () => {
    if (hasOpponentLeft) return "Opponent Left";
    if (isPlayerReady) {
      return isOpponentReady ? "Starting..." : "Waiting...";
    }
    return "Play Again";
  };

  return (
    <div className={`action-buttons ${visible ? "action-buttons--visible" : ""}`}>
      <button
        className={`action-btn action-btn--secondary ${
          isPlayAgainDisabled ? "action-btn--disabled" : ""
        }`}
        onClick={onPlayAgain}
        disabled={isPlayAgainDisabled}
        title={getPlayAgainTitle()}
      >
        <span className="action-btn__label">
          {getPlayAgainLabel()}
        </span>
        <span className="action-btn__shine" />
      </button>

      <button
        className="action-btn action-btn--ghost"
        onClick={onMainMenu}
      >
        <span className="action-btn__label">Main Menu</span>
        <span className="action-btn__shine" />
      </button>
    </div>
  );
};

export default ActionButtons;